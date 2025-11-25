import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { vote, comment } = await request.json()

    if (!['for', 'against', 'abstain'].includes(vote)) {
      return NextResponse.json({ error: 'Voto inválido' }, { status: 400 })
    }

    // Verificar que la propuesta está activa
    const { data: proposal, error: proposalError } = await supabase
      .from('governance_proposals')
      .select('status, voting_ends_at')
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
    }

    if (proposal.status !== 'active') {
      return NextResponse.json({ error: 'La propuesta no está en votación' }, { status: 400 })
    }

    if (proposal.voting_ends_at && new Date(proposal.voting_ends_at) < new Date()) {
      return NextResponse.json({ error: 'El período de votación ha terminado' }, { status: 400 })
    }

    // Verificar si ya votó
    const { data: existingVote } = await supabase
      .from('governance_votes')
      .select('id')
      .eq('proposal_id', proposalId)
      .eq('voter_id', user.id)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: 'Ya has votado en esta propuesta' }, { status: 400 })
    }

    // Obtener datos para el snapshot
    const { data: gpower } = await supabase.rpc('calculate_gpower', { p_user_id: user.id })

    const { data: stats } = await supabase
      .from('user_gamification_stats')
      .select('total_xp')
      .eq('user_id', user.id)
      .single()

    const { data: reputation } = await supabase
      .from('user_reputation')
      .select('reputation_points')
      .eq('user_id', user.id)
      .single()

    const { count: badgesCount } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Registrar voto
    const { data, error } = await supabase
      .from('governance_votes')
      .insert({
        proposal_id: proposalId,
        voter_id: user.id,
        vote,
        gpower_used: gpower || 1,
        xp_at_vote: stats?.total_xp || 0,
        reputation_at_vote: reputation?.reputation_points || 0,
        badges_count_at_vote: badgesCount || 0,
        comment,
      })
      .select()
      .single()

    if (error) throw error

    // Actualizar contador de votos en reputación
    await supabase
      .from('user_reputation')
      .upsert({
        user_id: user.id,
        votes_cast: 1,
      }, {
        onConflict: 'user_id',
      })

    console.log('✅ [API/vote] Voto registrado:', { proposalId, vote, gpower })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ [API/vote] Error:', error)
    return NextResponse.json({ error: 'Error al votar' }, { status: 500 })
  }
}
