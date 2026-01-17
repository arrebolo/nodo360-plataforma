import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET: Obtener rutas asignadas a un curso
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: paths, error } = await supabase
      .from('learning_path_courses')
      .select(`
        learning_path_id,
        position,
        is_required
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true })

    if (error) {
      console.error('[Course Paths GET] Error:', error)
      throw error
    }

    return NextResponse.json({ paths: paths || [] })
  } catch (error) {
    console.error('[Course Paths GET] Error:', error)
    return NextResponse.json({ error: 'Error obteniendo rutas' }, { status: 500 })
  }
}

// POST: Asignar curso a una ruta
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { learning_path_id, position = 0, is_required = true } = body

    if (!learning_path_id) {
      return NextResponse.json({ error: 'learning_path_id es requerido' }, { status: 400 })
    }

    // Usar admin client para bypass RLS
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('learning_path_courses')
      .insert({
        course_id: courseId,
        learning_path_id,
        position,
        is_required,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El curso ya esta en esta ruta' }, { status: 400 })
      }
      console.error('[Course Paths POST] Error:', error)
      throw error
    }

    console.log('[Course Paths] Curso asignado a ruta:', { courseId, learning_path_id })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Course Paths POST] Error:', error)
    return NextResponse.json({ error: 'Error asignando ruta' }, { status: 500 })
  }
}

// DELETE: Quitar curso de una ruta
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { learning_path_id } = body

    if (!learning_path_id) {
      return NextResponse.json({ error: 'learning_path_id es requerido' }, { status: 400 })
    }

    // Usar admin client para bypass RLS
    const admin = createAdminClient()

    const { error } = await admin
      .from('learning_path_courses')
      .delete()
      .eq('course_id', courseId)
      .eq('learning_path_id', learning_path_id)

    if (error) {
      console.error('[Course Paths DELETE] Error:', error)
      throw error
    }

    console.log('[Course Paths] Curso removido de ruta:', { courseId, learning_path_id })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Course Paths DELETE] Error:', error)
    return NextResponse.json({ error: 'Error removiendo de ruta' }, { status: 500 })
  }
}
