/**
 * Project Types
 * Community projects system (Phase 27)
 */

// =====================================================
// ENUMS
// =====================================================

export type ProjectStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'archived'

export type ProjectCategory =
  | 'bitcoin'
  | 'lightning'
  | 'defi'
  | 'education'
  | 'tools'
  | 'general'

export type ProjectCollaboratorStatus = 'pending' | 'accepted' | 'declined'

export type ProjectReviewVote = 'approve' | 'request_changes'

// =====================================================
// BASE TYPES
// =====================================================

export interface UserBasic {
  id: string
  full_name: string | null
  avatar_url: string | null
  role?: string
}

// =====================================================
// MAIN TYPES
// =====================================================

export interface Project {
  id: string
  author_id: string
  title: string
  summary: string
  description: string
  category: ProjectCategory
  status: ProjectStatus
  current_review_round: number
  is_public: boolean
  rejection_reason: string | null
  approved_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joins
  author?: UserBasic
  // Computed
  reviews_count?: number
  approvals_count?: number
  collaborators_count?: number
  updates_count?: number
}

export interface ProjectReview {
  id: string
  project_id: string
  reviewer_id: string
  review_round: number
  vote: ProjectReviewVote
  feedback: string | null
  created_at: string
  // Joins
  reviewer?: UserBasic
}

export interface ProjectCollaborator {
  id: string
  project_id: string
  user_id: string
  invited_by: string
  status: ProjectCollaboratorStatus
  joined_at: string | null
  created_at: string
  // Joins
  user?: UserBasic
  inviter?: UserBasic
}

export interface ProjectUpdate {
  id: string
  project_id: string
  author_id: string
  title: string
  content: string
  created_at: string
  // Joins
  author?: UserBasic
}

// =====================================================
// INPUT TYPES
// =====================================================

export interface CreateProjectInput {
  title: string
  summary: string
  description: string
  category: ProjectCategory
}

export interface UpdateProjectInput {
  title?: string
  summary?: string
  description?: string
  category?: ProjectCategory
}

export interface CreateProjectReviewInput {
  vote: ProjectReviewVote
  feedback?: string
}

export interface CreateProjectUpdateInput {
  title: string
  content: string
}

// =====================================================
// FILTER TYPES
// =====================================================

export interface ProjectFilters {
  category?: ProjectCategory
  status?: ProjectStatus
  authorId?: string
  search?: string
  page?: number
  limit?: number
}

// =====================================================
// ELIGIBILITY
// =====================================================

export interface ProjectEligibility {
  eligible: boolean
  reason?: 'not_premium' | 'courses_incomplete' | 'suspended'
  completedCourses?: number
  requiredCourses?: number
}

// =====================================================
// REVIEW PROGRESS
// =====================================================

export interface ProjectReviewProgress {
  approvals: number
  required: number
  round: number
  hasVoted?: boolean
}

// =====================================================
// STATUS CONFIG (for UI)
// =====================================================

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, {
  label: string
  color: string
  description: string
}> = {
  draft: {
    label: 'Borrador',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    description: 'El proyecto está en preparación',
  },
  pending_review: {
    label: 'En revisión',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Esperando aprobación de mentores',
  },
  changes_requested: {
    label: 'Cambios solicitados',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'Los mentores han solicitado cambios',
  },
  approved: {
    label: 'Aprobado',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'El proyecto ha sido aprobado',
  },
  in_progress: {
    label: 'En progreso',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'El proyecto está en desarrollo',
  },
  completed: {
    label: 'Completado',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'El proyecto ha sido completado',
  },
  rejected: {
    label: 'Rechazado',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'El proyecto ha sido rechazado',
  },
  archived: {
    label: 'Archivado',
    color: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    description: 'El proyecto ha sido archivado',
  },
}

export const PROJECT_CATEGORY_CONFIG: Record<ProjectCategory, {
  label: string
  emoji: string
  color: string
}> = {
  bitcoin: {
    label: 'Bitcoin',
    emoji: '₿',
    color: 'text-orange-400',
  },
  lightning: {
    label: 'Lightning',
    emoji: '⚡',
    color: 'text-yellow-400',
  },
  defi: {
    label: 'DeFi',
    emoji: '🏦',
    color: 'text-purple-400',
  },
  education: {
    label: 'Educación',
    emoji: '📚',
    color: 'text-blue-400',
  },
  tools: {
    label: 'Herramientas',
    emoji: '🛠️',
    color: 'text-gray-400',
  },
  general: {
    label: 'General',
    emoji: '🌐',
    color: 'text-green-400',
  },
}
