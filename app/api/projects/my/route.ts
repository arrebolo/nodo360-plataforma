import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProjectsByAuthor } from '@/lib/projects'
import { getCollaboratingProjects, getPendingInvitations } from '@/lib/projects/collaborators'

/**
 * GET /api/projects/my
 * Obtener mis proyectos (como autor) y colaboraciones
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let myProjects: any[] = []
    let collaborations: any[] = []
    let pendingInvitations: any[] = []

    if (type === 'all' || type === 'authored') {
      myProjects = await getProjectsByAuthor(user.id)
    }

    if (type === 'all' || type === 'collaborating') {
      collaborations = await getCollaboratingProjects(user.id)
    }

    if (type === 'all' || type === 'invitations') {
      pendingInvitations = await getPendingInvitations(user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        authored: myProjects,
        collaborating: collaborations,
        pendingInvitations,
      },
    })
  } catch (error) {
    console.error('[GET /api/projects/my] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
