import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * POST /api/admin/courses/refresh-all-counts
 *
 * Refreshes total_modules and total_lessons counters for ALL courses.
 * Admin only. Useful for fixing all existing data at once.
 */
export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Verify user is authenticated and is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Get all courses
    const { data: courses, error: coursesError } = await admin
      .from('courses')
      .select('id, title')

    if (coursesError) {
      console.error('[refresh-all-counts] Error fetching courses:', coursesError)
      return NextResponse.json({ error: coursesError.message }, { status: 500 })
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const results: Array<{ id: string; title: string; modules: number; lessons: number }> = []

    for (const course of courses) {
      // Get module count
      const { count: moduleCount } = await admin
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)

      // Get all modules for this course
      const { data: modules } = await admin
        .from('modules')
        .select('id')
        .eq('course_id', course.id)

      let lessonCount = 0

      if (modules && modules.length > 0) {
        // Update each module's total_lessons
        for (const mod of modules) {
          const { count: modLessonCount } = await admin
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('module_id', mod.id)

          await admin
            .from('modules')
            .update({
              total_lessons: modLessonCount || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', mod.id)

          lessonCount += modLessonCount || 0
        }
      }

      // Update course
      await admin
        .from('courses')
        .update({
          total_modules: moduleCount || 0,
          total_lessons: lessonCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', course.id)

      results.push({
        id: course.id,
        title: course.title,
        modules: moduleCount || 0,
        lessons: lessonCount
      })
    }

    console.log(`[refresh-all-counts] Updated ${results.length} courses`)

    return NextResponse.json({
      success: true,
      updated: results.length,
      results
    })

  } catch (error) {
    console.error('[refresh-all-counts] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
