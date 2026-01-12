// =============================================
// TIPOS DEL SISTEMA DE GOBERNANZA - NODO360
// =============================================

export type ProposalStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'passed'
  | 'rejected'
  | 'implemented'
  | 'cancelled'

export type VoteType = 'for' | 'against' | 'abstain'

export type ProposalLevel = 1 | 2

export interface GovernanceCategory {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string
  color: string
  proposal_level: ProposalLevel
  is_active: boolean
  order_index: number
  created_at: string
}

export interface GovernanceProposal {
  id: string
  title: string
  slug: string
  description: string
  detailed_content: string | null
  category_id: string | null
  proposal_level: ProposalLevel
  tags: string[]
  author_id: string
  status: ProposalStatus
  validated_by: string | null
  validated_at: string | null
  validation_notes: string | null
  voting_starts_at: string | null
  voting_ends_at: string | null
  quorum_required: number
  approval_threshold: number
  total_votes: number
  total_gpower_for: number
  total_gpower_against: number
  total_gpower_abstain: number
  implemented_at: string | null
  implementation_notes: string | null
  created_at: string
  updated_at: string
}

export interface ProposalWithDetails extends GovernanceProposal {
  author_name: string | null
  author_avatar: string | null
  author_role: string
  author_gpower: number
  category_name: string | null
  category_icon: string | null
  category_color: string | null
  seconds_remaining: number
}

export interface GovernanceVote {
  id: string
  proposal_id: string
  voter_id: string
  vote: VoteType
  gpower_used: number
  xp_at_vote: number
  reputation_at_vote: number
  badges_count_at_vote: number
  comment: string | null
  created_at: string
}

export interface VoteWithVoter extends GovernanceVote {
  voter?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface UserReputation {
  id: string
  user_id: string
  reputation_points: number
  proposals_created: number
  proposals_passed: number
  votes_cast: number
  helpful_votes: number
  mentoring_sessions: number
  courses_completed: number
  warnings: number
  created_at: string
  updated_at: string
}

export interface ReputationHistory {
  id: string
  user_id: string
  change_amount: number
  reason: string
  related_proposal_id: string | null
  created_at: string
}

// Helpers

export const PROPOSAL_STATUS_INFO: Record<ProposalStatus, {
  label: string
  color: string
  bgColor: string
  icon: string
}> = {
  draft: {
    label: 'Borrador',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    icon: '📝',
  },
  pending_review: {
    label: 'En Revisión',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    icon: '⏳',
  },
  active: {
    label: 'Votación Activa',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: '🗳️',
  },
  passed: {
    label: 'Aprobada',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: '✅',
  },
  rejected: {
    label: 'Rechazada',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: '❌',
  },
  implemented: {
    label: 'Implementada',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: '🚀',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'text-gray-500',
    bgColor: 'bg-gray-600/20',
    icon: '🚫',
  },
}

export const VOTE_INFO: Record<VoteType, {
  label: string
  color: string
  bgColor: string
  icon: string
}> = {
  for: {
    label: 'A favor',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: '👍',
  },
  against: {
    label: 'En contra',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: '👎',
  },
  abstain: {
    label: 'Abstención',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    icon: '🤷',
  },
}

export function calculateGPower(xp: number, reputation: number, badgesCount: number): number {
  const gpower = (xp / 100 * 0.4) + (reputation / 10 * 0.4) + (badgesCount * 10 * 0.2)
  return Math.max(Math.round(gpower * 100) / 100, xp > 0 || reputation > 0 || badgesCount > 0 ? 1 : 0)
}

export function getVotePercentage(proposal: GovernanceProposal): {
  for: number
  against: number
  abstain: number
} {
  const total = proposal.total_gpower_for + proposal.total_gpower_against + proposal.total_gpower_abstain
  if (total === 0) return { for: 0, against: 0, abstain: 0 }

  return {
    for: Math.round((proposal.total_gpower_for / total) * 100),
    against: Math.round((proposal.total_gpower_against / total) * 100),
    abstain: Math.round((proposal.total_gpower_abstain / total) * 100),
  }
}

export function hasQuorum(proposal: GovernanceProposal): boolean {
  return proposal.total_votes >= proposal.quorum_required
}

export function isPassing(proposal: GovernanceProposal): boolean {
  const total = proposal.total_gpower_for + proposal.total_gpower_against
  if (total === 0) return false
  return (proposal.total_gpower_for / total) >= proposal.approval_threshold
}


