import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProject } from '@/lib/projects'
import {
  getProjectCollaborators,
  inviteCollaborator,
  isProjectCollaborator,
} from '@/lib/projects/collaborators'

/**
 * GET /api/projects/[id]/collaborators
 * Obtener colaboradores de un proyecto
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

    const project = await getProject(id)
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Check if public or has access
    const isPublic = project.is_public && ['approved', 'in_progress', 'completed'].includes(project.status)
    const isAuthor = user?.id === project.author_id
    const isCollaborator = user ? await isProjectCollaborator(id, user.id) : false

    if (!isPublic && !isAuthor && !isCollaborator) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const collaborators = await getProjectCollaborators(id)

    // If not author, only show accepted collaborators
    const filteredCollaborators = isAuthor
      ? collaborators
      : collaborators.filter(c => c.status === 'accepted')

    return NextResponse.json({
      success: true,
      data: filteredCollaborators,
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/collaborators] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/collaborators
 * Invitar un colaborador (solo autor)
 */
export async function POST(
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

    if (project.author_id !== user.id) {
      return NextResponse.json({ error: 'Solo el autor puede invitar colaboradores' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id es requerido' }, { status: 400 })
    }

    if (user_id === user.id) {
      return NextResponse.json({ error: 'No puedes invitarte a ti mismo' }, { status: 400 })
    }

    // Check if user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const result = await inviteCollaborator(id, user_id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // TODO: Send notification to invited user
    // TODO: Send email invitation

    return NextResponse.json({
      success: true,
      message: 'Invitación enviada',
    })
  } catch (error) {
    console.error('[POST /api/projects/[id]/collaborators] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
