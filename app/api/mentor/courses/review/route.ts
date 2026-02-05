import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getCoursesForMentorReview, getReviewCounts } from '@/lib/courses/reviews'

/**
 * GET /api/mentor/courses/review
 * Lista cursos pending_review con info de si el mentor ya votó
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify mentor role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || !['mentor', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const courses = await getCoursesForMentorReview()
    const courseIds = courses.map((c: any) => c.id)
    const reviewCounts = await getReviewCounts(courseIds)

    // Check which courses this mentor has already voted on
    const { data: mentorReviews } = await (supabase as any)
      .from('course_reviews')
      .select('course_id, vote')
      .eq('mentor_id', user.id)
      .in('course_id', courseIds)

    const mentorVotes: Record<string, string> = {}
    for (const review of mentorReviews || []) {
      mentorVotes[review.course_id] = review.vote
    }

    const coursesWithReviewInfo = courses.map((course: any) => ({
      ...course,
      review_counts: reviewCounts[course.id] || { approve: 0, request_changes: 0 },
      mentor_vote: mentorVotes[course.id] || null,
    }))

    return NextResponse.json({
      success: true,
      data: coursesWithReviewInfo,
    })
  } catch (error) {
    console.error('[GET /api/mentor/courses/review] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mentor/courses/review
 * Enviar review { course_id, vote, comment }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify mentor role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || !['mentor', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { course_id, vote, comment } = body

    if (!course_id || !vote) {
      return NextResponse.json(
        { error: 'course_id y vote son requeridos' },
        { status: 400 }
      )
    }

    if (!['approve', 'request_changes'].includes(vote)) {
      return NextResponse.json(
        { error: 'vote debe ser "approve" o "request_changes"' },
        { status: 400 }
      )
    }

    if (vote === 'request_changes' && (!comment || comment.trim().length < 10)) {
      return NextResponse.json(
        { error: 'El comentario es obligatorio al solicitar cambios (mínimo 10 caracteres)' },
        { status: 400 }
      )
    }

    // Verify course is in pending_review
    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', course_id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (course.status !== 'pending_review') {
      return NextResponse.json(
        { error: 'Este curso no está pendiente de revisión' },
        { status: 400 }
      )
    }

    // Submit the review using admin client (bypass RLS)
    const { submitReview } = await import('@/lib/courses/reviews')
    const result = await submitReview(course_id, user.id, vote, comment)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: vote === 'approve' ? 'Curso aprobado' : 'Cambios solicitados',
    })
  } catch (error) {
    console.error('[POST /api/mentor/courses/review] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
