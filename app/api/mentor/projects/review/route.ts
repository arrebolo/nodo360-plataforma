import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProjectsForMentorReview } from '@/lib/projects'
import { getProjectReviewCounts, submitProjectReview, canMentorReviewProject } from '@/lib/projects/reviews'
import { revalidatePath } from 'next/cache'

/**
 * GET /api/mentor/projects/review
 * Lista proyectos pending_review con info de si el mentor ya votó
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

    const projects = await getProjectsForMentorReview()
    const projectIds = projects.map((p: any) => p.id)
    const reviewCounts = await getProjectReviewCounts(projectIds)

    // Check which projects this mentor has already voted on
    const projectsWithReviewInfo = await Promise.all(
      projects.map(async (project: any) => {
        const canReview = await canMentorReviewProject(project.id, user.id)
        return {
          ...project,
          review_counts: reviewCounts[project.id] || { approve: 0, request_changes: 0, round: 0 },
          can_review: canReview,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: projectsWithReviewInfo,
    })
  } catch (error) {
    console.error('[GET /api/mentor/projects/review] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mentor/projects/review
 * Enviar review { project_id, vote, feedback }
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
    const { project_id, vote, feedback } = body

    if (!project_id || !vote) {
      return NextResponse.json(
        { error: 'project_id y vote son requeridos' },
        { status: 400 }
      )
    }

    if (!['approve', 'request_changes'].includes(vote)) {
      return NextResponse.json(
        { error: 'vote debe ser "approve" o "request_changes"' },
        { status: 400 }
      )
    }

    if (vote === 'request_changes' && (!feedback || feedback.trim().length < 10)) {
      return NextResponse.json(
        { error: 'El feedback es obligatorio al solicitar cambios (mínimo 10 caracteres)' },
        { status: 400 }
      )
    }

    // Verify mentor can still review
    const canReview = await canMentorReviewProject(project_id, user.id)
    if (!canReview) {
      return NextResponse.json(
        { error: 'No puedes revisar este proyecto (ya votaste o no está en revisión)' },
        { status: 400 }
      )
    }

    const result = await submitProjectReview(project_id, user.id, vote, feedback)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Revalidate paths
    revalidatePath('/dashboard/mentor/proyectos/pendientes')
    revalidatePath('/dashboard/proyectos')

    // TODO: Send notification to project author
    // TODO: Send email if changes requested or if approved (2nd vote)

    return NextResponse.json({
      success: true,
      message: vote === 'approve' ? 'Proyecto aprobado' : 'Cambios solicitados',
    })
  } catch (error) {
    console.error('[POST /api/mentor/projects/review] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
