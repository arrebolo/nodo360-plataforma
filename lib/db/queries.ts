/**
 * Database Query Helpers
 *
 * Reusable functions for common database queries
 * These functions use Supabase client and return typed results
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type {
  Course,
  CourseWithInstructor,
  CourseWithModules,
  Module,
  Lesson,
  UserProgress,
  Bookmark,
  Note,
  CourseProgress,
} from '@/types/database'

// =====================================================
// COURSE QUERIES
// =====================================================

/**
 * Get all published courses
 */
export async function getAllCourses(): Promise<CourseWithInstructor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:instructor_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('[getAllCourses] Error:', error)
    throw error
  }

  logger.debug('getAllCourses', { count: data?.length || 0 })
  return data || []
}

/**
 * Get a single course by slug with full details
 */
export async function getCourseBySlug(
  slug: string
): Promise<CourseWithModules | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:instructor_id (
        id,
        full_name,
        avatar_url,
        bio
      ),
      modules (
        *,
        lessons (
          *
        )
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    logger.error('[getCourseBySlug] Error:', error)
    throw error
  }

  logger.debug('getCourseBySlug', { slug, found: !!data })
  return data
}

/**
 * Get user's enrolled courses
 */
export async function getUserEnrolledCourses(
  userId: string
): Promise<CourseWithInstructor[]> {
  const supabase = await createClient()

  // Get courses where user has progress
  const { data, error } = await supabase
    .from('user_progress')
    .select(`
      lessons:lesson_id (
        module:module_id (
          course:course_id (
            *,
            instructor:instructor_id (
              id,
              full_name,
              avatar_url
            )
          )
        )
      )
    `)
    .eq('user_id', userId)

  if (error) throw error

  // Extract unique courses
  const courses = new Map<string, CourseWithInstructor>()
  data?.forEach((item: any) => {
    const course = item.lessons?.module?.course
    if (course && !courses.has(course.id)) {
      courses.set(course.id, course)
    }
  })

  return Array.from(courses.values())
}

// =====================================================
// PROGRESS QUERIES
// =====================================================

/**
 * Get user's progress for a course
 */
// Comentado para MVP - requiere autenticación y tiene error de tipo en nested query
/*
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgress> {
  const supabase = await createClient()

  // Get all lessons in the course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .in(
      'module_id',
      supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)
    )

  if (lessonsError) throw lessonsError

  const totalLessons = lessons?.length || 0
  const lessonIds = lessons?.map((l: any) => l.id) || []

  // Get user progress for these lessons
  const { data: progress, error: progressError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  if (progressError) throw progressError

  const completedLessons =
    progress?.filter((p) => p.is_completed).length || 0
  const totalWatchTime =
    progress?.reduce((sum, p) => sum + p.watch_time_seconds, 0) || 0
  const lastWatched =
    progress?.[0]?.updated_at ||
    null

  return {
    course_id: courseId,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    total_watch_time_seconds: totalWatchTime,
    last_watched_at: lastWatched,
    completion_percentage:
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0,
  }
}
*/

/**
 * Check if user completed a lesson
 */
