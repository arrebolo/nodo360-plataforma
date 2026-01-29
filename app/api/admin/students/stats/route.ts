import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/students/stats
 * Obtiene estadísticas globales de alumnos para el admin
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

    // 1. Total de usuarios registrados
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    // 2. Usuarios activos este mes (que han accedido a algún curso)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: activeEnrollments } = await supabase
      .from('course_enrollments')
      .select('user_id')
      .gte('last_accessed_at', startOfMonth.toISOString())

    const activeThisMonth = new Set((activeEnrollments || []).map(e => e.user_id)).size

    // 3. Total de inscripciones
    const { count: totalEnrollments } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })

    // 4. Cursos completados
    const { count: completedCourses } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .not('completed_at', 'is', null)

    // 5. Certificados emitidos
    const { count: certificatesIssued } = await supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'course')

    // 6. Tasa de completación global
    const completionRate = totalEnrollments && totalEnrollments > 0
      ? Math.round(((completedCourses || 0) / totalEnrollments) * 100)
      : 0

    // 7. Estadísticas por curso (todos los cursos publicados)
    const { data: courses } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        slug,
        thumbnail_url,
        instructor_id,
        users!courses_instructor_id_fkey (
          full_name
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    const courseIds = courses?.map(c => c.id) || []

    // Obtener todas las inscripciones de cursos publicados
    let allEnrollments: any[] = []
    if (courseIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id, course_id, progress_percentage, enrolled_at, last_accessed_at, completed_at')
        .in('course_id', courseIds)

      allEnrollments = enrollments || []
    }

    // Calcular estadísticas por curso
    const courseStats = (courses || []).map(course => {
      const courseEnrollments = allEnrollments.filter(e => e.course_id === course.id)
      const completed = courseEnrollments.filter(e => e.completed_at).length
      const inProgress = courseEnrollments.filter(e => !e.completed_at).length
      const total = courseEnrollments.length
      const courseCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      const instructor = course.users as any

      return {
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        thumbnail: course.thumbnail_url,
        instructorName: instructor?.full_name || 'Sin instructor',
        totalEnrolled: total,
        inProgress,
        completed,
        completionRate: courseCompletionRate,
      }
    }).sort((a, b) => b.totalEnrolled - a.totalEnrolled)

    // 8. Inscripciones recientes (últimas 20)
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
      .order('enrolled_at', { ascending: false })
      .limit(20)

    // Obtener datos de usuarios y cursos para las inscripciones recientes
    const recentUserIds = [...new Set((recentEnrollments || []).map(e => e.user_id))]
    const recentCourseIds = [...new Set((recentEnrollments || []).map(e => e.course_id))]

    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', recentUserIds.length > 0 ? recentUserIds : ['00000000-0000-0000-0000-000000000000'])

    const { data: recentCourses } = await supabase
      .from('courses')
      .select('id, title, slug')
      .in('id', recentCourseIds.length > 0 ? recentCourseIds : ['00000000-0000-0000-0000-000000000000'])

    const userMap = new Map((users || []).map(u => [u.id, u]))
    const courseMap = new Map((recentCourses || []).map(c => [c.id, c]))

    const recentStudents = (recentEnrollments || []).map(e => {
      const userData = userMap.get(e.user_id)
      const courseData = courseMap.get(e.course_id)
      return {
        id: e.id,
        oderId: e.user_id,
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
        totalUsers: totalUsers || 0,
        activeThisMonth,
        totalEnrollments: totalEnrollments || 0,
        completedCourses: completedCourses || 0,
        certificatesIssued: certificatesIssued || 0,
        completionRate,
      },
      courseStats,
      recentStudents,
    })
  } catch (error) {
    console.error('[GET /api/admin/students/stats] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
