import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

// GET: Listar todas las rutas de aprendizaje
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: paths, error } = await supabase
      .from('learning_paths')
      .select('id, name, slug, emoji, is_active')
      .order('position', { ascending: true })

    if (error) {
      console.error('[Learning Paths] Error:', error)
      throw error
    }

    return NextResponse.json({ paths: paths || [] })
  } catch (error) {
    console.error('[Learning Paths] Error:', error)
    return NextResponse.json({ error: 'Error obteniendo rutas' }, { status: 500 })
  }
}

// POST: Crear nueva ruta (opcional, para futuro uso)
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, short_description, emoji } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
    }

    const { data: path, error } = await supabase
      .from('learning_paths')
      .insert({
        name,
        slug,
        short_description,
        emoji,
        is_active: false,
        position: 99,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El slug ya existe' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ path })
  } catch (error) {
    console.error('[Learning Paths] Error:', error)
    return NextResponse.json({ error: 'Error creando ruta' }, { status: 500 })
  }
}
