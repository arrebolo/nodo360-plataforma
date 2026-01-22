/**
 * Sistema de Niveles de Nodo360
 *
 * Umbrales de XP progresivos con nombres temáticos Bitcoin
 */

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, name: 'Novato' },
  { level: 2, xp: 500, name: 'Aprendiz' },
  { level: 3, xp: 1500, name: 'Estudiante' },
  { level: 4, xp: 3500, name: 'Conocedor' },
  { level: 5, xp: 7000, name: 'Experto' },
  { level: 6, xp: 12000, name: 'Maestro' },
  { level: 7, xp: 25000, name: 'Veterano' },
  { level: 8, xp: 45000, name: 'Leyenda' },
  { level: 9, xp: 75000, name: 'Sabio' },
  { level: 10, xp: 120000, name: 'Satoshi' },
] as const

export const MAX_LEVEL = 10
export const MAX_XP = 120000

export type LevelThreshold = typeof LEVEL_THRESHOLDS[number]

/**
 * Calcula el nivel basado en XP total
 */
export function calculateLevelFromXP(xp: number): number {
  const safeXP = Number.isFinite(xp) ? Math.max(0, xp) : 0

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeXP >= LEVEL_THRESHOLDS[i].xp) {
      return LEVEL_THRESHOLDS[i].level
    }
  }
  return 1
}

/**
 * Obtiene el nombre del nivel
 */
export function getLevelName(level: number): string {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level)
  return threshold?.name ?? 'Novato'
}

/**
 * Obtiene información completa del nivel actual
 */
export function getLevelInfo(level: number): LevelThreshold {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level)
  return threshold ?? LEVEL_THRESHOLDS[0]
}

/**
 * Calcula el progreso hacia el siguiente nivel
 */
export function getXPProgress(currentXP: number): {
  currentLevel: number
  levelName: string
  xpInLevel: number
  xpForNextLevel: number
  progress: number
  xpToNextLevel: number
  isMaxLevel: boolean
} {
  const safeXP = Number.isFinite(currentXP) ? Math.max(0, currentXP) : 0
  const currentLevel = calculateLevelFromXP(safeXP)
  const levelName = getLevelName(currentLevel)

  if (currentLevel >= MAX_LEVEL) {
    return {
      currentLevel,
      levelName,
      xpInLevel: safeXP - LEVEL_THRESHOLDS[MAX_LEVEL - 1].xp,
      xpForNextLevel: 0,
      progress: 100,
      xpToNextLevel: 0,
      isMaxLevel: true
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1].xp
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel].xp
  const xpInLevel = safeXP - currentThreshold
  const xpForNextLevel = nextThreshold - currentThreshold
  const progress = Math.min(100, Math.round((xpInLevel / xpForNextLevel) * 100))
  const xpToNextLevel = nextThreshold - safeXP

  return {
    currentLevel,
    levelName,
    xpInLevel,
    xpForNextLevel,
    progress,
    xpToNextLevel,
    isMaxLevel: false
  }
}

/**
 * Calcula el nivel y XP restante (compatible con la firma anterior)
 * @deprecated Usar getXPProgress() para más información
 */
export function calculateLevel(totalXP: number, rules?: { max_level?: number }) {
  const safeXP = Number.isFinite(totalXP) ? Math.max(0, totalXP) : 0
  const maxLevel = rules?.max_level ?? MAX_LEVEL

  const level = Math.min(maxLevel, calculateLevelFromXP(safeXP))
  const progress = getXPProgress(safeXP)

  return {
    level,
    xpToNextLevel: progress.xpToNextLevel
  }
}

/**
 * Obtiene el XP mínimo requerido para un nivel
 */
export function getXPForLevel(level: number): number {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level)
  return threshold?.xp ?? 0
}

/**
 * Obtiene todos los umbrales (útil para UI)
 */
export function getAllLevelThresholds(): readonly LevelThreshold[] {
  return LEVEL_THRESHOLDS
}
