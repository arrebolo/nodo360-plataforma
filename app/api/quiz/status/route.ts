import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCourseQuizStatus } from '@/lib/quiz/checkCourseQuiz'

/**
 * GET /api/quiz/status?course_id=xxx
 * Obtiene el estado del quiz para el usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id es requerido' },
        { status: 400 }
      )
    }

    const status = await getCourseQuizStatus(courseId, user?.id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('[Quiz Status] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener estado del quiz' },
      { status: 500 }
    )
  }
}
