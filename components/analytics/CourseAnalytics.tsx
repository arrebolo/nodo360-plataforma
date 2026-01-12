'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  Activity,
  Target
} from 'lucide-react'

interface CourseAnalyticsProps {
  courseId: string
}

interface AnalyticsData {
  totalEnrollments: number
  activeStudents: number
  completionRate: number
  avgProgress: number
  totalLessonsCompleted: number
  avgTimePerLesson: number
  certificatesIssued: number
  quizPassRate: number
  enrollmentTrend: Array<{ date: string; count: number }>
  lessonCompletions: Array<{ lessonTitle: string; completions: number }>
  moduleProgress: Array<{ moduleTitle: string; avgProgress: number }>
}

export function CourseAnalytics({ courseId }: CourseAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      const supabase = createClient()

      try {
        // Calculate date range
        const now = new Date()
        let startDate: Date | null = null
        if (timeRange === '7d') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (timeRange === '30d') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else if (timeRange === '90d') {
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }

        // Fetch enrollments
        let enrollmentsQuery = (supabase as any)
          .from('enrollments')
          .select('id, created_at, user_id')
          .eq('course_id', courseId)

        if (startDate) {
          enrollmentsQuery = enrollmentsQuery.gte('created_at', startDate.toISOString())
        }

        const { data: enrollments, error: enrollError } = await enrollmentsQuery

        if (enrollError) throw enrollError

        // Fetch all enrollments for the course (for total count)
        const { count: totalEnrollments } = await (supabase as any)
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', courseId)

        // Fetch lesson progress
        const { data: progress, error: progressError } = await (supabase as any)
          .from('user_lesson_progress')
          .select(`
            id,
            user_id,
            lesson_id,
            completed,
            completed_at,
            lessons!inner(
              id,
              title,
              module_id,
              modules!inner(
                id,
                title,
                course_id
              )
            )
          `)
          .eq('lessons.modules.course_id', courseId)

        if (progressError) {
          console.warn('Progress fetch error (table may not exist):', progressError)
        }

        // Fetch certificates
        const { count: certificatesIssued } = await (supabase as any)
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', courseId)

        // Fetch quiz attempts
        const { data: quizAttempts } = await (supabase as any)
          .from('quiz_attempts')
          .select(`
            id,
            passed,
            quizzes!inner(
              id,
              lesson_id,
              lessons!inner(
                id,
                module_id,
                modules!inner(
                  course_id
                )
              )
            )
          `)
          .eq('quizzes.lessons.modules.course_id', courseId)

        // Calculate metrics
        const totalLessonsCompleted = progress?.filter((p: any) => p.completed).length || 0
        const uniqueActiveUsers = new Set(progress?.map((p: any) => p.user_id) || []).size

        // Calculate completion rate
        const { data: courseData } = await (supabase as any)
          .from('courses')
          .select('total_lessons')
          .eq('id', courseId)
          .single()

        const totalLessons = courseData?.total_lessons || 1
        const avgProgress = totalEnrollments && totalEnrollments > 0
          ? Math.round((totalLessonsCompleted / (totalEnrollments * totalLessons)) * 100)
          : 0

        // Count users who completed all lessons
        const userLessonCounts: Record<string, number> = {}
        progress?.forEach((p: any) => {
          if (p.completed) {
            userLessonCounts[p.user_id] = (userLessonCounts[p.user_id] || 0) + 1
          }
        })
        const completedUsers = Object.values(userLessonCounts).filter(count => count >= totalLessons).length
        const completionRate = totalEnrollments && totalEnrollments > 0
          ? Math.round((completedUsers / totalEnrollments) * 100)
          : 0

        // Quiz pass rate
        const totalAttempts = quizAttempts?.length || 0
        const passedAttempts = quizAttempts?.filter((a: any) => a.passed).length || 0
        const quizPassRate = totalAttempts > 0
          ? Math.round((passedAttempts / totalAttempts) * 100)
          : 0

        // Enrollment trend (last 7 points)
        const enrollmentTrend: Array<{ date: string; count: number }> = []
        const allEnrollments = enrollments || []
        const grouped = allEnrollments.reduce((acc: any, e: any) => {
          const date = new Date(e.created_at).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {})

        const dates = Object.keys(grouped).sort().slice(-7)
        dates.forEach(date => {
          enrollmentTrend.push({ date, count: grouped[date] })
        })

        // Lesson completions (top 5)
        const lessonCounts: Record<string, { title: string; count: number }> = {}
        progress?.forEach((p: any) => {
          if (p.completed && p.lessons) {
            const lid = p.lesson_id
            if (!lessonCounts[lid]) {
              lessonCounts[lid] = { title: p.lessons.title, count: 0 }
            }
            lessonCounts[lid].count++
          }
        })
        const lessonCompletions = Object.values(lessonCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(l => ({ lessonTitle: l.title, completions: l.count }))

        // Module progress
        const moduleData: Record<string, { title: string; completed: number; total: number }> = {}
        progress?.forEach((p: any) => {
          if (p.lessons?.modules) {
            const mid = p.lessons.module_id
            if (!moduleData[mid]) {
              moduleData[mid] = { title: p.lessons.modules.title, completed: 0, total: 0 }
            }
            moduleData[mid].total++
            if (p.completed) moduleData[mid].completed++
          }
        })
        const moduleProgress = Object.values(moduleData).map(m => ({
          moduleTitle: m.title,
          avgProgress: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0
        }))

        setData({
          totalEnrollments: totalEnrollments || 0,
          activeStudents: uniqueActiveUsers,
          completionRate,
          avgProgress,
          totalLessonsCompleted,
          avgTimePerLesson: 0, // Would need time tracking
          certificatesIssued: certificatesIssued || 0,
          quizPassRate,
          enrollmentTrend,
          lessonCompletions,
          moduleProgress
        })

      } catch (err) {
        console.error('[CourseAnalytics] Error:', err)
        setError('Error al cargar analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [courseId, timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-brand-light" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center p-8 text-white/60">
        {error || 'No hay datos disponibles'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Analytics del Curso</h2>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition ${
                timeRange === range
                  ? 'bg-brand-light text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {range === 'all' ? 'Todo' : range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          label="Inscritos"
          value={data.totalEnrollments}
          color="text-blue-400"
        />
        <KPICard
          icon={<Activity className="w-5 h-5" />}
          label="Activos"
          value={data.activeStudents}
          color="text-green-400"
        />
        <KPICard
          icon={<Target className="w-5 h-5" />}
          label="Tasa Completado"
          value={`${data.completionRate}%`}
          color="text-purple-400"
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Progreso Prom."
          value={`${data.avgProgress}%`}
          color="text-brand-light"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<BookOpen className="w-5 h-5" />}
          label="Lecciones Completadas"
          value={data.totalLessonsCompleted}
          color="text-cyan-400"
          small
        />
        <KPICard
          icon={<Award className="w-5 h-5" />}
          label="Certificados"
          value={data.certificatesIssued}
          color="text-yellow-400"
          small
        />
        <KPICard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Quiz Pass Rate"
          value={`${data.quizPassRate}%`}
          color="text-emerald-400"
          small
        />
        <KPICard
          icon={<Clock className="w-5 h-5" />}
          label="Tiempo Prom/Leccion"
          value={data.avgTimePerLesson > 0 ? `${data.avgTimePerLesson}m` : 'N/A'}
          color="text-rose-400"
          small
        />
      </div>

      {/* Charts section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Enrollment trend */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4">Inscripciones</h3>
          {data.enrollmentTrend.length > 0 ? (
            <div className="h-40 flex items-end gap-2">
              {data.enrollmentTrend.map((point, i) => {
                const max = Math.max(...data.enrollmentTrend.map(p => p.count))
                const height = max > 0 ? (point.count / max) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-white/60">{point.count}</span>
                    <div
                      className="w-full bg-brand-light/60 rounded-t"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[10px] text-white/40">
                      {new Date(point.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-8">Sin datos</p>
          )}
        </div>

        {/* Module progress */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4">Progreso por Modulo</h3>
          {data.moduleProgress.length > 0 ? (
            <div className="space-y-3">
              {data.moduleProgress.map((mod, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white/70 truncate">{mod.moduleTitle}</span>
                    <span className="text-white/50">{mod.avgProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-light transition-all"
                      style={{ width: `${mod.avgProgress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-8">Sin datos</p>
          )}
        </div>
      </div>

      {/* Top lessons */}
      {data.lessonCompletions.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4">Lecciones Mas Completadas</h3>
          <div className="space-y-2">
            {data.lessonCompletions.map((lesson, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-5">{i + 1}.</span>
                  <span className="text-sm text-white/80 truncate">{lesson.lessonTitle}</span>
                </div>
                <span className="text-sm text-brand-light font-medium">
                  {lesson.completions} completadas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  small?: boolean
}

function KPICard({ icon, label, value, color, small = false }: KPICardProps) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl ${small ? 'p-3' : 'p-4'}`}>
      <div className={`flex items-center gap-2 ${color} mb-2`}>
        {icon}
        <span className={`text-white/60 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
      </div>
      <p className={`font-bold text-white ${small ? 'text-xl' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  )
}
