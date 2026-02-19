import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProject } from '@/lib/projects'
import {
  acceptInvitation,
  declineInvitation,
  removeCollaborator,
} from '@/lib/projects/collaborators'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PATCH /api/projects/[id]/collaborators/[collaboratorId]
 * Aceptar o rechazar invitación (solo el invitado)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id, collaboratorId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify the collaborator record exists and belongs to the user
    const adminClient = createAdminClient() as any
    const { data: collaborator } = await adminClient
      .from('project_collaborators')
      .select('id, user_id, project_id, status')
      .eq('id', collaboratorId)
      .eq('project_id', id)
      .single()

    if (!collaborator) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    if (collaborator.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (collaborator.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta invitación ya ha sido procesada' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action } = body

    let result: { success: boolean; error: string | null }

    if (action === 'accept') {
      result = await acceptInvitation(collaboratorId, user.id)
    } else if (action === 'decline') {
      result = await declineInvitation(collaboratorId, user.id)
    } else {
      return NextResponse.json(
        { error: 'Acción inválida. Usa: accept, decline' },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Invitación aceptada' : 'Invitación rechazada',
    })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/collaborators/[collaboratorId]] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]/collaborators/[collaboratorId]
 * Eliminar colaborador (solo autor del proyecto)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id, collaboratorId } = await params
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
      return NextResponse.json({ error: 'Solo el autor puede eliminar colaboradores' }, { status: 403 })
    }

    // Get the collaborator to find user_id
    const adminClient = createAdminClient() as any
    const { data: collaborator } = await adminClient
      .from('project_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .eq('project_id', id)
      .single()

    if (!collaborator) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 })
    }

    const result = await removeCollaborator(id, collaborator.user_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Colaborador eliminado',
    })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]/collaborators/[collaboratorId]] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
