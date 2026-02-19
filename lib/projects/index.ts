/**
 * Projects System — Main CRUD operations
 * Server-side functions for community projects
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Project,
  ProjectStatus,
  ProjectCategory,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilters,
} from '@/types/projects'

// =====================================================
// READ functions
// =====================================================

/**
 * Get a single project by ID with author info
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      author:users!projects_author_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('[getProject] Error:', error)
    return null
  }

  return data
}

/**
 * Get projects for a specific author
 */
export async function getProjectsByAuthor(authorId: string): Promise<Project[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      author:users!projects_author_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getProjectsByAuthor] Error:', error)
    return []
  }

  return data || []
}

/**
 * Get public projects (approved, in_progress, completed)
 */
export async function getPublicProjects(filters?: ProjectFilters): Promise<{
  projects: Project[]
  total: number
}> {
  const supabase = createAdminClient() as any
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 12
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('projects')
    .select(`
      *,
      author:users!projects_author_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('is_public', true)
    .in('status', ['approved', 'in_progress', 'completed'])

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[getPublicProjects] Error:', error)
    return { projects: [], total: 0 }
  }

  return { projects: data || [], total: count || 0 }
}

/**
 * Get projects pending review (for mentors)
 */
export async function getProjectsForMentorReview(): Promise<Project[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      author:users!projects_author_id_fkey (
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('[getProjectsForMentorReview] Error:', error)
    return []
  }

  return data || []
}

// =====================================================
// WRITE functions
// =====================================================

/**
 * Create a new project (draft status)
 */
export async function createProject(
  authorId: string,
  input: CreateProjectInput
): Promise<{ data: Project | null; error: string | null }> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('projects')
    .insert({
      author_id: authorId,
      title: input.title.trim(),
      summary: input.summary.trim(),
      description: input.description.trim(),
      category: input.category,
      status: 'draft',
      current_review_round: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('[createProject] Error:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<{ data: Project | null; error: string | null }> {
  const supabase = createAdminClient() as any

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title.trim()
  if (input.summary !== undefined) updateData.summary = input.summary.trim()
  if (input.description !== undefined) updateData.description = input.description.trim()
  if (input.category !== undefined) updateData.category = input.category

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('[updateProject] Error:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Submit project for review (changes status to pending_review)
 */
export async function submitProjectForReview(projectId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = createAdminClient() as any

  // Verify project is in draft or changes_requested
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single()

  if (fetchError) {
    console.error('[submitProjectForReview] Error fetching:', fetchError)
    return { success: false, error: 'Proyecto no encontrado' }
  }

  if (!['draft', 'changes_requested'].includes(project.status)) {
    return { success: false, error: 'El proyecto no puede ser enviado a revisión en su estado actual' }
  }

  // Update status - trigger will bump review_round
  const { error } = await supabase
    .from('projects')
    .update({ status: 'pending_review' })
    .eq('id', projectId)

  if (error) {
    console.error('[submitProjectForReview] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Start a project (changes status to in_progress)
 */
export async function startProject(projectId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('projects')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('status', 'approved')

  if (error) {
    console.error('[startProject] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Complete a project
 */
export async function completeProject(projectId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('projects')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('status', 'in_progress')

  if (error) {
    console.error('[completeProject] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Archive a project (soft delete)
 */
export async function archiveProject(projectId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', projectId)

  if (error) {
    console.error('[archiveProject] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Delete a project (only drafts)
 */
export async function deleteProject(projectId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('status', 'draft')

  if (error) {
    console.error('[deleteProject] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// =====================================================
// ADMIN functions
// =====================================================

/**
 * Admin: Update project status directly
 */
export async function adminUpdateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  rejectionReason?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient() as any

  const updateData: Record<string, unknown> = { status }

  if (status === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }
  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)

  if (error) {
    console.error('[adminUpdateProjectStatus] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Admin: List all projects with filters
 */
export async function adminListProjects(filters?: ProjectFilters & {
  includePrivate?: boolean
}): Promise<{ projects: Project[]; total: number }> {
  const supabase = createAdminClient() as any
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 25
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('projects')
    .select(`
      *,
      author:users!projects_author_id_fkey (
        id,
        full_name,
        avatar_url,
        email
      )
    `, { count: 'exact' })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.authorId) {
    query = query.eq('author_id', filters.authorId)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[adminListProjects] Error:', error)
    return { projects: [], total: 0 }
  }

  return { projects: data || [], total: count || 0 }
}
