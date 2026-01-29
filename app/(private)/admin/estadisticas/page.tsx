import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  BarChart3,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'

export const metadata = {
  title: 'Estadísticas de Alumnos | Admin Nodo360',
  description: 'Métricas globales de alumnos de la plataforma',
}

export default async function AdminEstadisticasPage() {
  // NOTA: requireAdmin() ya se ejecuta en app/(private)/admin/layout.tsx
  const supabase = await createClient()

  // 1. Total de usuarios registrados
  const { count: totalUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })

  // 2. Usuarios activos este mes
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

  // Obtener todas las inscripciones
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
      ...course,
      instructorName: instructor?.full_name || 'Sin instructor',
      totalEnrolled: total,
      inProgress,
      completed,
      completionRate: courseCompletionRate,
    }
  }).sort((a, b) => b.totalEnrolled - a.totalEnrolled)

  // 8. Inscripciones recientes
  const { data: recentEnrollments } = await supabase
    .from('course_enrollments')
    .select('id, user_id, course_id, progress_percentage, enrolled_at, last_accessed_at, completed_at')
    .order('enrolled_at', { ascending: false })
    .limit(15)

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

  const recentStudents = (recentEnrollments || []).map(e => ({
    id: e.id,
    user: userMap.get(e.user_id),
    course: courseMap.get(e.course_id),
    progress: e.progress_percentage || 0,
    enrolledAt: e.enrolled_at,
    lastAccessed: e.last_accessed_at,
    completedAt: e.completed_at,
  }))

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Estadísticas de Alumnos</h1>
            <p className="text-white/60">
              Métricas globales de la plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{(totalUsers || 0).toLocaleString()}</p>
          <span className="text-sm text-white/60">Total usuarios</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{activeThisMonth.toLocaleString()}</p>
          <span className="text-sm text-white/60">Activos este mes</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{(totalEnrollments || 0).toLocaleString()}</p>
          <span className="text-sm text-white/60">Inscripciones</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{(completedCourses || 0).toLocaleString()}</p>
          <span className="text-sm text-white/60">Completados</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{completionRate}%</p>
          <span className="text-sm text-white/60">Tasa completación</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{(certificatesIssued || 0).toLocaleString()}</p>
          <span className="text-sm text-white/60">Certificados</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Tabla de cursos */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-lg font-semibold text-white">Alumnos por curso</h2>
          </div>

          {courseStats.length === 0 ? (
            <p className="text-white/50 text-center py-8">No hay cursos publicados</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {courseStats.map(course => (
                <Link
                  key={course.id}
                  href={`/admin/cursos/${course.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-10 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt=""
                        width={64}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{course.title}</p>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span>{course.instructorName}</span>
                      <span>|</span>
                      <span>{course.totalEnrolled} inscritos</span>
                      <span className="text-green-400">{course.completed} completados</span>
                    </div>
                  </div>

                  {/* Completion rate */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-white">{course.completionRate}%</p>
                    <p className="text-xs text-white/50">completación</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Lista de inscripciones recientes */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Inscripciones recientes</h2>
          </div>

          {recentStudents.length === 0 ? (
            <p className="text-white/50 text-center py-8">No hay inscripciones recientes</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recentStudents.map(student => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  {/* Avatar */}
                  {student.user?.avatar_url ? (
                    <Image
                      src={student.user.avatar_url}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-light/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-light font-medium">
                        {student.user?.full_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {student.user?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {student.course?.title || 'Curso'}
                    </p>
                  </div>

                  {/* Progress & Date */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {student.completedAt ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                          Completado
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-white">{student.progress}%</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      {formatRelativeDate(student.enrolledAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
