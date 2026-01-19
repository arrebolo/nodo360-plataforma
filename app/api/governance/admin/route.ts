import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { broadcastNewProposal } from '@/lib/notifications'

type AdminAction = 'validate' | 'reject_validation' | 'veto' | 'cancel' | 'implement'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'governance')
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Verificar que es admin o mentor
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'mentor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos de administración' }, { status: 403 })
  }

  const body = await request.json()
  const { proposalId, action, reason, isPublic = true } = body as {
    proposalId: string
    action: AdminAction
    reason?: string
    isPublic?: boolean
  }

  if (!proposalId || !action) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Obtener propuesta actual
  const { data: proposal, error: proposalError } = await supabase
    .from('governance_proposals')
    .select('*')
    .eq('id', proposalId)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
  }

  let newStatus: string
  let votingStartsAt: string | null = null
  let votingEndsAt: string | null = null

  // Determinar nuevo estado según acción
  switch (action) {
    case 'validate':
      if (proposal.status !== 'pending_review') {
        return NextResponse.json({ error: 'Solo se pueden validar propuestas en revisión' }, { status: 400 })
      }
      newStatus = 'active'
      // Configurar período de votación (7 días)
      votingStartsAt = new Date().toISOString()
      votingEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      break

    case 'reject_validation':
      if (proposal.status !== 'pending_review') {
        return NextResponse.json({ error: 'Solo se pueden rechazar propuestas en revisión' }, { status: 400 })
      }
      newStatus = 'draft'
      break

    case 'veto':
      if (!['passed', 'active'].includes(proposal.status)) {
        return NextResponse.json({ error: 'Solo se pueden vetar propuestas activas o aprobadas' }, { status: 400 })
      }
      // Solo admins pueden vetar
      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Solo administradores pueden vetar' }, { status: 403 })
      }
      newStatus = 'cancelled'
      break

    case 'cancel':
      if (proposal.status !== 'active') {
        return NextResponse.json({ error: 'Solo se pueden cancelar votaciones activas' }, { status: 400 })
      }
      newStatus = 'cancelled'
      break

    case 'implement':
      if (proposal.status !== 'passed') {
        return NextResponse.json({ error: 'Solo se pueden implementar propuestas aprobadas' }, { status: 400 })
      }
      newStatus = 'implemented'
      break

    default:
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  // Actualizar propuesta
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  if (votingStartsAt) updateData.voting_starts_at = votingStartsAt
  if (votingEndsAt) updateData.voting_ends_at = votingEndsAt

  const { error: updateError } = await supabase
    .from('governance_proposals')
    .update(updateData)
    .eq('id', proposalId)

  if (updateError) {
    console.error('Error actualizando propuesta:', updateError)
    return NextResponse.json({ error: 'Error al actualizar propuesta' }, { status: 500 })
  }

  // 📢 Broadcast cuando propuesta se activa para votación
  if (action === 'validate' && newStatus === 'active') {
    try {
      await broadcastNewProposal(proposal.title, proposal.slug)
      console.log('📢 [Governance] Broadcast enviado para propuesta:', proposal.slug)
    } catch (broadcastError) {
      console.error('⚠️ [Governance] Error en broadcast:', broadcastError)
      // No fallar la request principal por error de broadcast
    }
  }

  // Registrar acción admin
  const { error: actionError } = await supabase
    .from('governance_admin_actions')
    .insert({
      proposal_id: proposalId,
      admin_id: user.id,
      action,
      reason: reason || null,
      previous_status: proposal.status,
      new_status: newStatus,
      is_public: isPublic
    })

  if (actionError) {
    console.error('Error registrando acción:', actionError)
    // No fallamos si el log falla, la acción principal ya se ejecutó
  }

  return NextResponse.json({
    success: true,
    previousStatus: proposal.status,
    newStatus,
    action
  })
}

// Obtener historial de acciones admin de una propuesta
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'governance')
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const proposalId = searchParams.get('proposalId')

  if (!proposalId) {
    return NextResponse.json({ error: 'proposalId requerido' }, { status: 400 })
  }

  const { data: actions, error } = await supabase
    .from('governance_admin_actions')
    .select(`
      *,
      admin:admin_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('proposal_id', proposalId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo acciones:', error)
    return NextResponse.json({ error: 'Error al obtener acciones' }, { status: 500 })
  }

  return NextResponse.json({ actions })
}


