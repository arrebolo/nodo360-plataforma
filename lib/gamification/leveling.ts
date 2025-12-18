// lib/gamification/leveling.ts

/**
 * Modelo lineal:
 * - Cada nivel requiere 100 XP.
 * - Nivel 1 = 0–99 XP
 * - Nivel 2 = 100–199 XP
 * - Nivel 3 = 200–299 XP
 * etc.
 */
export const XP_PER_LEVEL = 100

export function getLevelFromXp(totalXp: number) {
  // saneo básico
  if (!Number.isFinite(totalXp) || totalXp < 0) totalXp = 0

  const level = Math.max(1, Math.floor(totalXp / XP_PER_LEVEL) + 1)
  const xpIntoLevel = totalXp % XP_PER_LEVEL
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel
  const progressPct = (xpIntoLevel / XP_PER_LEVEL) * 100

  return {
    level,
    xpIntoLevel,
    xpToNextLevel,
    progressPct,
  }
}
