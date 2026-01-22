export const DEFAULT_XP_RULES = {
  lesson_completed: 50,
  course_completed: 500,
  streak_bonus: 10,
  quiz_passed: 25,
  perfect_score: 50,
  daily_login: 5
} as const

export type XPRules = {
  lesson_completed: number
  course_completed: number
  streak_bonus: number
  quiz_passed: number
  perfect_score: number
  daily_login: number
}

// NOTA: Los umbrales de nivel reales están en lib/gamification/levels.ts
// Estos valores son para compatibilidad con el sistema de settings
export const DEFAULT_LEVEL_RULES = {
  xp_base: 500,       // XP para nivel 2
  xp_multiplier: 1.5, // No usado (sistema de umbrales fijos)
  max_level: 10       // Nivel máximo: Satoshi (120,000 XP)
} as const

export type LevelRules = {
  xp_base: number
  xp_multiplier: number
  max_level: number
}


