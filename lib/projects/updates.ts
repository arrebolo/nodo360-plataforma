/**
 * Project Updates
 * Server-side functions for project progress updates
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ProjectUpdate, CreateProjectUpdateInput } from '@/types/projects'

// =====================================================
// READ functions
// =====================================================

/**
 * Get all updates for a project
 */
export async function getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_updates')
    .select(`
      id,
      project_id,
      author_id,
      title,
      content,
      created_at,
      author:users!project_updates_author_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getProjectUpdates] Error:', error)
    return []
  }

  return data || []
}

/**
 * Get a single update by ID
 */
export async function getProjectUpdate(updateId: string): Promise<ProjectUpdate | null> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_updates')
    .select(`
      id,
      project_id,
      author_id,
      title,
      content,
      created_at,
      author:users!project_updates_author_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('id', updateId)
    .single()

  if (error) {
    console.error('[getProjectUpdate] Error:', error)
    return null
  }

  return data
}

/**
 * Get recent updates across all public projects (for feed)
 */
export async function getRecentPublicUpdates(limit: number = 10): Promise<ProjectUpdate[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('project_updates')
    .select(`
      id,
      project_id,
      author_id,
      title,
      content,
      created_at,
      author:users!project_updates_author_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      project:projects!project_updates_project_id_fkey (
        id,
        title,
        status,
        is_public
      )
    `)
    .eq('project.is_public', true)
    .in('project.status', ['approved', 'in_progress', 'completed'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getRecentPublicUpdates] Error:', error)
    return []
  }

  return data || []
}

// =====================================================
// WRITE functions
// =====================================================

/**
 * Create a new project update
 */
export async function createProjectUpdate(
  projectId: string,
  authorId: string,
  input: CreateProjectUpdateInput
): Promise<{ data: ProjectUpdate | null; error: string | null }> {
  const supabase = createAdminClient() as any

  // Verify project status allows updates
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { data: null, error: 'Proyecto no encontrado' }
  }

  if (!['approved', 'in_progress', 'completed'].includes(project.status)) {
    return { data: null, error: 'Solo se pueden publicar actualizaciones en proyectos aprobados' }
  }

  // Validate input
  if (!input.title.trim() || input.title.length < 5) {
    return { data: null, error: 'El título debe tener al menos 5 caracteres' }
  }
  if (!input.content.trim() || input.content.length < 20) {
    return { data: null, error: 'El contenido debe tener al menos 20 caracteres' }
  }

  const { data, error } = await supabase
    .from('project_updates')
    .insert({
      project_id: projectId,
      author_id: authorId,
      title: input.title.trim(),
      content: input.content.trim(),
    })
    .select(`
      id,
      project_id,
      author_id,
      title,
      content,
      created_at,
      author:users!project_updates_author_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('[createProjectUpdate] Error:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Delete a project update (author only)
 */
export async function deleteProjectUpdate(
  updateId: string,
  authorId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('project_updates')
    .delete()
    .eq('id', updateId)
    .eq('author_id', authorId)

  if (error) {
    console.error('[deleteProjectUpdate] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Admin: Delete any project update
 */
export async function adminDeleteProjectUpdate(updateId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('project_updates')
    .delete()
    .eq('id', updateId)

  if (error) {
    console.error('[adminDeleteProjectUpdate] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Get update count for a project
 */
export async function getUpdateCount(projectId: string): Promise<number> {
  const supabase = createAdminClient() as any

  const { count, error } = await supabase
    .from('project_updates')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (error) {
    console.error('[getUpdateCount] Error:', error)
    return 0
  }

  return count || 0
}
