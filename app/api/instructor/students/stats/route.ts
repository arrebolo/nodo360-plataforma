import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/instructor/students/stats
 * Obtiene estadísticas de alumnos para el instructor actual
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es instructor/mentor/admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['instructor', 'mentor', 'admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener cursos del instructor
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url')
      .eq('instructor_id', user.id)

    if (!courses || courses.length === 0) {
      return NextResponse.json({
        summary: {
          totalStudents: 0,
          activeThisMonth: 0,
          averageCompletion: 0,
          certificatesIssued: 0,
        },
        courseStats: [],
        recentStudents: [],
      })
    }

    const courseIds = courses.map(c => c.id)

    // 1. Total de alumnos inscritos (únicos)
    const { data: allEnrollments } = await supabase
      .from('course_enrollments')
      .select('user_id, course_id, progress_percentage, enrolled_at, last_accessed_at, completed_at')
      .in('course_id', courseIds)

    const uniqueStudentIds = new Set((allEnrollments || []).map(e => e.user_id))
    const totalStudents = uniqueStudentIds.size

    // 2. Alumnos activos este mes
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const activeThisMonth = new Set(
      (allEnrollments || [])
        .filter(e => e.last_accessed_at && new Date(e.last_accessed_at) >= startOfMonth)
        .map(e => e.user_id)
    ).size

    // 3. Tasa de completación promedio
    const completedCount = (allEnrollments || []).filter(e => e.completed_at).length
    const totalEnrollments = (allEnrollments || []).length
    const averageCompletion = totalEnrollments > 0
      ? Math.round((completedCount / totalEnrollments) * 100)
      : 0

    // 4. Certificados emitidos
    const { count: certificatesIssued } = await supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .in('course_id', courseIds)
      .eq('type', 'course')

    // 5. Estadísticas por curso
    const courseStats = courses.map(course => {
      const courseEnrollments = (allEnrollments || []).filter(e => e.course_id === course.id)
      const completed = courseEnrollments.filter(e => e.completed_at).length
      const inProgress = courseEnrollments.filter(e => !e.completed_at).length
      const total = courseEnrollments.length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        thumbnail: course.thumbnail_url,
        totalEnrolled: total,
        inProgress,
        completed,
        completionRate,
      }
    }).sort((a, b) => b.totalEnrolled - a.totalEnrolled)

    // 6. Alumnos recientes (últimas 20 inscripciones)
    const { data: recentEnrollments } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        progress_percentage,
        enrolled_at,
        last_accessed_at,
        completed_at
      `)
      .in('course_id', courseIds)
      .order('enrolled_at', { ascending: false })
      .limit(20)

    // Obtener nombres de usuarios
    const recentUserIds = [...new Set((recentEnrollments || []).map(e => e.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', recentUserIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))
    const courseMap = new Map(courses.map(c => [c.id, c]))

    const recentStudents = (recentEnrollments || []).map(e => {
      const userData = userMap.get(e.user_id)
      const courseData = courseMap.get(e.course_id)
      return {
        id: e.id,
        userId: e.user_id,
        userName: userData?.full_name || 'Usuario',
        userAvatar: userData?.avatar_url || null,
        courseId: e.course_id,
        courseTitle: courseData?.title || 'Curso',
        courseSlug: courseData?.slug || '',
        progress: e.progress_percentage || 0,
        enrolledAt: e.enrolled_at,
        lastAccessed: e.last_accessed_at,
        completedAt: e.completed_at,
      }
    })

    return NextResponse.json({
      summary: {
        totalStudents,
        activeThisMonth,
        averageCompletion,
        certificatesIssued: certificatesIssued || 0,
      },
      courseStats,
      recentStudents,
    })
  } catch (error) {
    console.error('[GET /api/instructor/students/stats] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
