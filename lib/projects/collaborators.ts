/**
 * Project Collaborators
 * Server-side functions for managing project collaborators
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ProjectCollaborator, ProjectCollaboratorStatus } from '@/types/projects'

// =====================================================
// READ functions
// =====================================================

/**
 * Get all collaborators for a project
 */
export async function getProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_collaborators')
    .select(`
      id,
      project_id,
      user_id,
      invited_by,
      status,
      joined_at,
      created_at,
      user:users!project_collaborators_user_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      inviter:users!project_collaborators_invited_by_fkey (
        id,
        full_name
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getProjectCollaborators] Error:', error)
    return []
  }

  return data || []
}

/**
 * Get accepted collaborators only
 */
export async function getAcceptedCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_collaborators')
    .select(`
      id,
      project_id,
      user_id,
      invited_by,
      status,
      joined_at,
      created_at,
      user:users!project_collaborators_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .eq('status', 'accepted')
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('[getAcceptedCollaborators] Error:', error)
    return []
  }

  return data || []
}

/**
 * Get pending invitations for a user
 */
export async function getPendingInvitations(userId: string): Promise<ProjectCollaborator[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_collaborators')
    .select(`
      id,
      project_id,
      user_id,
      invited_by,
      status,
      created_at,
      project:projects!project_collaborators_project_id_fkey (
        id,
        title,
        summary,
        author:users!projects_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      ),
      inviter:users!project_collaborators_invited_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getPendingInvitations] Error:', error)
    return []
  }

  return data || []
}

/**
 * Get projects where user is a collaborator
 */
export async function getCollaboratingProjects(userId: string): Promise<ProjectCollaborator[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_collaborators')
    .select(`
      id,
      project_id,
      status,
      joined_at,
      project:projects!project_collaborators_project_id_fkey (
        id,
        title,
        summary,
        status,
        category,
        author:users!projects_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('[getCollaboratingProjects] Error:', error)
    return []
  }

  return data || []
}

/**
 * Check if user is a collaborator on a project
 */
export async function isProjectCollaborator(
  projectId: string,
  userId: string
): Promise<boolean> {
  const supabase = createAdminClient() as any

  const { count, error } = await supabase
    .from('project_collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('status', 'accepted')

  if (error) {
    console.error('[isProjectCollaborator] Error:', error)
    return false
  }

  return (count || 0) > 0
}

// =====================================================
// WRITE functions
// =====================================================

/**
 * Invite a user to collaborate on a project
 */
export async function inviteCollaborator(
  projectId: string,
  userId: string,
  invitedBy: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient() as any

  // Check if already invited
  const { count } = await supabase
    .from('project_collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if ((count || 0) > 0) {
    return { success: false, error: 'Este usuario ya ha sido invitado' }
  }

  const { error } = await supabase
    .from('project_collaborators')
    .insert({
      project_id: projectId,
      user_id: userId,
      invited_by: invitedBy,
      status: 'pending',
    })

  if (error) {
    console.error('[inviteCollaborator] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Accept a collaboration invitation
 */
export async function acceptInvitation(
  collaboratorId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('project_collaborators')
    .update({
      status: 'accepted',
      joined_at: new Date().toISOString(),
    })
    .eq('id', collaboratorId)
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) {
    console.error('[acceptInvitation] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Decline a collaboration invitation
 */
export async function declineInvitation(
  collaboratorId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('project_collaborators')
    .update({ status: 'declined' })
    .eq('id', collaboratorId)
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) {
    console.error('[declineInvitation] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Remove a collaborator from a project
 */
export async function removeCollaborator(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('project_collaborators')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) {
    console.error('[removeCollaborator] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Get collaborator count for a project
 */
export async function getCollaboratorCount(projectId: string): Promise<number> {
  const supabase = createAdminClient() as any

  const { count, error } = await supabase
    .from('project_collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('status', 'accepted')

  if (error) {
    console.error('[getCollaboratorCount] Error:', error)
    return 0
  }

  return count || 0
}
