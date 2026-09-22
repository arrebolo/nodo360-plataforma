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
 * ELIMINADA: calculateLevel(totalXP, rules) — formula lineal floor(xp/100)+1.
 *
 * La introdujo el PR #36 ("Fix/unify level formula", 21/01/2026), que unifico
 * esta funcion y dejo intactas LEVEL_THRESHOLDS, calculateLevelFromXP,
 * getLevelName y getXPProgress, en este mismo archivo. Resultado: dos formulas
 * conviviendo en TypeScript y una tercera en la base de datos.
 *
 * Ademas acotaba con rules.max_level, y system_settings.level_rules no trae esa
 * clave, asi que el `|| 100` la dejaba en 100 en lugar de en 10: de ahi salian
 * niveles como el 47.
 *
 * La unica fuente de verdad son ahora los umbrales: en la base de datos, tabla
 * level_thresholds (migracion 039), y aqui LEVEL_THRESHOLDS, que debe coincidir
 * con ella. La comprobacion 039-comprobar.sql verifica que no se separen.
 *
 * Quien necesite nivel y XP restante usa getXPProgress(totalXP).
 */

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
