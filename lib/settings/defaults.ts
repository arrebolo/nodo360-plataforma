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

export const DEFAULT_LEVEL_RULES = {
  xp_base: 100,
  xp_multiplier: 1.5,
  max_level: 100
} as const

export type LevelRules = {
  xp_base: number
  xp_multiplier: number
  max_level: number
}


