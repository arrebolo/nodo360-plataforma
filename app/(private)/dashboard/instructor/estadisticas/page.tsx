import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { requireInstructorLike } from '@/lib/auth/requireInstructor'
import PageHeader from '@/components/ui/PageHeader'
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
} from 'lucide-react'

export const metadata = {
  title: 'Estadísticas de Alumnos | Nodo360',
  description: 'Métricas y estadísticas de tus alumnos',
}

export default async function EstadisticasAlumnosPage() {
  const { userId } = await requireInstructorLike()
  const supabase = await createClient()

  // Obtener cursos del instructor
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url')
    .eq('instructor_id', userId)

  const courseIds = courses?.map(c => c.id) || []

  // Si no hay cursos, mostrar estado vacío
  if (courseIds.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <Link
            href="/dashboard/instructor"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel instructor
          </Link>

          <PageHeader
            icon={BarChart3}
            title="Estadísticas de Alumnos"
            subtitle="Métricas de tus cursos"
          />

          <div className="bg-dark-surface border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No tienes cursos aún
            </h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Crea tu primer curso para comenzar a ver estadísticas de alumnos.
            </p>
            <Link
              href="/dashboard/instructor/cursos/nuevo"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-90 transition"
            >
              Crear curso
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Obtener todas las inscripciones
  const { data: allEnrollments } = await supabase
    .from('course_enrollments')
    .select('user_id, course_id, progress_percentage, enrolled_at, last_accessed_at, completed_at')
    .in('course_id', courseIds)

  // Calcular métricas
  const uniqueStudentIds = new Set((allEnrollments || []).map(e => e.user_id))
  const totalStudents = uniqueStudentIds.size

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const activeThisMonth = new Set(
    (allEnrollments || [])
      .filter(e => e.last_accessed_at && new Date(e.last_accessed_at) >= startOfMonth)
      .map(e => e.user_id)
  ).size

  const completedCount = (allEnrollments || []).filter(e => e.completed_at).length
  const totalEnrollments = (allEnrollments || []).length
  const averageCompletion = totalEnrollments > 0
    ? Math.round((completedCount / totalEnrollments) * 100)
    : 0

  // Certificados emitidos
  const { count: certificatesIssued } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .in('course_id', courseIds)
    .eq('type', 'course')

  // Estadísticas por curso
  const courseStats = (courses || []).map(course => {
    const courseEnrollments = (allEnrollments || []).filter(e => e.course_id === course.id)
    const completed = courseEnrollments.filter(e => e.completed_at).length
    const inProgress = courseEnrollments.filter(e => !e.completed_at).length
    const total = courseEnrollments.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      ...course,
      totalEnrolled: total,
      inProgress,
      completed,
      completionRate,
    }
  }).sort((a, b) => b.totalEnrolled - a.totalEnrolled)

  // Alumnos recientes
  const { data: recentEnrollments } = await supabase
    .from('course_enrollments')
    .select('id, user_id, course_id, progress_percentage, enrolled_at, last_accessed_at, completed_at')
    .in('course_id', courseIds)
    .order('enrolled_at', { ascending: false })
    .limit(10)

  const recentUserIds = [...new Set((recentEnrollments || []).map(e => e.user_id))]
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', recentUserIds.length > 0 ? recentUserIds : ['00000000-0000-0000-0000-000000000000'])

  const userMap = new Map((users || []).map(u => [u.id, u]))
  const courseMap = new Map((courses || []).map(c => [c.id, c]))

  const recentStudents = (recentEnrollments || []).map(e => ({
    id: e.id,
    user: userMap.get(e.user_id),
    course: courseMap.get(e.course_id),
    progress: e.progress_percentage || 0,
    enrolledAt: e.enrolled_at,
    lastAccessed: e.last_accessed_at,
    completedAt: e.completed_at,
  }))

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

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
    return formatDate(dateString)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/instructor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel instructor
        </Link>

        {/* Header */}
        <PageHeader
          icon={BarChart3}
          title="Estadísticas de Alumnos"
          subtitle={`${totalStudents} alumno${totalStudents !== 1 ? 's' : ''} en ${courses?.length || 0} curso${(courses?.length || 0) !== 1 ? 's' : ''}`}
        />

        {/* Métricas principales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-white/60">Total alumnos</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalStudents.toLocaleString()}</p>
          </div>

          <div className="bg-dark-surface border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-white/60">Activos este mes</span>
            </div>
            <p className="text-3xl font-bold text-white">{activeThisMonth.toLocaleString()}</p>
          </div>

          <div className="bg-dark-surface border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-white/60">Tasa completación</span>
            </div>
            <p className="text-3xl font-bold text-white">{averageCompletion}%</p>
          </div>

          <div className="bg-dark-surface border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-sm text-white/60">Certificados</span>
            </div>
            <p className="text-3xl font-bold text-white">{(certificatesIssued || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Tabla de cursos */}
          <section className="bg-dark-surface border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-lg font-semibold text-white">Alumnos por curso</h2>
            </div>

            {courseStats.length === 0 ? (
              <p className="text-white/50 text-center py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {courseStats.map(course => (
                  <Link
                    key={course.id}
                    href={`/dashboard/instructor/cursos/${course.id}`}
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
                        <span>{course.totalEnrolled} inscritos</span>
                        <span>{course.inProgress} en progreso</span>
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

          {/* Lista de alumnos recientes */}
          <section className="bg-dark-surface border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Inscripciones recientes</h2>
            </div>

            {recentStudents.length === 0 ? (
              <p className="text-white/50 text-center py-8">No hay inscripciones recientes</p>
            ) : (
              <div className="space-y-3">
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
    </div>
  )
}
