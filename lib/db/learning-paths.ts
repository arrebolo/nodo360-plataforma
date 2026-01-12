/**
 * Learning Paths Database Queries
 *
 * Queries for learning paths and their associated courses.
 * Uses Supabase types as source of truth.
 */

import { createClient } from '@/lib/supabase/server'
import type { LearningPath } from '@/types/database'
import type { Database } from '@/lib/supabase/types'

// Use Supabase-generated types for courses
type CourseRow = Database['public']['Tables']['courses']['Row']

// =====================================================
// TYPES
// =====================================================

export type CourseWithPosition = CourseRow & { position: number; is_required: boolean }

export interface LearningPathWithCourses extends LearningPath {
  courses: CourseWithPosition[]
}

// =====================================================
// LEARNING PATH QUERIES
// =====================================================

/**
 * Get all active learning paths ordered by position
 */
export async function getLearningPaths(): Promise<LearningPath[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) {
    console.error('[getLearningPaths] Error:', error)
    throw error
  }

  return data || []
}

/**
 * Get a learning path by slug
 */
export async function getLearningPathBySlug(slug: string): Promise<LearningPath | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[getLearningPathBySlug] Error:', error)
    throw error
  }

  return data
}

/**
 * Get courses for a learning path by slug, ordered by position
 */
export async function getCoursesByLearningPathSlug(
  slug: string
): Promise<CourseWithPosition[]> {
  const supabase = await createClient()

  // First get the learning path
  const { data: path, error: pathError } = await supabase
    .from('learning_paths')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (pathError || !path) {
    return []
  }

  // Get courses through learning_path_courses junction table
  const { data, error } = await supabase
    .from('learning_path_courses')
    .select(`
      position,
      is_required,
      course:course_id (*)
    `)
    .eq('learning_path_id', path.id)
    .order('position', { ascending: true })

  if (error) {
    console.error('[getCoursesByLearningPathSlug] Error:', error)
    throw error
  }

  // Transform the data to flatten the course object
  const courses = (data || [])
    .filter((item) => item.course !== null)
    .map((item) => ({
      ...(item.course as unknown as CourseRow),
      position: item.position,
      is_required: item.is_required,
    }))
    // Only include published courses
    .filter((course) => course.status === 'published')

  return courses
}

/**
 * Get a learning path with all its courses
 */
export async function getLearningPathWithCourses(
  slug: string
): Promise<LearningPathWithCourses | null> {
  const path = await getLearningPathBySlug(slug)
  if (!path) return null

  const courses = await getCoursesByLearningPathSlug(slug)

  return {
    ...path,
    courses,
  }
}


