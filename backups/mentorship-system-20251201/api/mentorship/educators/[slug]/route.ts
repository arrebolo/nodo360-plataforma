import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Detalle de educador (público)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params

  console.log('🔍 [educator] Obteniendo perfil:', slug)

  const { data, error } = await supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, email, avatar_url),
      specialties:educator_specialties (
        level,
        verified_at,
        specialty:specialty_id (id, name, slug, icon, description)
      ),
      achievements:educator_achievements (
        id, type, title, description, icon_url, awarded_at
      ),
      availability:educator_availability (
        day_of_week, start_time, end_time, timezone
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    console.error('❌ [educator] No encontrado:', error)
    return NextResponse.json({ error: 'Educador no encontrado' }, { status: 404 })
  }

  // Obtener últimas reviews
  const { data: reviews } = await supabase
    .from('session_reviews')
    .select(`
      id, rating, comment, created_at,
      session:session_id (
        student:student_id (full_name, avatar_url)
      )
    `)
    .eq('session_id.educator_id', data.id)
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('✅ [educator] Encontrado:', data.display_name)
  return NextResponse.json({ data: { ...data, recent_reviews: reviews || [] } })
}

// PUT: Actualizar perfil (solo el propio educador)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { display_name, bio, tagline, hourly_rate_credits, is_available, social_links } = body

  console.log('🔍 [educator] Actualizando:', slug)

  // Verificar que es su perfil
  const { data: educator } = await supabase
    .from('educators')
    .select('id, user_id')
    .eq('slug', slug)
    .single()

  if (!educator || educator.user_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('educators')
    .update({
      display_name,
      bio,
      tagline,
      hourly_rate_credits,
      is_available,
      social_links,
      updated_at: new Date().toISOString()
    })
    .eq('id', educator.id)
    .select()
    .single()

  if (error) {
    console.error('❌ [educator] Error actualizando:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [educator] Actualizado')
  return NextResponse.json({ data })
}
