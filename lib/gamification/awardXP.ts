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
    moduleId?: string
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

  // 1) Leer settings (source of truth) CON FALLBACK GARANTIZADO
  const rawXpRules = await getSetting<XPRules>('xp_rules', DEFAULT_XP_RULES)
  const rawLevelRules = await getSetting<LevelRules>('level_rules', DEFAULT_LEVEL_RULES)

  // Garantizar que xpRules nunca sea null/undefined
  const xpRules: XPRules = rawXpRules ?? DEFAULT_XP_RULES
  const levelRules: LevelRules = rawLevelRules ?? DEFAULT_LEVEL_RULES

  // 2) Determinar XP a otorgar CON VALIDACION ESTRICTA
  const computedAmount = (() => {
    switch (eventType) {
      case 'lesson_completed':
        return Number(xpRules.lesson_completed) || DEFAULT_XP_RULES.lesson_completed
      case 'quiz_passed':
        return Number(xpRules.quiz_passed) || DEFAULT_XP_RULES.quiz_passed
      case 'perfect_score':
        return Number(xpRules.perfect_score) || DEFAULT_XP_RULES.perfect_score
      case 'course_completed':
        return Number(xpRules.course_completed) || DEFAULT_XP_RULES.course_completed
      case 'daily_login':
        return Number(xpRules.daily_login) || DEFAULT_XP_RULES.daily_login
      case 'streak_bonus':
        return Number(xpRules.streak_bonus) || DEFAULT_XP_RULES.streak_bonus
      case 'admin_adjustment':
        return 0
      default:
        return 0
    }
  })()

  // Validar que computedAmount es numero finito
  const safeComputedAmount = Number.isFinite(computedAmount) ? computedAmount : 0

  const xpToAddRaw =
    typeof input.amount === 'number' && Number.isFinite(input.amount)
      ? input.amount
      : safeComputedAmount

  // Normalizamos: permitir negativos solo en admin_adjustment
  const xpToAdd =
    eventType === 'admin_adjustment'
      ? (Number.isFinite(xpToAddRaw) ? xpToAddRaw : 0)
      : Math.max(0, Number.isFinite(xpToAddRaw) ? xpToAddRaw : 0)

  console.log('[awardXP] DEBUG xpToAdd:', { eventType, computedAmount, safeComputedAmount, xpToAddRaw, xpToAdd })

  // 3) Obtener stats actuales (puede no existir)
  const { data: currentStats, error: statsError } = await admin
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  console.log('[awardXP] DEBUG currentStats:', {
    exists: !!currentStats,
    total_xp: currentStats?.total_xp,
    typeof_total_xp: typeof currentStats?.total_xp,
    error: statsError?.message
  })

  // 4) Calcular nuevos valores CON TRIPLE VALIDACION
  const rawCurrentXP = currentStats?.total_xp
  const safeCurrentXP = (typeof rawCurrentXP === 'number' && Number.isFinite(rawCurrentXP))
    ? rawCurrentXP
    : 0
  const rawNewXP = safeCurrentXP + xpToAdd
  const newXP = Number.isFinite(rawNewXP) ? Math.max(0, Math.floor(rawNewXP)) : 0

  console.log('[awardXP] DEBUG XP calc:', { rawCurrentXP, safeCurrentXP, rawNewXP, newXP })

  // Recalcular nivel
  const { level, xpToNextLevel } = calculateLevel(newXP, levelRules)

  // Validar resultados de calculateLevel
  const safeLevel = (typeof level === 'number' && Number.isFinite(level) && level >= 1) ? level : 1
  const safeXpToNextLevel = (typeof xpToNextLevel === 'number' && Number.isFinite(xpToNextLevel)) ? xpToNextLevel : 100

  // Preparar datos para upsert con VALIDACION EXHAUSTIVA
  const now = new Date().toISOString()
  const dateOnly = now.split('T')[0]

  const upsertData = {
    user_id: userId,
    total_xp: newXP,
    current_level: safeLevel,
    xp_to_next_level: safeXpToNextLevel,
    total_badges: Math.max(0, Number(currentStats?.total_badges) || 0),
    current_streak: Math.max(0, Number(currentStats?.current_streak) || 0),
    longest_streak: Math.max(0, Number(currentStats?.longest_streak) || 0),
    last_activity_date: dateOnly,
    updated_at: now,
    ...(currentStats ? {} : { created_at: now })
  }

  // VALIDACION FINAL: Verificar que ningun campo es null/undefined/NaN
  const fieldsToCheck = ['total_xp', 'current_level', 'xp_to_next_level', 'total_badges', 'current_streak', 'longest_streak'] as const
  for (const field of fieldsToCheck) {
    const value = upsertData[field]
    if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) {
      console.error(`[awardXP] FATAL: Campo ${field} tiene valor invalido:`, value)
      throw new Error(`awardXP: campo ${field} = ${value} (invalido)`)
    }
  }

  console.log('[awardXP] Upsert data FINAL:', JSON.stringify(upsertData, null, 2))

  // 5) UPSERT unico - crea si no existe, actualiza si existe
  const { error: updateError } = await admin
    .from('user_gamification_stats')
    .upsert(upsertData, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })

  if (updateError) {
    console.error('[awardXP] Error en upsert:', updateError)
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

  // Solo insertar evento si hay XP positivo (por constraint CHECK xp_earned > 0)
  if (xpToAdd > 0) {
    const { error: eventError } = await admin.from('xp_events').insert({
      user_id: userId,
      event_type: eventType,
      xp_earned: xpToAdd, // Columna correcta es xp_earned, no xp_amount
      description,
      created_at: new Date().toISOString()
    })

    if (eventError) {
      // No rompemos el XP ya aplicado. Solo trazamos.
      console.error('[awardXP] Error insert xp_event:', eventError)
    }
  }

  return {
    xpAwarded: xpToAdd,
    totalXP: newXP,
    level: safeLevel,
    xpToNextLevel: safeXpToNextLevel
  }
}


