/**
 * Course Reviews (2-approval system)
 * Server-side functions for mentor course reviews
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { CourseReviewVote } from '@/types/database'

/**
 * Fetch reviews for a course with mentor name
 */
export async function getCourseReviews(courseId: string) {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('course_reviews')
    .select(`
      id,
      course_id,
      mentor_id,
      vote,
      comment,
      created_at,
      updated_at,
      users!course_reviews_mentor_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getCourseReviews] Error:', error)
    return []
  }

  return data || []
}

/**
 * Submit a review for a course
 * Validates that comment is required for request_changes
 */
export async function submitReview(
  courseId: string,
  mentorId: string,
  vote: CourseReviewVote,
  comment?: string | null
) {
  const supabase = createAdminClient() as any

  // Validate comment is required for request_changes
  if (vote === 'request_changes' && (!comment || comment.trim().length < 10)) {
    return {
      success: false,
      error: 'Debes proporcionar un comentario (mínimo 10 caracteres) al solicitar cambios',
    }
  }

  const { data, error } = await supabase
    .from('course_reviews')
    .insert({
      course_id: courseId,
      mentor_id: mentorId,
      vote,
      comment: comment?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violation = already voted
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Ya has votado en este curso',
      }
    }
    console.error('[submitReview] Error:', error)
    return {
      success: false,
      error: 'Error al enviar la revisión: ' + error.message,
    }
  }

  return { success: true, data }
}

/**
 * Get courses pending review for mentors
 */
export async function getCoursesForMentorReview() {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      level,
      is_free,
      price,
      thumbnail_url,
      created_at,
      updated_at,
      users!courses_instructor_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('[getCoursesForMentorReview] Error:', error)
    return []
  }

  return data || []
}

/**
 * Check if a mentor can still review a course (hasn't voted yet)
 */
export async function canMentorReview(courseId: string, mentorId: string) {
  const supabase = createAdminClient() as any

  const { count, error } = await supabase
    .from('course_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('mentor_id', mentorId)

  if (error) {
    console.error('[canMentorReview] Error:', error)
    return false
  }

  return (count || 0) === 0
}

/**
 * Delete all reviews for a course (used when instructor resubmits)
 */
export async function resetCourseReviews(courseId: string) {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('course_reviews')
    .delete()
    .eq('course_id', courseId)

  if (error) {
    console.error('[resetCourseReviews] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get review counts for multiple courses
 */
export async function getReviewCounts(courseIds: string[]) {
  if (courseIds.length === 0) return {}

  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('course_reviews')
    .select('course_id, vote')
    .in('course_id', courseIds)

  if (error) {
    console.error('[getReviewCounts] Error:', error)
    return {}
  }

  const counts: Record<string, { approve: number; request_changes: number }> = {}

  for (const review of data || []) {
    if (!counts[review.course_id]) {
      counts[review.course_id] = { approve: 0, request_changes: 0 }
    }
    if (review.vote === 'approve') {
      counts[review.course_id].approve++
    } else {
      counts[review.course_id].request_changes++
    }
  }

  return counts
}
