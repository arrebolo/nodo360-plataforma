import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/metrics
 * Calcula las 12 métricas principales del admin dashboard
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // =====================================================
    // M0: NORTH STAR - % usuarios que completan ≥80%
    // =====================================================
    const { data: allEnrollments } = await supabase
      .from('course_enrollments')
      .select('user_id, progress_percentage, completed_at')

    const usersWithEnrollments = new Set((allEnrollments || []).map(e => e.user_id))
    const totalUsersWithEnrollments = usersWithEnrollments.size

    const usersCompleting80 = new Set(
      (allEnrollments || [])
        .filter(e => e.progress_percentage >= 80 || e.completed_at)
        .map(e => e.user_id)
    )

    const m0_northStar = totalUsersWithEnrollments > 0
      ? Math.round((usersCompleting80.size / totalUsersWithEnrollments) * 100)
      : 0

    // =====================================================
    // M1: Usuarios inscritos en ≥1 curso
    // =====================================================
    const m1_usersEnrolled = totalUsersWithEnrollments

    // =====================================================
    // M2: Usuarios que inician curso (≥1 lección completada)
    // =====================================================
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('user_id')
      .eq('is_completed', true)

    const usersWithCompletedLesson = new Set((progressData || []).map(p => p.user_id))
    const m2_usersStarted = usersWithCompletedLesson.size

    // =====================================================
    // M3: Ratio inicio → finalización
    // =====================================================
    const m3_startToFinishRatio = m2_usersStarted > 0
      ? Math.round((usersCompleting80.size / m2_usersStarted) * 100)
      : 0

    // =====================================================
    // M4: Tiempo medio entre lecciones (días)
    // =====================================================
    const { data: lessonTimes } = await supabase
      .from('user_progress')
      .select('user_id, updated_at')
      .eq('is_completed', true)
      .order('user_id')
      .order('updated_at')

    let totalDaysBetweenLessons = 0
    let countIntervals = 0

    if (lessonTimes && lessonTimes.length > 1) {
      const userLessons: Record<string, Date[]> = {}
      for (const lt of lessonTimes) {
        if (!userLessons[lt.user_id]) userLessons[lt.user_id] = []
        userLessons[lt.user_id].push(new Date(lt.updated_at))
      }

      for (const times of Object.values(userLessons)) {
        times.sort((a, b) => a.getTime() - b.getTime())
        for (let i = 1; i < times.length; i++) {
          const diffDays = (times[i].getTime() - times[i - 1].getTime()) / (1000 * 60 * 60 * 24)
          if (diffDays <= 30) { // Ignore gaps > 30 days
            totalDaysBetweenLessons += diffDays
            countIntervals++
          }
        }
      }
    }

    const m4_avgDaysBetweenLessons = countIntervals > 0
      ? Math.round((totalDaysBetweenLessons / countIntervals) * 10) / 10
      : 0

    // =====================================================
    // M5: Usuarios con ≥1 nota
    // =====================================================
    const { data: notesData } = await supabase
      .from('user_lesson_notes')
      .select('user_id')

    const usersWithNotes = new Set((notesData || []).map(n => n.user_id))
    const m5_usersWithNotes = usersWithNotes.size

    // =====================================================
    // M6: Ratio lecciones vistas vs completadas
    // =====================================================
    const { count: totalProgressRecords } = await supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })

    const { count: completedLessons } = await supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('is_completed', true)

    const m6_viewedVsCompleted = totalProgressRecords && totalProgressRecords > 0
      ? Math.round(((completedLessons || 0) / totalProgressRecords) * 100)
      : 0

    // =====================================================
    // M7: Cursos iniciados pero no terminados (>30 días, <80%)
    // =====================================================
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const abandonedCourses = (allEnrollments || []).filter(e => {
      const enrolledDate = new Date(e.progress_percentage > 0 ? e.completed_at || Date.now() : Date.now())
      // Has started (progress > 0) but not completed (<80%) and enrolled > 30 days ago
      return e.progress_percentage > 0 &&
             e.progress_percentage < 80 &&
             !e.completed_at &&
             new Date(e.progress_percentage > 0 ? e.completed_at || Date.now() : Date.now())
    })

    const { data: oldEnrollments } = await supabase
      .from('course_enrollments')
      .select('id, progress_percentage, completed_at, enrolled_at')
      .lt('enrolled_at', thirtyDaysAgo.toISOString())
      .gt('progress_percentage', 0)
      .lt('progress_percentage', 80)
      .is('completed_at', null)

    const m7_abandonedCourses = oldEnrollments?.length || 0

    // =====================================================
    // M8: Retención 7 días
    // =====================================================
    const { data: enrollmentDates } = await supabase
      .from('course_enrollments')
      .select('user_id, enrolled_at, last_accessed_at')

    let usersRetained7Days = 0
    let usersWithEnoughData7 = 0

    const userFirstEnrollment: Record<string, { first: Date; lastAccess: Date | null }> = {}
    for (const e of enrollmentDates || []) {
      const enrolled = new Date(e.enrolled_at)
      const lastAccess = e.last_accessed_at ? new Date(e.last_accessed_at) : null
      const existing = userFirstEnrollment[e.user_id]

      if (!existing || enrolled < existing.first) {
        userFirstEnrollment[e.user_id] = { first: enrolled, lastAccess }
      } else if (lastAccess && (!existing.lastAccess || lastAccess > existing.lastAccess)) {
        userFirstEnrollment[e.user_id].lastAccess = lastAccess
      }
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    for (const [userId, data] of Object.entries(userFirstEnrollment)) {
      // Only count users who enrolled at least 7 days ago
      if (data.first <= sevenDaysAgo) {
        usersWithEnoughData7++
        if (data.lastAccess) {
          const daysBetween = (data.lastAccess.getTime() - data.first.getTime()) / (1000 * 60 * 60 * 24)
          if (daysBetween >= 7) {
            usersRetained7Days++
          }
        }
      }
    }

    const m8_retention7Days = usersWithEnoughData7 > 0
      ? Math.round((usersRetained7Days / usersWithEnoughData7) * 100)
      : 0

    // =====================================================
    // M9: Retención 30 días
    // =====================================================
    let usersRetained30Days = 0
    let usersWithEnoughData30 = 0

    for (const [userId, data] of Object.entries(userFirstEnrollment)) {
      // Only count users who enrolled at least 30 days ago
      if (data.first <= thirtyDaysAgo) {
        usersWithEnoughData30++
        if (data.lastAccess) {
          const daysBetween = (data.lastAccess.getTime() - data.first.getTime()) / (1000 * 60 * 60 * 24)
          if (daysBetween >= 30) {
            usersRetained30Days++
          }
        }
      }
    }

    const m9_retention30Days = usersWithEnoughData30 > 0
      ? Math.round((usersRetained30Days / usersWithEnoughData30) * 100)
      : 0

    // =====================================================
    // M10: Cursos publicados vs en revisión
    // =====================================================
    const { count: publishedCourses } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    const { count: pendingCourses } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review')

    const { count: draftCourses } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')

    // =====================================================
    // M11: Tiempo medio de aprobación (días)
    // =====================================================
    const { data: reviewHistory } = await supabase
      .from('course_reviews')
      .select('course_id, created_at, decision')
      .eq('decision', 'approved')
      .order('created_at', { ascending: false })

    // Get course creation dates for approved courses
    let totalApprovalDays = 0
    let approvalCount = 0

    if (reviewHistory && reviewHistory.length > 0) {
      const approvedCourseIds = [...new Set(reviewHistory.map(r => r.course_id))]

      const { data: courseDates } = await supabase
        .from('courses')
        .select('id, created_at')
        .in('id', approvedCourseIds)

      if (courseDates) {
        const courseCreatedMap = new Map(courseDates.map(c => [c.id, new Date(c.created_at)]))

        for (const review of reviewHistory) {
          const createdAt = courseCreatedMap.get(review.course_id)
          if (createdAt) {
            const approvedAt = new Date(review.created_at)
            const days = (approvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
            if (days >= 0 && days <= 365) { // Ignore unrealistic values
              totalApprovalDays += days
              approvalCount++
            }
          }
        }
      }
    }

    const m11_avgApprovalDays = approvalCount > 0
      ? Math.round((totalApprovalDays / approvalCount) * 10) / 10
      : 0

    return NextResponse.json({
      northStar: {
        m0: m0_northStar,
        label: 'Usuarios que completan ≥80%',
      },
      primary: {
        m1: m1_usersEnrolled,
        m2: m2_usersStarted,
        m3: m3_startToFinishRatio,
        m4: m4_avgDaysBetweenLessons,
      },
      engagement: {
        m5: m5_usersWithNotes,
        m6: m6_viewedVsCompleted,
        m7: m7_abandonedCourses,
      },
      retention: {
        m8: m8_retention7Days,
        m9: m9_retention30Days,
      },
      system: {
        m10: {
          published: publishedCourses || 0,
          pending: pendingCourses || 0,
          draft: draftCourses || 0,
        },
        m11: m11_avgApprovalDays,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/metrics] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
