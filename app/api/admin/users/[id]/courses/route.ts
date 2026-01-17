import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * GET /api/admin/users/[id]/courses
 * Obtiene los cursos en los que está inscrito el usuario con info de progreso y XP
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // 1. Verificar que es admin
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: me, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (roleError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    const { id: userId } = await params
    const admin = createAdminClient()

    // 2. Obtener cursos con info de progreso
    const { data: enrollments, error } = await admin
      .from('course_enrollments')
      .select(`
        course_id,
        progress_percentage,
        completed_at,
        enrolled_at,
        courses (
          id,
          title,
          slug
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('[Admin Courses] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Para cada curso, obtener XP ganado y lecciones completadas
    const coursesWithDetails = await Promise.all(
      (enrollments || []).map(async (enrollment) => {
        const courseData = enrollment.courses as { id: string; title: string; slug: string } | null

        // Obtener XP ganado en este curso
        const { data: xpData } = await admin
          .from('xp_events')
          .select('xp_earned')
          .eq('user_id', userId)
          .eq('course_id', enrollment.course_id)

        const totalXp = xpData?.reduce((sum, e) => sum + (e.xp_earned || 0), 0) || 0

        // Obtener módulos del curso
        const { data: modules } = await admin
          .from('modules')
          .select('id')
          .eq('course_id', enrollment.course_id)

        const moduleIds = modules?.map(m => m.id) || []

        // Obtener lecciones del curso
        let lessonIds: string[] = []
        let totalLessons = 0
        if (moduleIds.length > 0) {
          const { data: lessons } = await admin
            .from('lessons')
            .select('id')
            .in('module_id', moduleIds)

          lessonIds = lessons?.map(l => l.id) || []
          totalLessons = lessonIds.length
        }

        // Contar lecciones completadas
        let completedCount = 0
        if (lessonIds.length > 0) {
          const { count } = await admin
            .from('user_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_completed', true)
            .in('lesson_id', lessonIds)

          completedCount = count || 0
        }

        // Verificar si tiene certificado
        const { data: cert } = await admin
          .from('certificates')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', enrollment.course_id)
          .maybeSingle()

        return {
          courseId: enrollment.course_id,
          title: courseData?.title || 'Sin titulo',
          slug: courseData?.slug || '',
          progressPercentage: enrollment.progress_percentage || 0,
          completedAt: enrollment.completed_at,
          enrolledAt: enrollment.enrolled_at,
          xpEarned: totalXp,
          lessonsCompleted: completedCount,
          totalLessons,
          hasCertificate: !!cert,
        }
      })
    )

    return NextResponse.json({ courses: coursesWithDetails })

  } catch (error) {
    console.error('[Admin Courses] Exception:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
