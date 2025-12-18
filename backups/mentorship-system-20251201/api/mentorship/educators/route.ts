import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Listar educadores (público)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type') // 'instructor' | 'mentor' | null (todos)
  const specialty = searchParams.get('specialty')
  const available = searchParams.get('available')

  console.log('🔍 [educators] Listando educadores:', { type, specialty, available })

  let query = supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, email, avatar_url),
      specialties:educator_specialties (
        specialty:specialty_id (id, name, slug, icon)
      )
    `)
    .eq('status', 'active')
    .order('rating_avg', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  if (available === 'true') {
    query = query.eq('is_available', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ [educators] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtrar por especialidad si se especificó
  let filteredData = data
  if (specialty) {
    filteredData = data?.filter(educator =>
      educator.specialties?.some((s: any) => s.specialty?.slug === specialty)
    ) || []
  }

  console.log('✅ [educators] Encontrados:', filteredData?.length || 0)
  return NextResponse.json({ data: filteredData })
}

// POST: Solicitar ser educador (requiere auth)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { display_name, bio, tagline, specialty_ids } = body

  console.log('🔍 [educators] Solicitud de educador:', { userId: user.id, display_name })

  // Verificar si ya es educador
  const { data: existing } = await supabase
    .from('educators')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ya tienes un perfil de educador' }, { status: 400 })
  }

  // Crear slug único
  const slug = display_name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  // Crear perfil de educador (pendiente hasta aprobar examen)
  const { data: educator, error } = await supabase
    .from('educators')
    .insert({
      user_id: user.id,
      display_name,
      slug: `${slug}-${Date.now().toString(36)}`,
      bio,
      tagline,
      type: 'instructor',
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [educators] Error creando:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Agregar especialidades si se proporcionaron
  if (specialty_ids && specialty_ids.length > 0) {
    const specialtiesData = specialty_ids.map((sid: string) => ({
      educator_id: educator.id,
      specialty_id: sid,
      exam_passed: false
    }))

    await supabase.from('educator_specialties').insert(specialtiesData)
  }

  console.log('✅ [educators] Perfil creado:', educator.id)
  return NextResponse.json({ data: educator }, { status: 201 })
}
