/**
 * Module Access Control
 *
 * Determines if a user can access a specific module based on:
 * - Free courses: Only Module 1 accessible
 * - Premium courses: Sequential unlocking based on quiz completion
 */

import type { Module, QuizAttempt } from '@/types/database'
import { supabase } from '@/lib/supabase/client'

export interface ModuleAccessResult {
  canAccess: boolean
  reason?: 'not_premium' | 'quiz_not_passed' | 'no_quiz_required' | 'module_1'
  previousModuleId?: string
  requiredScore?: number
}

/**
 * Check if a user can access a specific module
 *
 * Rules:
 * - Module 1 is always accessible for all courses
 * - For free courses: Only module 1 accessible (others require premium)
 * - For premium courses: Must pass previous module's quiz (if required)
 *
 * @param userId - User ID (null for anonymous users)
 * @param moduleId - Module to check access for
 * @param courseIsFree - Whether the course is free
 * @returns ModuleAccessResult with access status and reason
 */
export async function checkModuleAccess(
  userId: string | null,
  moduleId: string,
  courseIsFree: boolean
): Promise<ModuleAccessResult> {

  // Get module info
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id, order_index, course_id, requires_quiz')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) {
    return { canAccess: false, reason: undefined }
  }

  const moduleData = module as any

  // Module 1 is always accessible
  if (moduleData.order_index === 1) {
    return { canAccess: true, reason: 'module_1' }
  }

  // For free courses, only module 1 is accessible
  if (courseIsFree) {
    return {
      canAccess: false,
      reason: 'not_premium',
    }
  }

  // For anonymous users on premium courses
  if (!userId) {
    return {
      canAccess: false,
      reason: 'not_premium',
    }
  }

  // For premium courses, check if previous module's quiz was passed
  const { data: previousModule } = await supabase
    .from('modules')
    .select('id, requires_quiz')
    .eq('course_id', moduleData.course_id)
    .eq('order_index', moduleData.order_index - 1)
    .single()

  if (!previousModule) {
    return { canAccess: false }
  }

  const prevModuleData = previousModule as any

  // If previous module doesn't require quiz, module is accessible
  if (!prevModuleData.requires_quiz) {
    return {
      canAccess: true,
      reason: 'no_quiz_required',
      previousModuleId: prevModuleData.id,
    }
  }

  // Check if user passed previous module's quiz
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('id, score, passed')
    .eq('user_id', userId)
    .eq('module_id', prevModuleData.id)
    .eq('passed', true)
    .order('completed_at', { ascending: false })
    .limit(1)

  const attemptsData = attempts as any[]
  const passedPreviousQuiz = attemptsData && attemptsData.length > 0

  if (passedPreviousQuiz) {
    return {
      canAccess: true,
      previousModuleId: prevModuleData.id,
    }
  }

  return {
    canAccess: false,
    reason: 'quiz_not_passed',
    previousModuleId: prevModuleData.id,
    requiredScore: 70,
  }
}

/**
 * Check module access for client-side (localStorage fallback)
 *
 * This is a simplified version for client-side use when user is not authenticated.
 * Uses localStorage to track quiz completion.
 */
export function checkModuleAccessClient(
  moduleOrderIndex: number,
  courseIsFree: boolean,
  previousModuleQuizPassed?: boolean
): ModuleAccessResult {
  // Module 1 is always accessible
  if (moduleOrderIndex === 1) {
    return { canAccess: true, reason: 'module_1' }
  }

  // For free courses, only module 1 is accessible
  if (courseIsFree) {
    return {
      canAccess: false,
      reason: 'not_premium',
    }
  }

  // For premium courses, check if previous module quiz was passed
  if (previousModuleQuizPassed) {
    return { canAccess: true }
  }

  return {
    canAccess: false,
    reason: 'quiz_not_passed',
    requiredScore: 70,
  }
}

/**
 * Get all accessible modules for a course
 *
 * @param userId - User ID (null for anonymous)
 * @param courseId - Course ID
 * @param courseIsFree - Whether course is free
 * @returns Array of module IDs that are accessible
 */
export async function getAccessibleModules(
  userId: string | null,
  courseId: string,
  courseIsFree: boolean
): Promise<string[]> {

  // Get all modules for the course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, order_index, requires_quiz')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (!modules || modules.length === 0) {
    return []
  }

  const modulesData = modules as any[]
  const accessibleModuleIds: string[] = []

  // Check each module
  for (const module of modulesData) {
    const access = await checkModuleAccess(userId, module.id, courseIsFree)
    if (access.canAccess) {
      accessibleModuleIds.push(module.id)
    }
  }

  return accessibleModuleIds
}

/**
 * Get the next locked module for a course
 *
 * Used to show users what they need to do to unlock the next module
 */
export async function getNextLockedModule(
  userId: string | null,
  courseId: string,
  courseIsFree: boolean
): Promise<{
  module: Module | null
  reason: string
}> {

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (!modules || modules.length === 0) {
    return { module: null, reason: 'No modules found' }
  }

  const modulesData = modules as any[]

  // Find first locked module
  for (const module of modulesData) {
    const access = await checkModuleAccess(userId, module.id, courseIsFree)
    if (!access.canAccess) {
      let reason = 'Module is locked'

      if (access.reason === 'not_premium') {
        reason = 'Upgrade to premium to access this module'
      } else if (access.reason === 'quiz_not_passed') {
        reason = 'Complete the previous module quiz to unlock'
      }

      return { module, reason }
    }
  }

  return { module: null, reason: 'All modules unlocked' }
}
