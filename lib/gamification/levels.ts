import type { LevelRules } from '@/lib/settings/defaults'

/**
 * Calcula el nivel y el XP restante para el siguiente nivel.
 * Fórmula lineal: 1 nivel cada 100 XP
 *
 * Nivel = floor(totalXP / 100) + 1
 * XP para siguiente = 100 - (totalXP % 100)
 *
 * @param totalXP - XP total acumulado del usuario
 * @param rules - Reglas de nivel (solo se usa max_level)
 */
export function calculateLevel(totalXP: number, rules: LevelRules) {
  const safeXP = Number.isFinite(totalXP) ? Math.max(0, totalXP) : 0
  const maxLevel = Math.max(1, Math.floor(rules.max_level || 100))

  // Fórmula lineal: 1 nivel cada 100 XP
  const level = Math.min(maxLevel, Math.max(1, Math.floor(safeXP / 100) + 1))

  // XP para siguiente nivel siempre es 100 (excepto en nivel máximo)
  const xpInCurrentLevel = safeXP % 100
  const xpToNextLevel = level >= maxLevel ? 0 : 100 - xpInCurrentLevel

  return {
    level,
    xpToNextLevel
  }
}


