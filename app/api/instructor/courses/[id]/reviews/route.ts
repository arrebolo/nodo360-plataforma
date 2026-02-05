import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCourseReviews } from '@/lib/courses/reviews'

/**
 * GET /api/instructor/courses/[id]/reviews
 * Devuelve reviews del curso (solo si el curso pertenece al instructor autenticado)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify course belongs to instructor
    const { data: course } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const reviews = await getCourseReviews(courseId)

    return NextResponse.json({
      success: true,
      data: reviews,
    })
  } catch (error) {
    console.error('[GET /api/instructor/courses/[id]/reviews] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
