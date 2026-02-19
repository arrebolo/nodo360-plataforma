import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProject } from '@/lib/projects'
import { getProjectReviews, getProjectReviewProgress } from '@/lib/projects/reviews'
import { isProjectCollaborator } from '@/lib/projects/collaborators'

/**
 * GET /api/projects/[id]/reviews
 * Obtener reviews de un proyecto (autor, colaboradores, mentores)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const project = await getProject(id)
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Check authorization
    const isAuthor = project.author_id === user.id
    const isCollaborator = await isProjectCollaborator(id, user.id)

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    const isMentorOrAdmin = ['mentor', 'admin'].includes(userData?.role || '')

    if (!isAuthor && !isCollaborator && !isMentorOrAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const reviews = await getProjectReviews(id)
    const progress = await getProjectReviewProgress(id, user.id)

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        progress,
      },
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/reviews] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
