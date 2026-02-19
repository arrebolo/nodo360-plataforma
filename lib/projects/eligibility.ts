/**
 * Project Eligibility
 * Server-side functions to check if a user can create projects
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ProjectEligibility } from '@/types/projects'

/**
 * Check if a user is eligible to create community projects.
 * Requirements:
 * 1. Not suspended
 * 2. Has active full_platform entitlement (premium)
 * 3. Has completed all beginner-level courses
 */
export async function checkProjectEligibility(userId: string): Promise<ProjectEligibility> {
  const supabase = createAdminClient() as any

  // 1. Check suspension status
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_suspended')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('[checkProjectEligibility] Error fetching user:', userError)
    return { eligible: false, reason: 'suspended' }
  }

  if (userData?.is_suspended) {
    return { eligible: false, reason: 'suspended' }
  }

  // 2. Check premium entitlement (full_platform)
  const now = new Date().toISOString()
  const { data: entitlement, error: entitlementError } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'full_platform')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)

  if (entitlementError) {
    console.error('[checkProjectEligibility] Error checking entitlement:', entitlementError)
    return { eligible: false, reason: 'not_premium' }
  }

  if (!entitlement || entitlement.length === 0) {
    return { eligible: false, reason: 'not_premium' }
  }

  // 3. Check beginner courses completion
  const { data: beginnerCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id')
    .eq('level', 'beginner')
    .eq('status', 'published')

  if (coursesError) {
    console.error('[checkProjectEligibility] Error fetching beginner courses:', coursesError)
    return { eligible: false, reason: 'courses_incomplete' }
  }

  const requiredCourses = beginnerCourses?.length || 0

  // If no beginner courses exist, user is eligible
  if (requiredCourses === 0) {
    return { eligible: true }
  }

  // Count completed beginner courses for this user
  const courseIds = beginnerCourses.map((c: { id: string }) => c.id)
  const { data: completedEnrollments, error: enrollmentsError } = await supabase
    .from('course_enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .in('course_id', courseIds)
    .not('completed_at', 'is', null)

  if (enrollmentsError) {
    console.error('[checkProjectEligibility] Error checking enrollments:', enrollmentsError)
    return { eligible: false, reason: 'courses_incomplete' }
  }

  const completedCourses = completedEnrollments?.length || 0

  if (completedCourses < requiredCourses) {
    return {
      eligible: false,
      reason: 'courses_incomplete',
      completedCourses,
      requiredCourses,
    }
  }

  return { eligible: true, completedCourses, requiredCourses }
}

/**
 * Quick check using the SQL function (for use in triggers/RLS).
 * Returns boolean only.
 */
export async function isEligibleForProjects(userId: string): Promise<boolean> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase.rpc('check_project_eligibility', {
    p_user_id: userId,
  })

  if (error) {
    console.error('[isEligibleForProjects] Error:', error)
    return false
  }

  return data === true
}
