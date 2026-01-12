import { createAdminClient } from '@/lib/supabase/admin'
import { getSetting } from '@/lib/settings/getSetting'
import { DEFAULT_LEVEL_RULES, type LevelRules } from '@/lib/settings/defaults'
import { calculateLevel } from '@/lib/gamification/levels'

// Types for badge checking
export type BadgeEventType =
  | 'lesson_completed'
  | 'course_completed'
  | 'quiz_passed'
  | 'level_up'
  | 'streak_updated'

interface BadgeCheckContext {
  userId: string
  eventType: BadgeEventType
  metadata?: {
    lessonId?: string
    courseId?: string
    newLevel?: number
    streakDays?: number
  }
}

interface AwardedBadge {
  id: string
  slug: string
  title: string
  description: string | null
  rarity: string | null
  xpAwarded: number
}

interface BadgeCheckResult {
  success: boolean
  awardedBadges: AwardedBadge[]
  error?: string
}

// XP rewards by rarity (since badges table may not have xp_reward column)
const XP_BY_RARITY: Record<string, number> = {
  common: 10,
  rare: 25,
  epic: 50,
  legendary: 100,
}

/**
 * Verifica y otorga badges automáticamente basado en el evento.
 *
 * Flujo:
 * 1. Obtiene stats actuales del usuario
 * 2. Obtiene badges que ya tiene
 * 3. Obtiene todos los badges activos
 * 4. Evalúa criterios según requirement_type/requirement_value
 * 5. Otorga badges que cumple y no tiene
 * 6. Actualiza total_badges en stats
 *
 * @returns Lista de badges otorgados (vacía si ninguno)
 */
