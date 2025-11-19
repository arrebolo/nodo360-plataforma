/**
 * Lesson Access Control
 *
 * Determines if a user can access a specific lesson based on:
 * - Module must be accessible
 * - Lessons must be completed sequentially within a module
 */

import type { Lesson } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { checkModuleAccess } from './checkModuleAccess'

export interface LessonAccessResult {
  canAccess: boolean
  reason?: 'module_locked' | 'previous_lesson_incomplete' | 'accessible'
  previousLessonId?: string
  previousLessonTitle?: string
}

/**
 * Check if a user can access a specific lesson
 *
 * Rules:
 * - Module must be accessible first
 * - First lesson in module is always accessible (if module is accessible)
 * - Must complete previous lesson to access next one
 *
 * @param userId - User ID (null for anonymous users)
 * @param lessonId - Lesson to check access for
 * @param courseIsFree - Whether the course is free
 * @returns LessonAccessResult with access status and reason
 */
export async function checkLessonAccess(
  userId: string | null,
  lessonId: string,
  courseIsFree: boolean
): Promise<LessonAccessResult> {
  const supabase = createClient()

  // Get lesson info with module
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      order_index,
      module_id,
      title,
      modules (
        id,
        course_id,
        order_index,
        requires_quiz
      )
    `)
    .eq('id', lessonId)
    .single()

  if (lessonError || !lesson || !(lesson as any).modules) {
    return { canAccess: false }
  }

  // Type cast to fix Supabase generated types
  const lessonData = lesson as any

  // Check if module is accessible
  const moduleAccess = await checkModuleAccess(
    userId,
    lessonData.module_id,
    courseIsFree
  )

  if (!moduleAccess.canAccess) {
    return {
      canAccess: false,
      reason: 'module_locked',
    }
  }

  // First lesson in module is always accessible (if module is accessible)
  if (lessonData.order_index === 1) {
    return {
      canAccess: true,
      reason: 'accessible',
    }
  }

  // For anonymous users, use localStorage to check completion
  if (!userId) {
    // This will be handled by client-side code
    // For server-side, we can't check localStorage
    return {
      canAccess: true, // Allow access on server, will be gated on client
      reason: 'accessible',
    }
  }

  // Check if previous lesson is completed
  const { data: previousLesson } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('module_id', lessonData.module_id)
    .eq('order_index', lessonData.order_index - 1)
    .single()

  if (!previousLesson) {
    return { canAccess: false }
  }

  // Type cast to fix Supabase generated types
  const prevLessonData = previousLesson as any

  // Check if user completed previous lesson
  const { data: progress } = await supabase
    .from('user_progress')
    .select('is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', prevLessonData.id)
    .single()

  const previousLessonCompleted = (progress as any)?.is_completed === true

  if (previousLessonCompleted) {
    return {
      canAccess: true,
      reason: 'accessible',
    }
  }

  return {
    canAccess: false,
    reason: 'previous_lesson_incomplete',
    previousLessonId: prevLessonData.id,
    previousLessonTitle: prevLessonData.title,
  }
}

/**
 * Check lesson access for client-side (localStorage)
 *
 * This version uses localStorage to check if previous lesson is completed
 */
export function checkLessonAccessClient(
  lessonOrderIndex: number,
  moduleOrderIndex: number,
  courseIsFree: boolean,
  moduleIsAccessible: boolean,
  previousLessonCompleted?: boolean
): LessonAccessResult {
  // Check module access first
  if (!moduleIsAccessible) {
    return {
      canAccess: false,
      reason: 'module_locked',
    }
  }

  // First lesson in module is always accessible
  if (lessonOrderIndex === 1) {
    return {
      canAccess: true,
      reason: 'accessible',
    }
  }

  // Check if previous lesson is completed
  if (previousLessonCompleted) {
    return {
      canAccess: true,
      reason: 'accessible',
    }
  }

  return {
    canAccess: false,
    reason: 'previous_lesson_incomplete',
  }
}

/**
 * Get all accessible lessons for a module
 *
 * @param userId - User ID (null for anonymous)
 * @param moduleId - Module ID
 * @param courseIsFree - Whether course is free
 * @returns Array of lesson IDs that are accessible
 */
export async function getAccessibleLessons(
  userId: string | null,
  moduleId: string,
  courseIsFree: boolean
): Promise<string[]> {
  const supabase = createClient()

  // First check if module is accessible
  const moduleAccess = await checkModuleAccess(userId, moduleId, courseIsFree)
  if (!moduleAccess.canAccess) {
    return []
  }

  // Get all lessons for the module
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (!lessons || lessons.length === 0) {
    return []
  }

  const lessonsData = lessons as any[]
  const accessibleLessonIds: string[] = []

  // Check each lesson
  for (const lesson of lessonsData) {
    const access = await checkLessonAccess(userId, lesson.id, courseIsFree)
    if (access.canAccess) {
      accessibleLessonIds.push(lesson.id)
    } else {
      // Stop at first inaccessible lesson (sequential gating)
      break
    }
  }

  return accessibleLessonIds
}

/**
 * Get the next available lesson for a user to study
 *
 * Used for "Continue Learning" functionality
 */
export async function getNextAvailableLesson(
  userId: string | null,
  courseId: string,
  courseIsFree: boolean
): Promise<Lesson | null> {
  const supabase = createClient()

  // Get all modules for the course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (!modules || modules.length === 0) {
    return null
  }

  const modulesData = modules as any[]

  // Check each module
  for (const module of modulesData) {
    // Check if module is accessible
    const moduleAccess = await checkModuleAccess(userId, module.id, courseIsFree)
    if (!moduleAccess.canAccess) {
      continue
    }

    // Get lessons for this module
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', module.id)
      .order('order_index', { ascending: true })

    if (!lessons || lessons.length === 0) {
      continue
    }

    const lessonsData = lessons as any[]

    // Find first incomplete lesson
    for (const lesson of lessonsData) {
      if (!userId) {
        // For anonymous users, return first lesson of first accessible module
        return lesson
      }

      // Check if lesson is completed
      const { data: progress } = await supabase
        .from('user_progress')
        .select('is_completed')
        .eq('user_id', userId)
        .eq('lesson_id', lesson.id)
        .single()

      if (!progress || !(progress as any).is_completed) {
        // Check if this lesson is accessible
        const lessonAccess = await checkLessonAccess(userId, lesson.id, courseIsFree)
        if (lessonAccess.canAccess) {
          return lesson
        }
      }
    }
  }

  return null
}

/**
 * Calculate course progress percentage
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Progress percentage (0-100)
 */
export async function calculateCourseProgress(
  userId: string,
  courseId: string
): Promise<number> {
  const supabase = createClient()

  // Get total lessons in course
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      id,
      modules!inner (
        course_id
      )
    `)
    .eq('modules.course_id', courseId)

  if (!lessons || lessons.length === 0) {
    return 0
  }

  const lessonsData = lessons as any[]
  const totalLessons = lessonsData.length

  // Get completed lessons
  const { data: completedProgress } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .in(
      'lesson_id',
      lessonsData.map((l) => l.id)
    )

  const completedLessons = (completedProgress as any)?.length || 0

  return Math.round((completedLessons / totalLessons) * 100)
}
