import { createClient } from '@/lib/supabase/server'
import {
  Star,
  Users,
  PlayCircle,
  Target,
  Clock,
  StickyNote,
  Eye,
  AlertTriangle,
  CalendarCheck,
  Calendar,
  BookOpen,
  Timer,
} from 'lucide-react'

export const metadata = {
  title: 'Métricas | Admin Nodo360',
  description: 'Métricas principales de la plataforma',
}

export default async function AdminMetricasPage() {
  // NOTA: requireAdmin() ya se ejecuta en app/(private)/admin/layout.tsx
  const supabase = await createClient()

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
        if (diffDays <= 30) {
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

  const { data: oldEnrollments } = await supabase
    .from('course_enrollments')
    .select('id')
    .lt('enrolled_at', thirtyDaysAgo.toISOString())
    .gt('progress_percentage', 0)
    .lt('progress_percentage', 80)
    .is('completed_at', null)

  const m7_abandonedCourses = oldEnrollments?.length || 0

  // =====================================================
  // M8 & M9: Retención 7 y 30 días
  // =====================================================
  const { data: enrollmentDates } = await supabase
    .from('course_enrollments')
    .select('user_id, enrolled_at, last_accessed_at')

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

  let usersRetained7Days = 0
  let usersWithEnoughData7 = 0
  let usersRetained30Days = 0
  let usersWithEnoughData30 = 0

  for (const data of Object.values(userFirstEnrollment)) {
    if (data.first <= sevenDaysAgo) {
      usersWithEnoughData7++
      if (data.lastAccess) {
        const daysBetween = (data.lastAccess.getTime() - data.first.getTime()) / (1000 * 60 * 60 * 24)
        if (daysBetween >= 7) usersRetained7Days++
      }
    }
    if (data.first <= thirtyDaysAgo) {
      usersWithEnoughData30++
      if (data.lastAccess) {
        const daysBetween = (data.lastAccess.getTime() - data.first.getTime()) / (1000 * 60 * 60 * 24)
        if (daysBetween >= 30) usersRetained30Days++
      }
    }
  }

  const m8_retention7Days = usersWithEnoughData7 > 0
    ? Math.round((usersRetained7Days / usersWithEnoughData7) * 100)
    : 0

  const m9_retention30Days = usersWithEnoughData30 > 0
    ? Math.round((usersRetained30Days / usersWithEnoughData30) * 100)
    : 0

  // =====================================================
  // M10: Cursos por status
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
  // M11: Tiempo medio de aprobación
  // =====================================================
  const { data: reviewHistory } = await supabase
    .from('course_reviews')
    .select('course_id, created_at, decision')
    .eq('decision', 'approved')

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
          if (days >= 0 && days <= 365) {
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

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Métricas de la Plataforma</h1>
        <p className="text-white/60">12 KPIs principales para monitorear el rendimiento</p>
      </div>

      {/* ===== SECCIÓN 1: NORTH STAR ===== */}
      <section>
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
          North Star Metric
        </h2>
        <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/5 border-2 border-amber-500/50 rounded-2xl p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/30 flex items-center justify-center">
              <Star className="w-8 h-8 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-5xl font-bold text-white">{m0_northStar}%</p>
              <p className="text-lg text-amber-200/80 mt-1">
                Usuarios que completan ≥80% de un curso
              </p>
              <p className="text-sm text-white/50 mt-2">
                {usersCompleting80.size} de {totalUsersWithEnrollments} usuarios inscritos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN 2: MÉTRICAS PRIMARIAS ===== */}
      <section>
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
          Métricas Primarias
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* M1 */}
          <div className="bg-white/5 border border-green-500/50 rounded-2xl p-5 hover:bg-green-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-green-400 font-medium">M1</span>
            </div>
            <p className="text-3xl font-bold text-white">{m1_usersEnrolled.toLocaleString()}</p>
            <p className="text-sm text-white/60 mt-1">Usuarios inscritos</p>
            <p className="text-xs text-white/40">En ≥1 curso</p>
          </div>

          {/* M2 */}
          <div className="bg-white/5 border border-green-500/50 rounded-2xl p-5 hover:bg-green-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-green-400 font-medium">M2</span>
            </div>
            <p className="text-3xl font-bold text-white">{m2_usersStarted.toLocaleString()}</p>
            <p className="text-sm text-white/60 mt-1">Usuarios que inician</p>
            <p className="text-xs text-white/40">≥1 lección completada</p>
          </div>

          {/* M3 */}
          <div className="bg-white/5 border border-green-500/50 rounded-2xl p-5 hover:bg-green-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-green-400 font-medium">M3</span>
            </div>
            <p className="text-3xl font-bold text-white">{m3_startToFinishRatio}%</p>
            <p className="text-sm text-white/60 mt-1">Ratio inicio → fin</p>
            <p className="text-xs text-white/40">De M2 a completar ≥80%</p>
          </div>

          {/* M4 */}
          <div className="bg-white/5 border border-green-500/50 rounded-2xl p-5 hover:bg-green-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-green-400 font-medium">M4</span>
            </div>
            <p className="text-3xl font-bold text-white">{m4_avgDaysBetweenLessons}</p>
            <p className="text-sm text-white/60 mt-1">Días entre lecciones</p>
            <p className="text-xs text-white/40">Promedio usuarios</p>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN 3: ENGAGEMENT ===== */}
      <section>
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
          Engagement
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* M5 */}
          <div className="bg-white/5 border border-yellow-500/50 rounded-2xl p-5 hover:bg-yellow-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-xs text-yellow-400 font-medium">M5</span>
            </div>
            <p className="text-3xl font-bold text-white">{m5_usersWithNotes.toLocaleString()}</p>
            <p className="text-sm text-white/60 mt-1">Usuarios con notas</p>
            <p className="text-xs text-white/40">≥1 nota creada</p>
          </div>

          {/* M6 */}
          <div className="bg-white/5 border border-yellow-500/50 rounded-2xl p-5 hover:bg-yellow-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-xs text-yellow-400 font-medium">M6</span>
            </div>
            <p className="text-3xl font-bold text-white">{m6_viewedVsCompleted}%</p>
            <p className="text-sm text-white/60 mt-1">Lecciones completadas</p>
            <p className="text-xs text-white/40">vs vistas (abiertas)</p>
          </div>

          {/* M7 */}
          <div className="bg-white/5 border border-yellow-500/50 rounded-2xl p-5 hover:bg-yellow-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-xs text-yellow-400 font-medium">M7</span>
            </div>
            <p className="text-3xl font-bold text-white">{m7_abandonedCourses.toLocaleString()}</p>
            <p className="text-sm text-white/60 mt-1">Cursos abandonados</p>
            <p className="text-xs text-white/40">&lt;80% después de 30 días</p>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN 4: RETENCIÓN ===== */}
      <section>
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
          Retención
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* M8 */}
          <div className="bg-white/5 border border-blue-500/50 rounded-2xl p-5 hover:bg-blue-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400 font-medium">M8</span>
            </div>
            <p className="text-3xl font-bold text-white">{m8_retention7Days}%</p>
            <p className="text-sm text-white/60 mt-1">Retención 7 días</p>
            <p className="text-xs text-white/40">Actividad ≥7d después de inscripción</p>
          </div>

          {/* M9 */}
          <div className="bg-white/5 border border-blue-500/50 rounded-2xl p-5 hover:bg-blue-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400 font-medium">M9</span>
            </div>
            <p className="text-3xl font-bold text-white">{m9_retention30Days}%</p>
            <p className="text-sm text-white/60 mt-1">Retención 30 días</p>
            <p className="text-xs text-white/40">Actividad a los 30 días</p>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN 5: SISTEMA ===== */}
      <section>
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
          Sistema
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* M10 */}
          <div className="bg-white/5 border border-gray-500/50 rounded-2xl p-5 hover:bg-gray-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400 font-medium">M10</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{publishedCourses || 0}</p>
              <span className="text-white/40">/</span>
              <p className="text-xl font-semibold text-orange-400">{pendingCourses || 0}</p>
              <span className="text-white/40">/</span>
              <p className="text-lg text-gray-400">{draftCourses || 0}</p>
            </div>
            <p className="text-sm text-white/60 mt-1">Cursos por status</p>
            <p className="text-xs text-white/40">Publicados / Pendientes / Borradores</p>
          </div>

          {/* M11 */}
          <div className="bg-white/5 border border-gray-500/50 rounded-2xl p-5 hover:bg-gray-500/5 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <Timer className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400 font-medium">M11</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {m11_avgApprovalDays > 0 ? `${m11_avgApprovalDays}d` : 'N/A'}
            </p>
            <p className="text-sm text-white/60 mt-1">Tiempo aprobación</p>
            <p className="text-xs text-white/40">Promedio días hasta publicar</p>
          </div>
        </div>
      </section>
    </div>
  )
}