export async function checkAndAwardBadges(context: BadgeCheckContext): Promise<BadgeCheckResult> {
  const { userId, eventType, metadata } = context
  const awardedBadges: AwardedBadge[] = []

  console.log('🏅 [Badges] Verificando badges para:', {
    userId: userId.substring(0, 8),
    eventType,
    metadata,
  })

  try {
    const admin = createAdminClient()

    // 1. Obtener stats actuales del usuario
    const { data: stats } = await admin
      .from('user_gamification_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 2. Obtener badges que ya tiene el usuario
    const { data: userBadges } = await admin
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || [])

    // 3. Obtener todos los badges activos
    const { data: allBadges, error: badgesError } = await admin
      .from('badges')
      .select('*')
      .eq('is_active', true)

    if (badgesError) {
      console.error('❌ [Badges] Error obteniendo badges:', badgesError)
      return { success: false, awardedBadges: [], error: badgesError.message }
    }

    if (!allBadges || allBadges.length === 0) {
      console.log('🏅 [Badges] No hay badges activos definidos')
      return { success: true, awardedBadges: [] }
    }

    // 4. Obtener contadores actuales para evaluar criterios
    const counters = await getUserCounters(admin, userId)

    // 5. Evaluar cada badge
    for (const badge of allBadges) {
      // Skip si ya lo tiene
      if (earnedBadgeIds.has(badge.id)) {
        continue
      }

      // Evaluar si cumple el criterio
      const meetsRequirement = evaluateBadgeRequirement(
        badge,
        counters,
        stats,
        eventType,
        metadata
      )

      if (meetsRequirement) {
        console.log('🏅 [Badges] Usuario cumple criterio para:', badge.title)

        // Insertar en user_badges
        const { error: insertError } = await admin
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            unlocked_at: new Date().toISOString(),
          })

        if (insertError) {
          // Puede ser duplicado por race condition - ignorar
          if (insertError.code === '23505') {
            console.log('🏅 [Badges] Badge ya existía (race condition):', badge.slug)
            continue
          }
          console.error('❌ [Badges] Error insertando badge:', insertError)
          continue
        }

        // Calcular XP a otorgar
        const xpReward = XP_BY_RARITY[badge.rarity || 'common'] || 10

        // Registrar evento de XP por badge
        await admin.from('xp_events').insert({
          user_id: userId,
          event_type: 'badge_earned',
          xp_earned: xpReward,
          description: `Badge desbloqueado: ${badge.title}`,
          metadata: { badge_id: badge.id, badge_slug: badge.slug },
          created_at: new Date().toISOString(),
        })

        // Actualizar XP total del usuario usando UPSERT (crea si no existe)
        const currentXP = stats?.total_xp || 0
        const newXP = Math.max(0, currentXP + xpReward)

        // Leer level_rules para calcular nivel
        const levelRules = await getSetting<LevelRules>('level_rules', DEFAULT_LEVEL_RULES) ?? DEFAULT_LEVEL_RULES
        const { level, xpToNextLevel } = calculateLevel(newXP, levelRules)

        const now = new Date().toISOString()
        const dateOnly = now.split('T')[0]

        await admin
          .from('user_gamification_stats')
          .upsert({
            user_id: userId,
            total_xp: newXP,
            current_level: level,
            xp_to_next_level: xpToNextLevel,
            total_badges: (stats?.total_badges || 0) + 1,
            current_streak: stats?.current_streak || 0,
            longest_streak: stats?.longest_streak || 0,
            last_activity_date: dateOnly,
            updated_at: now,
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })

        // Agregar a lista de otorgados
        awardedBadges.push({
          id: badge.id,
          slug: badge.slug,
          title: badge.title,
          description: badge.description,
          rarity: badge.rarity,
          xpAwarded: xpReward,
        })

        console.log('✅ [Badges] Badge otorgado:', badge.title, '+', xpReward, 'XP')

        // Añadir al set para evitar duplicados en esta ejecución
        earnedBadgeIds.add(badge.id)
      }
    }

    console.log('🏅 [Badges] Total badges otorgados:', awardedBadges.length)
    return { success: true, awardedBadges }

  } catch (error) {
    console.error('❌ [Badges] Error en checkAndAwardBadges:', error)
    return {
      success: false,
      awardedBadges: [],
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene contadores del usuario para evaluar criterios de badges
 */
async function getUserCounters(admin: ReturnType<typeof createAdminClient>, userId: string) {
  // Lecciones completadas
  const { count: lessonsCompleted } = await admin
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_completed', true)

  // Cursos completados
  const { count: coursesCompleted } = await admin
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('completed_at', 'is', null)

  // Quizzes aprobados
  const { count: quizzesPassed } = await admin
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('passed', true)

  // Certificados obtenidos
  const { count: certificatesEarned } = await admin
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return {
    lessonsCompleted: lessonsCompleted || 0,
    coursesCompleted: coursesCompleted || 0,
    quizzesPassed: quizzesPassed || 0,
    certificatesEarned: certificatesEarned || 0,
  }
}

/**
 * Evalúa si el usuario cumple el requisito de un badge
 */
function evaluateBadgeRequirement(
  badge: {
    requirement_type: string | null
    requirement_value: number | null
    slug: string
    title: string
  },
  counters: {
    lessonsCompleted: number
    coursesCompleted: number
    quizzesPassed: number
    certificatesEarned: number
  },
  stats: {
    current_level?: number
    current_streak?: number
    total_xp?: number
  } | null,
  eventType: BadgeEventType,
  metadata?: {
    newLevel?: number
    streakDays?: number
  }
): boolean {
  const reqType = badge.requirement_type?.toLowerCase()
  const reqValue = badge.requirement_value || 0

  // Si no tiene requirement_type, intentar inferir por slug
  if (!reqType) {
    return evaluateBySlug(badge.slug, counters, stats, metadata)
  }

  switch (reqType) {
    case 'lessons_completed':
    case 'lesson_count':
      return counters.lessonsCompleted >= reqValue

    case 'courses_completed':
    case 'course_count':
      return counters.coursesCompleted >= reqValue

    case 'quizzes_passed':
    case 'quiz_count':
      return counters.quizzesPassed >= reqValue

    case 'level':
    case 'level_reached':
      const currentLevel = metadata?.newLevel || stats?.current_level || 1
      return currentLevel >= reqValue

    case 'streak':
    case 'streak_days':
      const streakDays = metadata?.streakDays || stats?.current_streak || 0
      return streakDays >= reqValue

    case 'xp':
    case 'total_xp':
      return (stats?.total_xp || 0) >= reqValue

    case 'certificates':
    case 'certificates_earned':
      return counters.certificatesEarned >= reqValue

    default:
      // Tipo desconocido, intentar por slug
      return evaluateBySlug(badge.slug, counters, stats, metadata)
  }
}

/**
 * Evalúa por slug cuando no hay requirement_type definido
 */
function evaluateBySlug(
  slug: string,
  counters: {
    lessonsCompleted: number
    coursesCompleted: number
    quizzesPassed: number
    certificatesEarned: number
  },
  stats: {
    current_level?: number
    current_streak?: number
    total_xp?: number
  } | null,
  metadata?: {
    newLevel?: number
    streakDays?: number
  }
): boolean {
  const s = slug.toLowerCase()

  // Lecciones
  if (s.includes('first-lesson') || s.includes('primera-leccion')) {
    return counters.lessonsCompleted >= 1
  }
  if (s.includes('ten-lessons') || s.includes('10-lecciones') || s.includes('10-lessons')) {
    return counters.lessonsCompleted >= 10
  }
  if (s.includes('fifty-lessons') || s.includes('50-lecciones') || s.includes('50-lessons')) {
    return counters.lessonsCompleted >= 50
  }
  if (s.includes('100-lessons') || s.includes('100-lecciones')) {
    return counters.lessonsCompleted >= 100
  }

  // Cursos
  if (s.includes('first-course') || s.includes('primer-curso')) {
    return counters.coursesCompleted >= 1
  }
  if (s.includes('three-courses') || s.includes('3-cursos') || s.includes('3-courses')) {
    return counters.coursesCompleted >= 3
  }
  if (s.includes('five-courses') || s.includes('5-cursos') || s.includes('5-courses')) {
    return counters.coursesCompleted >= 5
  }
  if (s.includes('ten-courses') || s.includes('10-cursos') || s.includes('10-courses')) {
    return counters.coursesCompleted >= 10
  }

  // Niveles
  if (s.includes('level-5') || s.includes('nivel-5')) {
    const level = metadata?.newLevel || stats?.current_level || 1
    return level >= 5
  }
  if (s.includes('level-10') || s.includes('nivel-10')) {
    const level = metadata?.newLevel || stats?.current_level || 1
    return level >= 10
  }
  if (s.includes('level-25') || s.includes('nivel-25')) {
    const level = metadata?.newLevel || stats?.current_level || 1
    return level >= 25
  }
  if (s.includes('level-50') || s.includes('nivel-50')) {
    const level = metadata?.newLevel || stats?.current_level || 1
    return level >= 50
  }

  // Rachas
  if (s.includes('streak-7') || s.includes('racha-7')) {
    const streak = metadata?.streakDays || stats?.current_streak || 0
    return streak >= 7
  }
  if (s.includes('streak-30') || s.includes('racha-30')) {
    const streak = metadata?.streakDays || stats?.current_streak || 0
    return streak >= 30
  }
  if (s.includes('streak-100') || s.includes('racha-100')) {
    const streak = metadata?.streakDays || stats?.current_streak || 0
    return streak >= 100
  }

  // Quizzes
  if (s.includes('first-quiz') || s.includes('primer-quiz')) {
    return counters.quizzesPassed >= 1
  }
  if (s.includes('quiz-master') || s.includes('maestro-quiz')) {
    return counters.quizzesPassed >= 10
  }

  // Certificados
  if (s.includes('first-certificate') || s.includes('primer-certificado')) {
    return counters.certificatesEarned >= 1
  }

  // Por defecto, no cumple
  return false
}
