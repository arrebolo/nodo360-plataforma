import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * POST /api/admin/courses/[id]/refresh-counts
 *
 * Manually refreshes the total_modules and total_lessons counters for a course.
 * Useful if triggers fail or for fixing existing data.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id: courseId } = await params

    // Verify user is authenticated and is admin/instructor
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

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Get actual module count
    const { count: moduleCount, error: moduleError } = await admin
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    if (moduleError) {
      console.error('[refresh-counts] Error counting modules:', moduleError)
      return NextResponse.json({ error: moduleError.message }, { status: 500 })
    }

    // Get all module IDs for this course
    const { data: modules, error: modulesError } = await admin
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    if (modulesError) {
      console.error('[refresh-counts] Error fetching modules:', modulesError)
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    // Get actual lesson count across all modules
    let lessonCount = 0
    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)
      const { count, error: lessonError } = await admin
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .in('module_id', moduleIds)

      if (lessonError) {
        console.error('[refresh-counts] Error counting lessons:', lessonError)
        return NextResponse.json({ error: lessonError.message }, { status: 500 })
      }

      lessonCount = count || 0

      // Also update each module's total_lessons
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
      }
    }

    // Update course with correct counts
    const { data: course, error: updateError } = await admin
      .from('courses')
      .update({
        total_modules: moduleCount || 0,
        total_lessons: lessonCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select('id, title, total_modules, total_lessons')
      .single()

    if (updateError) {
      console.error('[refresh-counts] Error updating course:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`[refresh-counts] Updated course ${courseId}: ${moduleCount} modules, ${lessonCount} lessons`)

    return NextResponse.json({
      success: true,
      course,
      counts: {
        total_modules: moduleCount || 0,
        total_lessons: lessonCount
      }
    })

  } catch (error) {
    console.error('[refresh-counts] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