export async function isLessonCompleted(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_progress')
    .select('is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  return data?.is_completed || false
}

/**
 * Mark lesson as completed
 */
export async function markLessonCompleted(
  userId: string,
  lessonId: string
): Promise<UserProgress> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,lesson_id',
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// BOOKMARK QUERIES
// =====================================================

/**
 * Check if lesson is bookmarked
 */
export async function isLessonBookmarked(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  return !!data
}

/**
 * Get all user bookmarks
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      lessons:lesson_id (
        *,
        module:module_id (
          *,
          course:course_id (
            *
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// =====================================================
// NOTE QUERIES
// =====================================================

/**
 * Get notes for a lesson
 */
export async function getLessonNotes(
  userId: string,
  lessonId: string
): Promise<Note[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get all user notes
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      lessons:lesson_id (
        *,
        module:module_id (
          *,
          course:course_id (
            *
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// =====================================================
// LESSON QUERIES
// =====================================================

/**
 * Get next lesson in a course
 */
export async function getNextLesson(
  lessonId: string
): Promise<Lesson | null> {
  const supabase = await createClient()

  // Get current lesson
  const { data: currentLesson, error: currentError } = await supabase
    .from('lessons')
    .select('module_id, order_index')
    .eq('id', lessonId)
    .single()

  if (currentError) throw currentError

  // Try to get next lesson in same module
  const { data: nextInModule, error: nextError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', currentLesson.module_id)
    .gt('order_index', currentLesson.order_index)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()

  if (!nextError && nextInModule) {
    return nextInModule
  }

  // If no next lesson in module, get first lesson of next module
  const { data: currentModule, error: moduleError } = await supabase
    .from('modules')
    .select('course_id, order_index')
    .eq('id', currentLesson.module_id)
    .single()

  if (moduleError) throw moduleError

  const { data: nextModule, error: nextModuleError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', currentModule.course_id)
    .gt('order_index', currentModule.order_index)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()

  if (nextModuleError || !nextModule) return null

  const { data: firstLesson, error: firstError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', nextModule.id)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()

  if (firstError) return null

  return firstLesson
}

/**
 * Get previous lesson in a course
 */
export async function getPreviousLesson(
  lessonId: string
): Promise<Lesson | null> {
  const supabase = await createClient()

  // Get current lesson
  const { data: currentLesson, error: currentError } = await supabase
    .from('lessons')
    .select('module_id, order_index')
    .eq('id', lessonId)
    .single()

  if (currentError) throw currentError

  // Try to get previous lesson in same module
  const { data: prevInModule, error: prevError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', currentLesson.module_id)
    .lt('order_index', currentLesson.order_index)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  if (!prevError && prevInModule) {
    return prevInModule
  }

  // If no previous lesson in module, get last lesson of previous module
  const { data: currentModule, error: moduleError } = await supabase
    .from('modules')
    .select('course_id, order_index')
    .eq('id', currentLesson.module_id)
    .single()

  if (moduleError) throw moduleError

  const { data: prevModule, error: prevModuleError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', currentModule.course_id)
    .lt('order_index', currentModule.order_index)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  if (prevModuleError || !prevModule) return null

  const { data: lastLesson, error: lastError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', prevModule.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  if (lastError) return null

  return lastLesson
}

/**
 * Example usage in a Server Component:
 *
 * import { getCourseBySlug, getCourseProgress } from '@/lib/db/queries'
 *
 * export default async function CoursePage({ params }) {
 *   const course = await getCourseBySlug(params.slug)
 *   const progress = await getCourseProgress(userId, course.id)
 *
 *   return <div>Course completion: {progress.completion_percentage}%</div>
 * }
 */

/**
 * Get lesson by slug within a course
 * Structure: lessons → modules → courses
 * Note: PostgREST does not support filtering on nested relations,
 * so we fetch by lesson slug and verify course in JavaScript
 */
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<any> {
  console.log('🔍 Buscando lección:', { courseSlug, lessonSlug })
  
  const supabase = await createClient()

  // Primero obtener el curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()

  if (courseError || !course) {
    console.error('❌ Error fetching course:', courseError)
    return null
  }

  // Luego obtener los módulos de ese curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id)

  if (modulesError || !modules) {
    console.error('❌ Error fetching modules:', modulesError)
    return null
  }

  const moduleIds = modules.map(m => m.id)

  // Buscar la lección SOLO en los módulos de este curso
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', lessonSlug)
    .in('module_id', moduleIds)
    .single()

  if (lessonError || !lesson) {
    console.error('❌ Error fetching lesson:', {
      lessonSlug,
      error: lessonError
    })
    return null
  }

  // Obtener el módulo completo con el curso
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select(`
      *,
      course:course_id (*)
    `)
    .eq('id', lesson.module_id)
    .single()

  if (moduleError || !module) {
    console.error('❌ Error fetching module:', moduleError)
    return null
  }

  console.log('✅ Lección encontrada')
  
  return {
    ...lesson,
    module: module
  }
}
export async function getAllLessonsForCourse(courseSlug: string) {
  // First, get the course with its modules
  const course = await getCourseBySlug(courseSlug)
  if (!course) {
    logger.debug('getAllLessonsForCourse', { courseSlug, found: false })
    return []
  }

  const supabase = await createClient()

  // Get all lessons for the course's modules
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      module:module_id (
        id,
        title,
        order_index,
        course_id
      )
    `)
    .in(
      'module_id',
      course.modules?.map(m => m.id) || []
    )
    .order('order_index', { ascending: true })

  if (error) {
    logger.error('[getAllLessonsForCourse] Error:', error)
    throw error
  }

  logger.debug('getAllLessonsForCourse', { courseSlug, count: data?.length || 0 })
  return data || []
}
