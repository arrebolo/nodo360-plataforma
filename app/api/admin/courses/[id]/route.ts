// app/api/admin/courses/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Cliente ADMIN con service_role (bypasa RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================
//  PUT /api/admin/courses/[id] - actualizar curso
// =====================
export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    console.log('[PUT Course API] Iniciando guardado')

    // Verificar autenticacion
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await request.json()

    // Extraer path_id del body
    const { path_id, ...courseData } = body

    console.log('[PUT Course API] ID del curso:', courseId)
    console.log('[PUT Course API] Datos recibidos:', courseData.title)

    if (!courseData.title || !courseData.slug) {
      return NextResponse.json(
        { error: 'Titulo y slug son obligatorios' },
        { status: 400 }
      )
    }

    // Actualizar curso
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update({
        title: courseData.title,
        slug: courseData.slug,
        subtitle: courseData.subtitle || null,
        description: courseData.description || null,
        duration_label: courseData.duration_label || null,
        is_premium: courseData.is_premium ?? false,
        is_certifiable: courseData.is_certifiable ?? true,
        published_at: courseData.published_at || null,
        difficulty_level: courseData.difficulty_level || null,
        topic_category: courseData.topic_category || null,
      })
      .eq('id', courseId)
      .select()
      .single()

    if (error) {
      console.error('[PUT Course API] Error al guardar curso:', error)
      return NextResponse.json(
        { error: 'Error al guardar el curso: ' + error.message },
        { status: 500 }
      )
    }

    // Actualizar relacion con ruta
    // 1. Borrar relaciones existentes
    await supabaseAdmin
      .from('path_courses')
      .delete()
      .eq('course_id', courseId)

    // 2. Si hay nueva path_id, crear relacion
    if (path_id) {
      console.log('[PUT Course API] Reasignando a ruta:', path_id)

      const { data: rows } = await supabaseAdmin
        .from('path_courses')
        .select('order_index')
        .eq('path_id', path_id)
        .order('order_index', { ascending: false })
        .limit(1)

      const orderIndex = rows?.[0]?.order_index ? rows[0].order_index + 1 : 1

      const { error: pathError } = await supabaseAdmin
        .from('path_courses')
        .insert({
          path_id,
          course_id: courseId,
          order_index: orderIndex,
          is_required: true,
        })

      if (pathError) {
        console.error('[PUT Course API] Error asignando ruta:', pathError.message)
      }
    }

    console.log('[PUT Course API] Curso actualizado:', course.id)
    return NextResponse.json({ course }, { status: 200 })
  } catch (error: any) {
    console.error('[PUT Course API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor: ' + error.message },
      { status: 500 }
    )
  }
}

// =====================
//  DELETE /api/admin/courses/[id] - eliminar curso
// =====================
export async function DELETE(
  _request: Request,
  { params }: RouteParams
) {
  try {
    console.log('[DELETE Course API] Iniciando eliminacion')

    // Verificar autenticacion
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: courseId } = await params
    console.log('[DELETE Course API] ID del curso:', courseId)

    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('[DELETE Course API] Error:', error)
      return NextResponse.json(
        { error: 'Error al eliminar curso: ' + error.message },
        { status: 500 }
      )
    }

    console.log('[DELETE Course API] Curso eliminado correctamente')
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('[DELETE Course API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor: ' + error.message },
      { status: 500 }
    )
  }
}
