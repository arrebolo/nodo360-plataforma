import { createClient } from '@/lib/supabase/server'
import {
  GovernanceCategory,
  ProposalWithDetails,
  GovernanceVote,
  VoteWithVoter,
  UserReputation,
  ProposalStatus,
  ProposalLevel
} from '@/types/governance'

// Obtener categorías
export async function getCategories(level?: ProposalLevel): Promise<GovernanceCategory[]> {
  const supabase = await createClient()

  let query = supabase
    .from('governance_categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index')

  if (level) {
    query = query.eq('proposal_level', level)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ [getCategories] Error:', error)
    return []
  }

  return data || []
}

// Obtener propuestas - Query directa sin vista
export async function getProposals(options?: {
  status?: ProposalStatus | ProposalStatus[]
  level?: ProposalLevel
  categoryId?: string
  authorId?: string
  limit?: number
}): Promise<ProposalWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('governance_proposals')
    .select(`
      *,
      author:author_id (
        id,
        full_name,
        avatar_url,
        role
      ),
      category:category_id (
        name,
        icon,
        color
      )
    `)
    .order('created_at', { ascending: false })

  if (options?.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status)
    } else {
      query = query.eq('status', options.status)
    }
  }

  if (options?.level) {
    query = query.eq('proposal_level', options.level)
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  if (options?.authorId) {
    query = query.eq('author_id', options.authorId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ [getProposals] Error:', error)
    return []
  }

  if (!data) return []

  // Transformar resultados
  const now = new Date()

  return data.map((proposal: any) => {
    const votingEnds = proposal.voting_ends_at ? new Date(proposal.voting_ends_at) : null
    const secondsRemaining = votingEnds && votingEnds > now
      ? Math.floor((votingEnds.getTime() - now.getTime()) / 1000)
      : 0

    return {
      ...proposal,
      author_name: proposal.author?.full_name || null,
      author_avatar: proposal.author?.avatar_url || null,
      author_role: proposal.author?.role || 'student',
      author_gpower: 0, // No calculamos gPower en listados por performance
      category_name: proposal.category?.name || null,
      category_icon: proposal.category?.icon || null,
      category_color: proposal.category?.color || null,
      seconds_remaining: secondsRemaining,
    } as ProposalWithDetails
  })
}

// Obtener propuesta por slug - Query directa sin vista
export async function getProposalBySlug(slug: string): Promise<ProposalWithDetails | null> {
  const supabase = await createClient()

  // Query directa a la tabla con joins
  const { data: proposal, error: proposalError } = await supabase
    .from('governance_proposals')
    .select(`
      *,
      author:author_id (
        id,
        full_name,
        avatar_url,
        role
      ),
      category:category_id (
        name,
        icon,
        color
      )
    `)
    .eq('slug', slug)
    .single()

  if (proposalError) {
    // Si es error de "no rows", no loguear como error
    if (proposalError.code === 'PGRST116') {
      console.log('ℹ️ [getProposalBySlug] Propuesta no encontrada:', slug)
      return null
    }
    console.error('❌ [getProposalBySlug] Error:', proposalError)
    return null
  }

  if (!proposal) return null

  // Calcular gPower del autor
  let authorGPower = 0
  try {
    const { data: gpower } = await supabase.rpc('calculate_gpower', {
      p_user_id: proposal.author_id
    })
    authorGPower = gpower || 0
  } catch (e) {
    console.log('ℹ️ [getProposalBySlug] No se pudo calcular gPower')
  }

  // Calcular segundos restantes
  const now = new Date()
  const votingEnds = proposal.voting_ends_at ? new Date(proposal.voting_ends_at) : null
  const secondsRemaining = votingEnds && votingEnds > now
    ? Math.floor((votingEnds.getTime() - now.getTime()) / 1000)
    : 0

  // Transformar a ProposalWithDetails
  const result: ProposalWithDetails = {
    ...proposal,
    author_name: (proposal.author as any)?.full_name || null,
    author_avatar: (proposal.author as any)?.avatar_url || null,
    author_role: (proposal.author as any)?.role || 'student',
    author_gpower: authorGPower,
    category_name: (proposal.category as any)?.name || null,
    category_icon: (proposal.category as any)?.icon || null,
    category_color: (proposal.category as any)?.color || null,
    seconds_remaining: secondsRemaining,
  }

  return result
}

// Obtener votos de una propuesta
export async function getProposalVotes(proposalId: string): Promise<VoteWithVoter[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('governance_votes')
    .select(`
      *,
      voter:voter_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [getProposalVotes] Error:', error)
    return []
  }

  return (data || []) as VoteWithVoter[]
}

// Verificar si usuario ya votó
export async function hasUserVoted(proposalId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('governance_votes')
    .select('id')
    .eq('proposal_id', proposalId)
    .eq('voter_id', userId)
    .single()

  return !!data && !error
}

// Obtener voto de usuario en una propuesta
export async function getUserVote(proposalId: string, userId: string): Promise<GovernanceVote | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('governance_votes')
    .select('*')
    .eq('proposal_id', proposalId)
    .eq('voter_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('❌ [getUserVote] Error:', error)
  }

  return data
}

// Obtener gPower de usuario
export async function getUserGPower(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('calculate_gpower', { p_user_id: userId })

  if (error) {
    console.error('❌ [getUserGPower] Error:', error)
    return 0
  }

  return data || 0
}

// Obtener reputación de usuario
export async function getUserReputation(userId: string): Promise<UserReputation | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_reputation')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('❌ [getUserReputation] Error:', error)
    return null
  }

  return data
}

// Estadísticas de gobernanza
export async function getGovernanceStats(): Promise<{
  totalProposals: number
  activeProposals: number
  passedProposals: number
  totalVotes: number
  totalParticipants: number
}> {
  const supabase = await createClient()

  const [proposalsResult, votesResult, participantsResult] = await Promise.all([
    supabase.from('governance_proposals').select('status'),
    supabase.from('governance_votes').select('id', { count: 'exact', head: true }),
    supabase.from('governance_votes').select('voter_id'),
  ])

  const proposalData = proposalsResult.data || []
  const uniqueVoters = new Set(participantsResult.data?.map(v => v.voter_id) || [])

  return {
    totalProposals: proposalData.length,
    activeProposals: proposalData.filter(p => p.status === 'active').length,
    passedProposals: proposalData.filter(p => p.status === 'passed' || p.status === 'implemented').length,
    totalVotes: votesResult.count || 0,
    totalParticipants: uniqueVoters.size,
  }
}

// Verificar si usuario puede crear propuesta de cierto nivel
export async function canUserCreateProposal(userId: string, level: ProposalLevel): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('can_create_proposal', { p_user_id: userId, p_level: level })

  if (error) {
    console.error('❌ [canUserCreateProposal] Error:', error)
    return false
  }

  return data || false
}

// Verificar si usuario puede validar propuesta
export async function canUserValidateProposal(userId: string, proposalLevel: ProposalLevel): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('can_validate_proposal', { p_user_id: userId, p_proposal_level: proposalLevel })

  if (error) {
    console.error('❌ [canUserValidateProposal] Error:', error)
    return false
  }

  return data || false
}


