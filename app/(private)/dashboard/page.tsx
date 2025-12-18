// app/(private)/dashboard/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoleBasedDashboard } from '@/components/dashboard/RoleBasedDashboard'
import UserLevel from '@/components/gamification/UserLevel'
import UserGamificationPanel from '@/components/gamification/UserGamificationPanel'
import type { UserRole } from '@/types/roles'

// Mapeo de users.role (legacy) a UserRole (tipos/roles.ts)
function mapLegacyRole(dbRole: string): UserRole {
  switch (dbRole) {
    case 'admin': return 'admin'
    case 'mentor': return 'mentor'
    case 'instructor': return 'mentor' // instructor -> mentor para el dashboard
    case 'student':
    default: return 'user'
  }
}

// -----------------------
// Helper de rol de usuario (nuevo)
// -----------------------
async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('❌ [getUserRole] Error obteniendo rol de usuario:', error)
    return 'user' // valor por defecto seguro
  }

  return mapLegacyRole(data?.role || 'student')
}

// -----------------------
// Helpers de progreso ruta
// -----------------------
async function getActivePathProgress(userId: string) {
  console.log('🔍 [getActivePathProgress] Obteniendo progreso de ruta...')
  const supabase = await createClient()

  const { data: activePath } = await supabase
    .from('user_learning_paths')
    .select(`
      *,
      learning_path:learning_path_id (
        id,
        title,
        description,
        courses (
          id,
          slug,
          title
        )
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (!activePath?.learning_path) {
    console.log('ℹ️ [getActivePathProgress] Sin ruta activa')
    return null
  }

  console.log(
    '✅ [getActivePathProgress] Ruta activa:',
    activePath.learning_path.title
  )

  const pathCourses = activePath.learning_path.courses || []
  const courseIds = pathCourses.map((c: any) => c.id)

  if (courseIds.length === 0) {
    return {
      path: activePath.learning_path,
      completedCourses: 0,
      totalCourses: 0,
      completedLessons: 0,
      totalLessons: 0,
      percentage: 0,
    }
  }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, module_id, modules!inner(course_id)')
    .in('modules.course_id', courseIds)

  const lessonIds = lessons?.map((l) => l.id) || []

  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  const completedLessons = progress?.filter((p) => p.is_completed).length || 0
  const totalLessons = lessonIds.length

  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id, progress_percentage')
    .eq('user_id', userId)
    .in('course_id', courseIds)

  const completedCourses =
    enrollments?.filter((e) => e.progress_percentage === 100).length || 0
  const percentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  console.log('📊 [getActivePathProgress] Progreso calculado:', {
    completedCourses,
    totalCourses: pathCourses.length,
    completedLessons,
    totalLessons,
    percentage,
  })

  return {
    path: activePath.learning_path,
    completedCourses,
    totalCourses: pathCourses.length,
    completedLessons,
    totalLessons,
    percentage,
  }
}

// ----------------------
// Helpers de inscripciones
// ----------------------
async function getUserEnrollments(userId: string) {
  console.log('🔍 [getUserEnrollments] Usuario:', userId)
  const supabase = await createClient()

  const { data: enrollments, error } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      course:course_id (
        id,
        slug,
        title,
        description,
        thumbnail_url,
        level,
        total_lessons
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })

  if (error) {
    console.error('❌ [getUserEnrollments] Error:', error)
    return []
  }

  const enrichedEnrollments = await Promise.all(
    (enrollments || []).map(async (enrollment: any) => {
      if (!enrollment.course) return enrollment

      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', enrollment.course.id)

      const moduleIds = modules?.map((m) => m.id) || []

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      const lessonIds = lessons?.map((l) => l.id) || []
      const totalLessons = lessonIds.length

      const { data: progress } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      const completedLessons =
        progress?.filter((p) => p.is_completed).length || 0
      const progressPercentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0

      console.log(
        `📊 [getUserEnrollments] ${enrollment.course.title}: ${completedLessons}/${totalLessons} (${progressPercentage}%)`
      )

      return {
        ...enrollment,
        completedLessons,
        totalLessons,
        calculatedProgress: progressPercentage,
      }
    })
  )

  console.log(
    '✅ [getUserEnrollments] Progreso calculado para:',
    enrichedEnrollments.length,
    'cursos'
  )
  return enrichedEnrollments
}

// ----------------------
// Leaderboard + actividad
// ----------------------
async function getLeaderboard() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_gamification_stats')
    .select(`
      user_id,
      total_xp,
      current_level,
      users (
        full_name,
        email
      )
    `)
    .order('total_xp', { ascending: false })
    .limit(3)

  if (error) {
    console.error('[Dashboard] Error fetching leaderboard:', error)
    return []
  }

  return (
    data?.map((entry: any, index: number) => ({
      rank: index + 1,
      user_id: entry.user_id,
      full_name:
        entry.users?.full_name ||
        entry.users?.email?.split('@')[0] ||
        'Usuario',
      total_xp: entry.total_xp,
      current_level: entry.current_level,
    })) || []
  )
}

async function getRecentActivity(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[Dashboard] Error fetching activity:', error)
    return []
  }

  return data || []
}

// ----------------------
// Formateo fecha badges
// ----------------------
function formatBadgeDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Recién desbloqueado'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.error('[Dashboard] Fecha inválida:', dateString)
      return 'Recién desbloqueado'
    }

    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return formatter.format(date)
  } catch (error) {
    console.error('[Dashboard] Error al formatear fecha:', error, dateString)
    return 'Recién desbloqueado'
  }
}

// =====================
// DASHBOARD PRINCIPAL
// =====================
export default async function DashboardPage() {
  console.log('🔍 [Dashboard] Cargando datos del usuario')
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [
    pathProgress,
    enrollments,
    leaderboard,
    recentActivity,
    role,
  ] = await Promise.all([
    getActivePathProgress(user.id),
    getUserEnrollments(user.id),
    getLeaderboard(),
    getRecentActivity(user.id),
    getUserRole(user.id),
  ])

  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const totalXp = stats?.total_xp ?? 0

  const { data: userBadgesRaw } = await supabase
    .from('user_badges')
    .select('id, badge_id, unlocked_at')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })

  let badges: any[] = []

  if (userBadgesRaw && userBadgesRaw.length > 0) {
    const badgeIds = userBadgesRaw.map((ub) => ub.badge_id)

    const { data: badgesData } = await supabase
      .from('badges')
      .select('id, slug, title, description, icon, rarity, category')
      .in('id', badgeIds)

    if (badgesData) {
      badges = userBadgesRaw
        .map((ub) => {
          const badgeInfo = badgesData.find((b) => b.id === ub.badge_id)
          return {
            id: ub.id,
            unlocked_at: ub.unlocked_at,
            badge: badgeInfo,
          }
        })
        .filter((b) => b.badge)
    }
  }

  const { count: completedLessons } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_completed', true)

  console.log('📚 [Dashboard] Inscripciones encontradas:', enrollments.length)
  console.log('🏆 [Dashboard] Hitos encontrados:', badges.length)
  console.log('✅ [Dashboard] Datos cargados correctamente')

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* CABECERA */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
            Mi Dashboard
          </h1>
          <p className="text-gray-400">
            Bienvenido de nuevo,{' '}
            <span className="text-white font-medium">{user.email}</span>
          </p>
        </div>

        {/* 🔥 PANEL DE GAMIFICACIÓN GLOBAL */}
        <div className="mb-8">
          <UserGamificationPanel />
        </div>

        {/* Paneles según rol (versión nueva usando users.role) */}
        {role && role !== 'user' && (
          <div className="mb-8">
            <RoleBasedDashboard
              highestRole={role}
              roles={[role]}
              userName={user.email || undefined}
            />
          </div>
        )}

        {/* Ruta activa */}
        {pathProgress && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-2xl p-8 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">Tu Ruta Activa</p>
                  <h2 className="text-3xl font-bold mb-2">
                    ₿ {pathProgress.path.title}
                  </h2>
                  <p className="text-sm opacity-90">
                    {pathProgress.path.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      {pathProgress.completedCourses} de{' '}
                      {pathProgress.totalCourses} cursos completados
                    </span>
                    <span className="font-bold">
                      {pathProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${pathProgress.percentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm opacity-90">
                  📚 {pathProgress.completedLessons} de{' '}
                  {pathProgress.totalLessons} lecciones completadas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats superiores */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <StatCard title="Cursos activos" value={enrollments.length} icon="📚" />
          <StatCard
            title="Lecciones completadas"
            value={completedLessons || 0}
            icon="✅"
          />
          <StatCard
            title="Días de racha"
            value={stats?.current_streak || 0}
            icon="🔥"
          />
          <StatCard title="Hitos obtenidos" value={badges.length} icon="🏆" />
          <a
            href="/dashboard/certificados"
            className="bg-gradient-to-br from-[#f7931a]/20 to-[#ff6b35]/20 backdrop-blur-lg rounded-xl p-4 border border-[#f7931a]/30 hover:border-[#f7931a]/60 transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 group-hover:text-[#f7931a] transition-colors">
                Mis Certificados
              </span>
              <span className="text-xl">🎓</span>
            </div>
            <p className="text-lg font-bold text-[#f7931a]">Ver todos →</p>
          </a>
        </div>

        {/* BLOQUE NIVEL + HITOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Tarjeta de nivel usando UserLevel */}
          <div className="lg:col-span-1">
            <UserLevel totalXp={totalXp} />
          </div>

          {/* Hitos recientes */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  🏆 Hitos Recientes
                  {badges.length > 0 && (
                    <span className="text-sm font-normal text-gray-400">
                      ({badges.length})
                    </span>
                  )}
                </h2>
                <a
                  href="/badges"
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Ver todos los hitos →
                </a>
              </div>

              {badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.slice(0, 4).map((userBadge: any) => {
                    const badge = userBadge.badge
                    if (!badge) return null

                    const rarityColors: Record<string, string> = {
                      common: 'from-gray-600 to-gray-700 border-gray-500/50',
                      rare: 'from-blue-600 to-blue-700 border-blue-500/50',
                      epic: 'from-purple-600 to-purple-700 border-purple-500/50',
                      legendary:
                        'from-yellow-500 to-orange-600 border-yellow-500/50',
                    }

                    const formattedDate = formatBadgeDate(
                      userBadge.unlocked_at
                    )

                    return (
                      <div
                        key={userBadge.id}
                        className={`bg-gradient-to-br ${
                          rarityColors[badge.rarity] ||
                          'from-gray-600 to-gray-700'
                        } rounded-xl p-4 border-2 transition-all hover:scale-105 hover:shadow-xl cursor-pointer group relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                          <div className="text-5xl mb-3 text-center transform group-hover:scale-110 transition-transform">
                            {badge.icon || '🏆'}
                          </div>

                          <h3 className="font-bold text-sm mb-1 text-center leading-tight">
                            {badge.title || 'Hito'}
                          </h3>

                          <p className="text-xs opacity-90 text-center capitalize mb-2">
                            {badge.rarity || 'common'}
                          </p>

                          <p className="text-xs opacity-70 text-center border-t border-white/20 pt-2">
                            {formattedDate}
                          </p>

                          {badge.description && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                              {badge.description}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-xl font-semibold mb-2">
                    Aún no tienes hitos
                  </p>
                  <p className="text-gray-400 mb-6">
                    Completa lecciones y cursos para desbloquear hitos y ganar XP
                    extra
                  </p>
                  <a
                    href="/cursos"
                    className="inline-block bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    Explorar Cursos
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP 3 DE LA SEMANA */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <span className="text-3xl">🏆</span>
                <span className="text-white drop-shadow-lg">
                  Top 3 de la Semana
                </span>
              </h2>

              <div className="flex items-end justify-center gap-4">
                {/* #2 */}
                {leaderboard[1] && (
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-full w-16 h-16 flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                      <span className="text-3xl">🥈</span>
                    </div>
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 text-center min-w-[120px] shadow-xl border-2 border-gray-400/50">
                      <p className="text-2xl font-bold text-yellow-400 mb-1">
                        #2
                      </p>
                      <p className="text-white font-semibold mb-1 truncate">
                        {leaderboard[1].full_name}
                      </p>
                      <p className="text-sm text-gray-300">
                        Nivel {leaderboard[1].current_level}
                      </p>
                      <p className="text-base font-bold text-yellow-300 mt-2">
                        {leaderboard[1].total_xp} XP
                      </p>
                    </div>
                  </div>
                )}

                {/* #1 */}
                {leaderboard[0] && (
                  <div className="flex flex-col items-center -mt-6">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-24 h-24 flex items-center justify-center mb-4 shadow-2xl transform hover:scale-110 transition-transform animate-pulse">
                      <span className="text-5xl">🏆</span>
                    </div>
                    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 text-center min-w-[140px] shadow-2xl border-4 border-yellow-400/70">
                      <p className="text-4xl font-bold text-yellow-400 mb-2">
                        #1
                      </p>
                      <p className="text-white font-bold text-base mb-2 truncate">
                        {leaderboard[0].full_name}
                      </p>
                      <p className="text-sm text-gray-300">
                        Nivel {leaderboard[0].current_level}
                      </p>
                      <p className="text-xl font-bold text-yellow-300 mt-2">
                        {leaderboard[0].total_xp} XP
                      </p>
                    </div>
                  </div>
                )}

                {/* #3 */}
                {leaderboard[2] && (
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-full w-16 h-16 flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                      <span className="text-3xl">🥉</span>
                    </div>
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 text-center min-w-[120px] shadow-xl border-2 border-amber-700/50">
                      <p className="text-2xl font-bold text-yellow-400 mb-1">
                        #3
                      </p>
                      <p className="text-white font-semibold mb-1 truncate">
                        {leaderboard[2].full_name}
                      </p>
                      <p className="text-sm text-gray-300">
                        Nivel {leaderboard[2].current_level}
                      </p>
                      <p className="text-base font-bold text-yellow-300 mt-2">
                        {leaderboard[2].total_xp} XP
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {leaderboard.some((entry) => entry.user_id === user.id) && (
                <div className="mt-6 text-center">
                  <p className="text-white font-semibold bg-white/10 backdrop-blur-sm inline-block px-6 py-3 rounded-full">
                    🎉 ¡Felicidades! Estás en el Top 3
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVIDAD RECIENTE */}
        {recentActivity && recentActivity.length > 0 && (
          <div className="mb-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                📊 Actividad Reciente
              </h3>
              <div className="space-y-3">
                {recentActivity.map((activity: any, index: number) => (
                  <div
                    key={activity.id || index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {activity.event_type === 'lesson_completed' && '✅'}
                        {activity.event_type === 'course_completed' && '🎓'}
                        {activity.event_type === 'badge_unlocked' && '🏆'}
                        {activity.event_type === 'level_up' && '⬆️'}
                        {![
                          'lesson_completed',
                          'course_completed',
                          'badge_unlocked',
                          'level_up',
                        ].includes(activity.event_type) && '📝'}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {activity.description || activity.event_type}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(
                            activity.created_at
                          ).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-emerald-400 font-bold">
                      +{activity.xp_amount} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MIS CURSOS */}
        {enrollments && enrollments.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Mis Cursos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => {
                const course = enrollment.course
                if (!course) return null

                const progress =
                  enrollment.calculatedProgress ||
                  enrollment.progress_percentage ||
                  0

                return (
                  <a
                    key={enrollment.id}
                    href={`/cursos/${course.slug}`}
                    className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden border border-white/10 hover:border-[#ff6b35] transition-all group"
                  >
                    {course.thumbnail_url && (
                      <div className="aspect-video bg-gray-800 overflow-hidden">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-[#ff6b35]/20 text-[#ff6b35] rounded-full capitalize">
                          {course.level}
                        </span>
                        <span className="text-xs text-gray-400">
                          {progress}% completado
                        </span>
                      </div>

                      {progress > 0 && (
                        <div className="mb-3">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-full h-2 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <h3 className="font-bold text-lg mb-2 group-hover:text-[#ff6b35] transition-colors">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {enrollment.totalLessons > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {enrollment.completedLessons} de{' '}
                          {enrollment.totalLessons} lecciones
                        </p>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-2">
              No tienes cursos activos
            </h2>
            <p className="text-gray-400 mb-6">
              Explora nuestro catálogo y comienza tu viaje de aprendizaje
            </p>
            <a
              href="/cursos"
              className="inline-block bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Ver Cursos Disponibles
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------
// Tarjeta pequeña de stats
// ----------------------
function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: string
}) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
