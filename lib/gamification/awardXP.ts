import { createAdminClient } from '@/lib/supabase/admin'
import { getSetting } from '@/lib/settings/getSetting'
import {
  DEFAULT_XP_RULES,
  DEFAULT_LEVEL_RULES,
  type XPRules,
  type LevelRules
} from '@/lib/settings/defaults'
import { calculateLevel } from '@/lib/gamification/levels'

export type XPEventType =
  | 'lesson_completed'
  | 'quiz_passed'
  | 'perfect_score'
  | 'course_completed'
  | 'daily_login'
  | 'streak_bonus'
  | 'admin_adjustment'

type AwardXPInput = {
  userId: string
  eventType: XPEventType
  /**
   * Si lo pasas, se usa como XP a añadir (override).
   * Si no, se calcula desde xp_rules según eventType.
   */
  amount?: number
  /**
   * Texto descriptivo (para xp_events.description).
   */
  description?: string
  /**
   * Contexto opcional (para trazabilidad interna si luego amplías xp_events con metadata jsonb).
   */
  context?: {
    lessonId?: string
    courseId?: string
    quizId?: string
  }
}

type AwardXPResult = {
  xpAwarded: number
  totalXP: number
  level: number
  xpToNextLevel: number
}

/**
 * Otorga XP de forma centralizada:
 * - lee xp_rules y level_rules desde system_settings
 * - asegura user_gamification_stats
 * - suma XP (sin bajar de 0)
 * - recalcula nivel
 * - actualiza stats
 * - inserta xp_event
 */
export async function awardXP(input: AwardXPInput): Promise<AwardXPResult> {
  const { userId, eventType } = input

  if (!userId) {
    throw new Error('awardXP: userId requerido')
  }

  const admin = createAdminClient()

  // 1) Leer settings (source of truth)
  const xpRules = await getSetting<XPRules>('xp_rules', DEFAULT_XP_RULES)
  const levelRules = await getSetting<LevelRules>('level_rules', DEFAULT_LEVEL_RULES)

  // 2) Determinar XP a otorgar
  const computedAmount = (() => {
    switch (eventType) {
      case 'lesson_completed':
        return xpRules.lesson_completed
      case 'quiz_passed':
        return xpRules.quiz_passed
      case 'perfect_score':
        return xpRules.perfect_score
      case 'course_completed':
        return xpRules.course_completed
      case 'daily_login':
        return xpRules.daily_login
      case 'streak_bonus':
        return xpRules.streak_bonus
      case 'admin_adjustment':
        // Para admin_adjustment normalmente vendrá input.amount
        return 0
      default:
        return 0
    }
  })()

  const xpToAddRaw =
    typeof input.amount === 'number' && Number.isFinite(input.amount)
      ? input.amount
      : computedAmount

  // Normalizamos: permitir negativos solo en admin_adjustment (o si tú lo permites)
  // Por defecto: no otorgamos negativos salvo que venga explícito (admin_adjustment).
  const xpToAdd =
    eventType === 'admin_adjustment'
      ? xpToAddRaw
      : Math.max(0, xpToAddRaw)

  // 3) Asegurar stats (upsert)
  const { data: ensuredStats, error: upsertError } = await admin
    .from('user_gamification_stats')
    .upsert(
      {
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 100,
        current_streak: 0,
        longest_streak: 0
      },
      { onConflict: 'user_id' }
    )
    .select('total_xp')
    .single()

  if (upsertError) {
    throw new Error(`awardXP: error asegurando stats (${upsertError.message})`)
  }

  const currentXP = ensuredStats?.total_xp ?? 0
  const newXP = Math.max(0, currentXP + xpToAdd)

  // 4) Recalcular nivel
  const { level, xpToNextLevel } = calculateLevel(newXP, levelRules)

  // 5) Update stats
  const { error: updateError } = await admin
    .from('user_gamification_stats')
    .update({
      total_xp: newXP,
      current_level: level,
      xp_to_next_level: xpToNextLevel,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (updateError) {
    throw new Error(`awardXP: error actualizando stats (${updateError.message})`)
  }

  // 6) Insert xp_event (no bloqueante para UX, pero aquí lo tratamos como best effort)
  const description =
    input.description?.trim() ||
    (() => {
      switch (eventType) {
        case 'lesson_completed':
          return input.context?.lessonId
            ? `Lección completada: ${input.context.lessonId}`
            : 'Lección completada'
        case 'quiz_passed':
          return input.context?.quizId
            ? `Quiz aprobado: ${input.context.quizId}`
            : 'Quiz aprobado'
        case 'perfect_score':
          return 'Puntuación perfecta'
        case 'course_completed':
          return input.context?.courseId
            ? `Curso completado: ${input.context.courseId}`
            : 'Curso completado'
        case 'daily_login':
          return 'Login diario'
        case 'streak_bonus':
          return 'Bonus de racha'
        case 'admin_adjustment':
          return 'Ajuste manual de admin'
        default:
          return 'Evento XP'
      }
    })()

  const { error: eventError } = await admin.from('xp_events').insert({
    user_id: userId,
    event_type: eventType,
    xp_amount: xpToAdd,
    description,
    created_at: new Date().toISOString()
  })

  if (eventError) {
    // No rompemos el XP ya aplicado. Solo trazamos.
    console.error('[awardXP] Error insert xp_event:', eventError)
  }

  return {
    xpAwarded: xpToAdd,
    totalXP: newXP,
    level,
    xpToNextLevel
  }
}
