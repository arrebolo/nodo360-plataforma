import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Obtiene todas las estadísticas del dashboard admin
 */
export async function getAdminStats() {
  const supabase = await createClient()

  // Stats básicos
  const [
    { count: coursesCount },
    { count: modulesCount },
    { count: lessonsCount },
    { count: usersCount },
    { count: enrollmentsCount },
    { count: badgesCount },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('modules').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('badges').select('*', { count: 'exact', head: true }),
  ])

  // Usuarios activos (última semana)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { count: activeUsersCount } = await supabase
    .from('xp_events')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString())

  // XP otorgado esta semana
  const { data: xpThisWeek } = await supabase
    .from('xp_events')
    .select('xp_amount')
    .gte('created_at', oneWeekAgo.toISOString())

  const totalXpThisWeek = xpThisWeek?.reduce((sum, event) => sum + event.xp_amount, 0) || 0

  // Hitos desbloqueados hoy
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: badgesUnlockedToday } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .gte('unlocked_at', today.toISOString())

  // Lecciones completadas hoy
  const { count: lessonsCompletedToday } = await supabase
    .from('lesson_completions')
    .select('*', { count: 'exact', head: true })
    .gte('completed_at', today.toISOString())

  return {
    courses: coursesCount || 0,
    modules: modulesCount || 0,
    lessons: lessonsCount || 0,
    users: usersCount || 0,
    enrollments: enrollmentsCount || 0,
    badges: badgesCount || 0,
    activeUsers: activeUsersCount || 0,
    totalXpThisWeek,
    badgesUnlockedToday: badgesUnlockedToday || 0,
    lessonsCompletedToday: lessonsCompletedToday || 0,
  }
}

/**
 * Obtiene actividad diaria de los últimos 7 días
 */
export async function getActivityLastWeek() {
  const supabase = await createClient()
  const days = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const { count } = await supabase
      .from('xp_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString())

    days.push({
      date: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      count: count || 0
    })
  }

  return days
}

/**
 * Obtiene distribución de usuarios por nivel
 */
export async function getUsersByLevel() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('user_gamification_stats')
    .select('current_level')

  if (!users) return []

  const levelCounts: { [key: number]: number } = {}
  users.forEach(user => {
    const level = user.current_level || 1
    levelCounts[level] = (levelCounts[level] || 0) + 1
  })

  return Object.entries(levelCounts)
    .map(([level, count]) => ({ level: parseInt(level), count }))
    .sort((a, b) => a.level - b.level)
}

/**
 * Obtiene lista de usuarios con paginación
 * Usa admin client para bypass RLS y obtener stats de gamificación
 */
export async function getUsers(page: number = 1, limit: number = 20) {
  const admin = createAdminClient()
  const offset = (page - 1) * limit

  const { data: users, error, count } = await admin
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      is_beta,
      is_suspended,
      created_at,
      user_gamification_stats (
        total_xp,
        current_level
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0 }
  }

  return {
    users: users || [],
    total: count || 0
  }
}

/**
 * Obtiene cursos más populares (por inscripciones)
 */
export async function getPopularCourses(limit: number = 5) {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      enrollments (count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  return courses || []
}


