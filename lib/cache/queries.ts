import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Cached queries for server components
 * React's cache() deduplicates calls within a single request
 */

// Cache: Published courses list
export const getPublishedCourses = cache(async () => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('courses')
    .select('id, title, slug, description, thumbnail_url, level, category, is_free, total_lessons, total_duration_minutes')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return data || []
})

// Cache: Course by slug with modules and lessons
export const getCourseBySlug = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      long_description,
      thumbnail_url,
      banner_url,
      level,
      category,
      status,
      is_free,
      is_premium,
      total_modules,
      total_lessons,
      total_duration_minutes,
      instructor_id,
      modules:modules (
        id,
        title,
        slug,
        order_index,
        total_lessons,
        lessons:lessons (
          id,
          title,
          slug,
          order_index,
          video_duration_minutes,
          is_free_preview
        )
      )
    `)
    .eq('slug', slug)
    .single()

  return data
})

// Cache: Learning paths
export const getLearningPaths = cache(async () => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('learning_paths')
    .select('id, title, slug, description, icon, color, order_index')
    .order('order_index')

  return data || []
})

// Cache: Learning path by slug with courses
export const getLearningPathBySlug = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('learning_paths')
    .select(`
      id,
      title,
      slug,
      description,
      icon,
      color,
      order_index,
      learning_path_courses (
        order_index,
        course:course_id (
          id,
          title,
          slug,
          description,
          thumbnail_url,
          level,
          total_lessons,
          total_duration_minutes
        )
      )
    `)
    .eq('slug', slug)
    .single()

  return data
})

// Cache: Gamification settings (rarely changes)
export const getGamificationSettings = cache(async () => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('gamification_settings')
    .select('*')
    .single()

  return data
})

// Cache: Badge definitions
export const getBadgeDefinitions = cache(async () => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('badges')
    .select('id, name, description, icon_url, requirement_type, requirement_value, xp_reward')
    .eq('is_active', true)
    .order('requirement_value')

  return data || []
})

// Cache: Level configurations
export const getLevelConfigs = cache(async () => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('level_configs')
    .select('level, xp_required, title, perks')
    .order('level')

  return data || []
})
