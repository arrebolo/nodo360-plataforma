import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GamificationSection from '@/components/dashboard/GamificationSection'

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

  console.log('✅ [getActivePathProgress] Ruta activa:', activePath.learning_path.title)

  const pathCourses = activePath.learning_path.courses || []
  const courseIds = pathCourses.map((c: any) => c.id)

  if (courseIds.length === 0) {
    return {
      path: activePath.learning_path,
      completedCourses: 0,
      totalCourses: 0,
      completedLessons: 0,
      totalLessons: 0,
      percentage: 0
    }
  }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, module_id, modules!inner(course_id)')
    .in('modules.course_id', courseIds)

  const lessonIds = lessons?.map(l => l.id) || []

  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  const completedLessons = progress?.filter(p => p.is_completed).length || 0
  const totalLessons = lessonIds.length

  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id, progress_percentage')
    .eq('user_id', userId)
    .in('course_id', courseIds)

  const completedCourses = enrollments?.filter(e => e.progress_percentage === 100).length || 0
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  console.log('📊 [getActivePathProgress] Progreso calculado:', {
    completedCourses,
    totalCourses: pathCourses.length,
    completedLessons,
    totalLessons,
    percentage
  })

  return {
    path: activePath.learning_path,
    completedCourses,
    totalCourses: pathCourses.length,
    completedLessons,
    totalLessons,
    percentage
  }
}

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

      const moduleIds = modules?.map(m => m.id) || []

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      const lessonIds = lessons?.map(l => l.id) || []
      const totalLessons = lessonIds.length

      const { data: progress } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      const completedLessons = progress?.filter(p => p.is_completed).length || 0
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      console.log(`📊 [getUserEnrollments] ${enrollment.course.title}: ${completedLessons}/${totalLessons} (${progressPercentage}%)`)

      return {
        ...enrollment,
        completedLessons,
        totalLessons,
        calculatedProgress: progressPercentage
      }
    })
  )

  console.log('✅ [getUserEnrollments] Progreso calculado para:', enrichedEnrollments.length, 'cursos')
  return enrichedEnrollments
}

// Función auxiliar para formatear fechas de forma segura
function formatBadgeDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Recién desbloqueado'
  }

  try {
    // Intentar parsear la fecha
    const date = new Date(dateString)
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.error('[Dashboard] Fecha inválida:', dateString)
      return 'Fecha no disponible'
    }

    // Formatear usando Intl.DateTimeFormat (más robusto)
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    
    return formatter.format(date)
  } catch (error) {
    console.error('[Dashboard] Error al formatear fecha:', error, dateString)
    return 'Fecha no disponible'
  }
}

export default async function DashboardPage() {
  console.log('🔍 [Dashboard] Cargando datos del usuario')
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [pathProgress, enrollments] = await Promise.all([
    getActivePathProgress(user.id),
    getUserEnrollments(user.id)
  ])

  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: userBadgesRaw } = await supabase
    .from('user_badges')
    .select('id, badge_id, unlocked_at')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })

  let badges: any[] = []

  if (userBadgesRaw && userBadgesRaw.length > 0) {
    const badgeIds = userBadgesRaw.map(ub => ub.badge_id)
    
    const { data: badgesData } = await supabase
      .from('badges')
      .select('id, slug, title, description, icon, rarity, category')
      .in('id', badgeIds)

    if (badgesData) {
      badges = userBadgesRaw.map(ub => {
        const badgeInfo = badgesData.find(b => b.id === ub.badge_id)
        return {
          id: ub.id,
          unlocked_at: ub.unlocked_at,
          badge: badgeInfo
        }
      }).filter(b => b.badge)
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
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
            Mi Dashboard
          </h1>
          <p className="text-gray-400">
            Bienvenido de nuevo, <span className="text-white font-medium">{user.email}</span>
          </p>
        </div>

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
                    <span>{pathProgress.completedCourses} de {pathProgress.totalCourses} cursos completados</span>
                    <span className="font-bold">{pathProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${pathProgress.percentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm opacity-90">
                  📚 {pathProgress.completedLessons} de {pathProgress.totalLessons} lecciones completadas
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Cursos activos" value={enrollments.length} icon="📚" />
          <StatCard title="Lecciones completadas" value={completedLessons || 0} icon="✅" />
          <StatCard title="Días de racha" value={stats?.current_streak || 0} icon="🔥" />
          <StatCard title="Hitos obtenidos" value={badges.length} icon="🏆" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm opacity-90 mb-1">Tu Nivel</p>
                  <h2 className="text-5xl font-bold">Nivel {stats?.current_level || 1}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Hitos</p>
                  <p className="text-4xl font-bold">{badges.length}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>{stats?.total_xp || 0} XP</span>
                  <span>
                    {stats?.total_xp && stats?.current_level 
                      ? Math.round((stats.total_xp / ((stats.current_level) * 100)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className="bg-white rounded-full h-3 transition-all duration-500"
                    style={{ 
                      width: `${stats?.total_xp && stats?.current_level 
                        ? Math.min(100, (stats.total_xp / ((stats.current_level) * 100)) * 100)
                        : 0}%` 
                    }}
                  />
                </div>
                <p className="text-xs opacity-80 mt-2">
                  {stats?.xp_to_next_level || 100} XP para el siguiente nivel
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
                <div>
                  <p className="text-sm opacity-80">⚡ Total XP</p>
                  <p className="text-2xl font-bold">{stats?.total_xp || 0}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">🔥 Racha Actual</p>
                  <p className="text-2xl font-bold">{stats?.current_streak || 0} días</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  🏆 Hitos Recientes
                  {badges.length > 0 && (
                    <span className="text-sm font-normal text-gray-400">({badges.length})</span>
                  )}
                </h2>
                <a href="/badges" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  Ver todos los hitos →
                </a>
              </div>

              {badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.slice(0, 4).map((userBadge: any) => {
                    const badge = userBadge.badge
                    
                    if (!badge) return null

                    const rarityColors = {
                      common: 'from-gray-600 to-gray-700 border-gray-500/50',
                      rare: 'from-blue-600 to-blue-700 border-blue-500/50',
                      epic: 'from-purple-600 to-purple-700 border-purple-500/50',
                      legendary: 'from-yellow-500 to-orange-600 border-yellow-500/50'
                    }

                    // Usar la función auxiliar para formatear la fecha
                    const formattedDate = formatBadgeDate(userBadge.unlocked_at)

                    return (
                      <div
                        key={userBadge.id}
                        className={`bg-gradient-to-br ${rarityColors[badge.rarity as keyof typeof rarityColors] || 'from-gray-600 to-gray-700'} rounded-xl p-4 border-2 transition-all hover:scale-105 hover:shadow-xl cursor-pointer group relative overflow-hidden`}
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
                  <p className="text-xl font-semibold mb-2">Aún no tienes hitos</p>
                  <p className="text-gray-400 mb-6">
                    Completa lecciones y cursos para desbloquear hitos y ganar XP extra
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

        <GamificationSection userId={user.id} />

        {enrollments && enrollments.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Mis Cursos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => {
                const course = enrollment.course
                if (!course) return null

                const progress = enrollment.calculatedProgress || enrollment.progress_percentage || 0

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
                          {enrollment.completedLessons} de {enrollment.totalLessons} lecciones
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
            <h2 className="text-2xl font-bold mb-2">No tienes cursos activos</h2>
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

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
