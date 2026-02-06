/**
 * Lesson Comments Library
 * Server-side functions for lesson comment operations
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { LessonCommentWithUser } from '@/types/database'

/**
 * Get all comments for a lesson, ordered by created_at ASC
 * Includes user info (name, avatar, role)
 */
export async function getCommentsByLesson(lessonId: string): Promise<LessonCommentWithUser[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('lesson_comments')
    .select(`
      id,
      lesson_id,
      user_id,
      content,
      is_hidden,
      is_answer,
      created_at,
      updated_at,
      users!lesson_comments_user_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ [getCommentsByLesson] Error:', error)
    return []
  }

  // Transform to expected format
  return (data || []).map((comment: any) => ({
    id: comment.id,
    lesson_id: comment.lesson_id,
    user_id: comment.user_id,
    content: comment.content,
    is_hidden: comment.is_hidden,
    is_answer: comment.is_answer,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    user: comment.users,
  }))
}

/**
 * Create a new comment on a lesson
 */
export async function createComment(
  lessonId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('lesson_comments')
    .insert({
      lesson_id: lessonId,
      user_id: userId,
      content: content.trim(),
    })
    .select(`
      id,
      lesson_id,
      user_id,
      content,
      is_hidden,
      is_answer,
      created_at,
      updated_at,
      users!lesson_comments_user_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .single()

  if (error) {
    console.error('❌ [createComment] Error:', error)
    return { success: false, error: error.message }
  }

  console.log('✅ [createComment] Comment created:', data.id)

  return {
    success: true,
    data: {
      ...data,
      user: data.users,
    },
  }
}

/**
 * Update a comment's content
 * Verifies the user is the author
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient() as any

  // First verify ownership
  const { data: existing } = await supabase
    .from('lesson_comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!existing) {
    return { success: false, error: 'Comentario no encontrado' }
  }

  if (existing.user_id !== userId) {
    return { success: false, error: 'No tienes permiso para editar este comentario' }
  }

  const { error } = await supabase
    .from('lesson_comments')
    .update({ content: content.trim() })
    .eq('id', commentId)

  if (error) {
    console.error('❌ [updateComment] Error:', error)
    return { success: false, error: error.message }
  }

  console.log('✅ [updateComment] Comment updated:', commentId)
  return { success: true }
}

/**
 * Hide a comment (soft-delete for moderation)
 * Admin only
 */
export async function hideComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('lesson_comments')
    .update({ is_hidden: true })
    .eq('id', commentId)

  if (error) {
    console.error('❌ [hideComment] Error:', error)
    return { success: false, error: error.message }
  }

  console.log('✅ [hideComment] Comment hidden:', commentId)
  return { success: true }
}

/**
 * Mark a comment as answer (useful response)
 * Only instructor of the course, mentor, or admin can do this
 */
export async function markAsAnswer(
  commentId: string,
  isAnswer: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('lesson_comments')
    .update({ is_answer: isAnswer })
    .eq('id', commentId)

  if (error) {
    console.error('❌ [markAsAnswer] Error:', error)
    return { success: false, error: error.message }
  }

  console.log('✅ [markAsAnswer] Comment marked as answer:', commentId, isAnswer)
  return { success: true }
}

/**
 * Get comment count for a lesson (excluding hidden)
 */
export async function getCommentCount(lessonId: string): Promise<number> {
  const supabase = createAdminClient() as any

  const { count, error } = await supabase
    .from('lesson_comments')
    .select('*', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)
    .eq('is_hidden', false)

  if (error) {
    console.error('❌ [getCommentCount] Error:', error)
    return 0
  }

  return count || 0
}

/**
 * Get course info for a lesson (used to find instructor)
 */
export async function getLessonCourseInfo(lessonId: string): Promise<{
  courseId: string
  courseSlug: string
  courseTitle: string
  instructorId: string | null
  lessonTitle: string
} | null> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      modules!inner (
        course_id,
        courses!inner (
          id,
          slug,
          title,
          instructor_id
        )
      )
    `)
    .eq('id', lessonId)
    .single()

  if (error || !data) {
    console.error('❌ [getLessonCourseInfo] Error:', error)
    return null
  }

  const course = (data.modules as any).courses
  return {
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    instructorId: course.instructor_id,
    lessonTitle: data.title,
  }
}
