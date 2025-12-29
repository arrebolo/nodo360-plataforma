import type { LevelRules } from '@/lib/settings/defaults'

/**
 * Calcula el nivel y el XP restante para el siguiente nivel,
 * usando una progresión exponencial coherente con tu UI:
 * XP_requerido(level) = xp_base * (xp_multiplier ^ (level - 1))
 *
 * totalXP = XP total acumulado del usuario.
 */
export function calculateLevel(totalXP: number, rules: LevelRules) {
  const safeXP = Number.isFinite(totalXP) ? Math.max(0, totalXP) : 0
  const maxLevel = Math.max(1, Math.floor(rules.max_level || 1))
  const xpBase = Math.max(1, Math.floor(rules.xp_base || 1))
  const mult = Math.max(1, Number.isFinite(rules.xp_multiplier) ? rules.xp_multiplier : 1)

  const xpForNext = (level: number) =>
    Math.floor(xpBase * Math.pow(mult, level - 1))

  let level = 1
  let remaining = safeXP

  while (level < maxLevel) {
    const need = xpForNext(level)
    if (remaining < need) break
    remaining -= need
    level += 1
  }

  const xpToNextLevel =
    level >= maxLevel ? 0 : Math.max(0, xpForNext(level) - remaining)

  return {
    level,
    xpToNextLevel
  }
}
