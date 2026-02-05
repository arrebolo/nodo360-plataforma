import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { resetCourseReviews } from '@/lib/courses/reviews'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 [submit-review] API v2 - Starting request')
  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    console.log(`🔍 [Submit Review] Starting for course: ${courseId}`)

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ [Submit Review] No user authenticated')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.log(`✅ [Submit Review] User authenticated: ${user.id}`)

    // Verificar que el curso existe y pertenece al usuario
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id, status, title')
      .eq('id', courseId)
      .single()

    if (courseError) {
      console.log(`❌ [Submit Review] Course query error:`, courseError)
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (!course) {
      console.log(`❌ [Submit Review] Course not found: ${courseId}`)
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    console.log(`📋 [Submit Review] Course found: ${course.title}, status: ${course.status}, instructor: ${course.instructor_id}`)

    if (course.instructor_id !== user.id) {
      console.log(`❌ [Submit Review] User ${user.id} is not owner of course (owner: ${course.instructor_id})`)
      return NextResponse.json({ error: 'No tienes permisos sobre este curso' }, { status: 403 })
    }

    // Solo se puede enviar a revisión si está en draft, rejected o changes_requested
    if (course.status !== 'draft' && course.status !== 'rejected' && course.status !== 'changes_requested') {
      console.log(`❌ [Submit Review] Invalid status: ${course.status}. Must be draft, rejected or changes_requested.`)
      return NextResponse.json(
        { error: 'Solo se pueden enviar a revisión cursos en borrador, rechazados o con cambios solicitados' },
        { status: 400 }
      )
    }

    // Verificar que el curso tenga contenido mínimo
    // NOTA: Usamos una query directa con service role si hay problemas de RLS
    const { count: modulesCount, error: modulesError } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    console.log(`📊 [Submit Review] Modules count: ${modulesCount}, error: ${modulesError?.message || 'none'}`)

    if (modulesError) {
      console.error(`❌ [Submit Review] Error counting modules:`, modulesError)
      return NextResponse.json(
        {
          error: 'Error al verificar módulos del curso',
          details: modulesError.message,
          code: modulesError.code
        },
        { status: 500 }
      )
    }

    if (!modulesCount || modulesCount === 0) {
      return NextResponse.json(
        { error: 'El curso debe tener al menos un módulo antes de enviarlo a revisión' },
        { status: 400 }
      )
    }

    // Contar lecciones a través de los módulos del curso
    const { count: lessonsCount, error: lessonsError } = await supabase
      .from('lessons')
      .select('*, modules!inner(course_id)', { count: 'exact', head: true })
      .eq('modules.course_id', courseId)

    console.log(`📊 [Submit Review] Lessons count: ${lessonsCount}, error: ${lessonsError?.message || 'none'}`)

    if (lessonsError) {
      console.error(`❌ [Submit Review] Error counting lessons:`, lessonsError)
      return NextResponse.json(
        {
          error: 'Error al verificar lecciones del curso',
          details: lessonsError.message,
          code: lessonsError.code
        },
        { status: 500 }
      )
    }

    if (!lessonsCount || lessonsCount === 0) {
      return NextResponse.json(
        { error: 'El curso debe tener al menos una lección antes de enviarlo a revisión' },
        { status: 400 }
      )
    }

    // Actualizar status a pending_review
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        status: 'pending_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('❌ [Submit Review] Error updating course status:', updateError)
      return NextResponse.json(
        {
          error: 'Error al actualizar el estado del curso',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      )
    }

    // Reset previous reviews when resubmitting
    await resetCourseReviews(courseId)

    console.log(`✅ [Submit Review] Course ${courseId} submitted for review by ${user.id}`)

    // Revalidar paths
    revalidatePath('/dashboard/instructor/cursos')
    revalidatePath(`/dashboard/instructor/cursos/${courseId}`)
    revalidatePath('/admin/cursos/pendientes')
    revalidatePath('/dashboard/mentor/cursos/pendientes')

    return NextResponse.json({
      success: true,
      message: 'Curso enviado a revisión correctamente',
    })
  } catch (error) {
    console.error('❌ [Submit Review] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: String(error)
      },
      { status: 500 }
    )
  }
}
