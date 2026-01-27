import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el curso existe y pertenece al usuario
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id, status, title')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos sobre este curso' }, { status: 403 })
    }

    // Solo se puede enviar a revisión si está en draft o rejected
    if (course.status !== 'draft' && course.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Solo se pueden enviar a revisión cursos en borrador o rechazados' },
        { status: 400 }
      )
    }

    // Verificar que el curso tenga contenido mínimo
    const { count: modulesCount } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    if (!modulesCount || modulesCount === 0) {
      return NextResponse.json(
        { error: 'El curso debe tener al menos un módulo antes de enviarlo a revisión' },
        { status: 400 }
      )
    }

    const { count: lessonsCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

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
      console.error('Error updating course status:', updateError)
      return NextResponse.json(
        { error: 'Error al enviar a revisión' },
        { status: 500 }
      )
    }

    console.log(`✅ [Submit Review] Course ${courseId} submitted for review by ${user.id}`)

    // Revalidar paths
    revalidatePath('/dashboard/instructor/cursos')
    revalidatePath(`/dashboard/instructor/cursos/${courseId}`)
    revalidatePath('/admin/cursos/pendientes')

    return NextResponse.json({
      success: true,
      message: 'Curso enviado a revisión correctamente',
    })
  } catch (error) {
    console.error('Error in submit-review:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
