'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  extractCourseFromFormData,
  validateCourseData,
  type CourseFormData,
} from './course-utils'

export interface ActionResult {
  success: boolean
  error?: string
  courseId?: string
}

/**
 * Create a new course
 */
export async function createCourse(
  formData: FormData,
  options: {
    instructorId: string
    redirectTo?: string
    revalidatePaths?: string[]
  }
): Promise<ActionResult> {
  const supabase = await createClient()
  const data = extractCourseFromFormData(formData)

  // Validate
  const validation = validateCourseData(data)
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0]
    return { success: false, error: firstError }
  }

  console.log('🔍 [Create Course] Creating course:', { title: data.title, slug: data.slug })

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', data.slug)
    .single()

  if (existing) {
    return { success: false, error: 'Ya existe un curso con este slug' }
  }

  // Insert course
  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      ...data,
      instructor_id: options.instructorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('❌ [Create Course] Error:', error)
    return { success: false, error: 'Error al crear el curso: ' + error.message }
  }

  console.log('✅ [Create Course] Course created:', course.id)

  // Assign to learning paths if specified
  const learningPathIdsRaw = formData.get('learning_path_ids') as string
  if (learningPathIdsRaw) {
    try {
      const learningPathIds: string[] = JSON.parse(learningPathIdsRaw)
      if (learningPathIds.length > 0) {
        const pathAssignments = learningPathIds.map((pathId, index) => ({
          course_id: course.id,
          learning_path_id: pathId,
          position: index,
          is_required: true,
        }))

        const { error: pathError } = await supabase
          .from('learning_path_courses')
          .insert(pathAssignments)

        if (pathError) {
          console.error('⚠️ [Create Course] Error assigning paths:', pathError)
          // Don't fail the course creation, just log the error
        } else {
          console.log('✅ [Create Course] Assigned to', learningPathIds.length, 'learning paths')
        }
      }
    } catch (e) {
      console.error('⚠️ [Create Course] Error parsing learning_path_ids:', e)
    }
  }

  // Revalidate paths
  const paths = options.revalidatePaths || ['/admin/cursos', '/dashboard/instructor/cursos']
  paths.forEach(path => revalidatePath(path))

  // Redirect if specified
  if (options.redirectTo) {
    redirect(options.redirectTo.replace('{id}', course.id))
  }

  return { success: true, courseId: course.id }
}

/**
 * Update an existing course
 */
export async function updateCourse(
  courseId: string,
  formData: FormData,
  options: {
    redirectTo?: string
    revalidatePaths?: string[]
  } = {}
): Promise<ActionResult> {
  const supabase = await createClient()
  const data = extractCourseFromFormData(formData)

  // Validate
  const validation = validateCourseData(data)
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0]
    return { success: false, error: firstError }
  }

  console.log('🔍 [Update Course] Updating course:', courseId)

  // Check slug uniqueness (excluding current course)
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', data.slug)
    .neq('id', courseId)
    .single()

  if (existing) {
    return { success: false, error: 'Ya existe otro curso con este slug' }
  }

  // Update course
  const { error } = await supabase
    .from('courses')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)

  if (error) {
    console.error('❌ [Update Course] Error:', error)
    return { success: false, error: 'Error al actualizar el curso: ' + error.message }
  }

  console.log('✅ [Update Course] Course updated:', courseId)

  // Revalidate paths
  const paths = options.revalidatePaths || ['/admin/cursos', '/dashboard/instructor/cursos']
  paths.forEach(path => revalidatePath(path))

  // Redirect if specified
  if (options.redirectTo) {
    redirect(options.redirectTo.replace('{id}', courseId))
  }

  return { success: true, courseId }
}

/**
 * Delete a course
 */
export async function deleteCourse(
  courseId: string,
  options: {
    redirectTo?: string
    revalidatePaths?: string[]
  } = {}
): Promise<ActionResult> {
  const supabase = await createClient()

  console.log('🗑️ [Delete Course] Deleting course:', courseId)

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) {
    console.error('❌ [Delete Course] Error:', error)
    return { success: false, error: 'Error al eliminar el curso: ' + error.message }
  }

  console.log('✅ [Delete Course] Course deleted:', courseId)

  // Revalidate paths
  const paths = options.revalidatePaths || ['/admin/cursos', '/dashboard/instructor/cursos']
  paths.forEach(path => revalidatePath(path))

  // Redirect if specified
  if (options.redirectTo) {
    redirect(options.redirectTo)
  }

  return { success: true }
}
