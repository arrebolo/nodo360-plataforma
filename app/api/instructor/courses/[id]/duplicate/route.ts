import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { checkRateLimit } from '@/lib/ratelimit'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * POST /api/instructor/courses/[id]/duplicate
 * Duplica un curso completo (con modulos y lecciones)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Verificar usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['instructor', 'mentor', 'admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener curso original
    const { data: original, error: fetchError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    // Verificar que es el dueno o admin
    if (original.instructor_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    // Crear slug unico
    const timestamp = Date.now()
    const newSlug = `${original.slug}-copia-${timestamp}`

    // Duplicar curso
    const newCourseId = randomUUID()
    const { data: newCourse, error: insertError } = await supabase
      .from('courses')
      .insert({
        id: newCourseId,
        title: `${original.title} (Copia)`,
        slug: newSlug,
        description: original.description,
        long_description: original.long_description,
        level: original.level,
        status: 'draft', // Siempre como borrador
        is_free: original.is_free,
        price: original.price,
        instructor_id: user.id, // El que duplica es el nuevo dueno
        thumbnail_url: original.thumbnail_url,
        banner_url: original.banner_url,
        topic_category: original.topic_category,
        total_modules: 0,
        total_lessons: 0,
        total_duration_minutes: 0,
        is_certifiable: original.is_certifiable,
        learning_objectives: original.learning_objectives,
        requirements: original.requirements,
        target_audience: original.target_audience,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Duplicate] Error creando curso:', insertError)
      return NextResponse.json({ error: 'Error al duplicar' }, { status: 500 })
    }

    // Duplicar modulos
    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', id)
      .order('order_index', { ascending: true })

    if (modules && modules.length > 0) {
      for (const mod of modules) {
        const newModuleId = randomUUID()

        // Insertar modulo
        await supabase.from('modules').insert({
          id: newModuleId,
          course_id: newCourseId,
          title: mod.title,
          description: mod.description,
          order_index: mod.order_index,
          total_lessons: mod.total_lessons,
          total_duration_minutes: mod.total_duration_minutes,
        })

        // Duplicar lecciones del modulo
        const { data: lessons } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', mod.id)
          .order('order_index', { ascending: true })

        if (lessons && lessons.length > 0) {
          const newLessons = lessons.map((lesson) => ({
            id: randomUUID(),
            module_id: newModuleId,
            title: lesson.title,
            slug: `${lesson.slug}-${timestamp}`,
            description: lesson.description,
            order_index: lesson.order_index,
            content: lesson.content,
            content_json: lesson.content_json,
            video_url: lesson.video_url,
            video_duration_minutes: lesson.video_duration_minutes,
            is_free_preview: lesson.is_free_preview,
            attachments: lesson.attachments,
          }))

          await supabase.from('lessons').insert(newLessons)
        }
      }

      // Actualizar contadores del curso
      const { count: moduleCount } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', newCourseId)

      const { data: allLessons } = await supabase
        .from('modules')
        .select('lessons(id)')
        .eq('course_id', newCourseId)

      const lessonCount = allLessons?.reduce(
        (acc, m) => acc + (m.lessons?.length || 0),
        0
      ) || 0

      await supabase
        .from('courses')
        .update({
          total_modules: moduleCount || 0,
          total_lessons: lessonCount,
        })
        .eq('id', newCourseId)
    }

    console.log('[Duplicate] Curso duplicado:', { original: id, new: newCourseId })

    return NextResponse.json({
      success: true,
      course: newCourse,
    })

  } catch (error) {
    console.error('[Duplicate] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
