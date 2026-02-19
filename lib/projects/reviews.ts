/**
 * Project Reviews
 * Server-side functions for mentor project reviews (2-approval system)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ProjectReview, ProjectReviewVote, ProjectReviewProgress } from '@/types/projects'

// =====================================================
// READ functions
// =====================================================

/**
 * Get all reviews for a project with reviewer info
 */
export async function getProjectReviews(projectId: string): Promise<ProjectReview[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_reviews')
    .select(`
      id,
      project_id,
      reviewer_id,
      review_round,
      vote,
      feedback,
      created_at,
      reviewer:users!project_reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getProjectReviews] Error:', error)
    return []
  }

  return data || []
}

/**
 * Get reviews for current review round only
 */
export async function getCurrentRoundReviews(
  projectId: string,
  currentRound: number
): Promise<ProjectReview[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_reviews')
    .select(`
      id,
      project_id,
      reviewer_id,
      review_round,
      vote,
      feedback,
      created_at,
      reviewer:users!project_reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .eq('review_round', currentRound)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getCurrentRoundReviews] Error:', error)
    return []
  }

  return data || []
}

/**
 * Get review progress for a project (approvals count, etc.)
 */
export async function getProjectReviewProgress(
  projectId: string,
  reviewerId?: string
): Promise<ProjectReviewProgress> {
  const supabase = createAdminClient() as any

  // Get current review round
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('current_review_round')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    console.error('[getProjectReviewProgress] Error:', projectError)
    return { approvals: 0, required: 2, round: 0 }
  }

  const currentRound = project.current_review_round

  // Count approvals in current round
  const { data: reviews, error: reviewsError } = await supabase
    .from('project_reviews')
    .select('vote, reviewer_id')
    .eq('project_id', projectId)
    .eq('review_round', currentRound)

  if (reviewsError) {
    console.error('[getProjectReviewProgress] Error:', reviewsError)
    return { approvals: 0, required: 2, round: currentRound }
  }

  const approvals = (reviews || []).filter((r: { vote: string }) => r.vote === 'approve').length

  // Check if reviewer has voted
  let hasVoted: boolean | undefined
  if (reviewerId) {
    hasVoted = (reviews || []).some(
      (r: { reviewer_id: string }) => r.reviewer_id === reviewerId
    )
  }

  return {
    approvals,
    required: 2,
    round: currentRound,
    hasVoted,
  }
}

/**
 * Check if a mentor can still review a project (hasn't voted in current round)
 */
export async function canMentorReviewProject(
  projectId: string,
  mentorId: string
): Promise<boolean> {
  const supabase = createAdminClient() as any

  // Get current round
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('current_review_round, status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return false
  }

  // Must be in pending_review
  if (project.status !== 'pending_review') {
    return false
  }

  // Check if already voted in this round
  const { count, error } = await supabase
    .from('project_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('reviewer_id', mentorId)
    .eq('review_round', project.current_review_round)

  if (error) {
    console.error('[canMentorReviewProject] Error:', error)
    return false
  }

  return (count || 0) === 0
}

// =====================================================
// WRITE functions
// =====================================================

/**
 * Submit a review for a project
 * Validates that feedback is required for request_changes
 */
export async function submitProjectReview(
  projectId: string,
  reviewerId: string,
  vote: ProjectReviewVote,
  feedback?: string | null
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient() as any

  // Validate feedback is required for request_changes
  if (vote === 'request_changes' && (!feedback || feedback.trim().length < 10)) {
    return {
      success: false,
      error: 'Debes proporcionar feedback (mínimo 10 caracteres) al solicitar cambios',
    }
  }

  // Get current review round
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('current_review_round, status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: 'Proyecto no encontrado' }
  }

  if (project.status !== 'pending_review') {
    return { success: false, error: 'El proyecto no está en revisión' }
  }

  // Insert review - trigger will handle auto-approval
  const { error } = await supabase
    .from('project_reviews')
    .insert({
      project_id: projectId,
      reviewer_id: reviewerId,
      review_round: project.current_review_round,
      vote,
      feedback: feedback?.trim() || null,
    })

  if (error) {
    // Unique constraint violation = already voted
    if (error.code === '23505') {
      return { success: false, error: 'Ya has votado en este proyecto' }
    }
    console.error('[submitProjectReview] Error:', error)
    return { success: false, error: error.message }
  }

  // If vote is request_changes, update project status
  if (vote === 'request_changes') {
    await supabase
      .from('projects')
      .update({ status: 'changes_requested' })
      .eq('id', projectId)
      .eq('status', 'pending_review')
  }

  return { success: true, error: null }
}

/**
 * Get review counts for multiple projects (for list display)
 */
export async function getProjectReviewCounts(projectIds: string[]): Promise<
  Record<string, { approve: number; request_changes: number; round: number }>
> {
  if (projectIds.length === 0) return {}

  const supabase = createAdminClient() as any

  // Get current rounds for all projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, current_review_round')
    .in('id', projectIds)

  if (projectsError) {
    console.error('[getProjectReviewCounts] Error:', projectsError)
    return {}
  }

  const roundsByProject: Record<string, number> = {}
  for (const p of projects || []) {
    roundsByProject[p.id] = p.current_review_round
  }

  // Get reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from('project_reviews')
    .select('project_id, review_round, vote')
    .in('project_id', projectIds)

  if (reviewsError) {
    console.error('[getProjectReviewCounts] Error:', reviewsError)
    return {}
  }

  const counts: Record<string, { approve: number; request_changes: number; round: number }> = {}

  for (const projectId of projectIds) {
    const round = roundsByProject[projectId] || 0
    counts[projectId] = { approve: 0, request_changes: 0, round }
  }

  for (const review of reviews || []) {
    const projectRound = roundsByProject[review.project_id]
    // Only count reviews from current round
    if (review.review_round === projectRound) {
      if (review.vote === 'approve') {
        counts[review.project_id].approve++
      } else {
        counts[review.project_id].request_changes++
      }
    }
  }

  return counts
}
