'use client'

import { useBadgeToast } from '@/components/gamification/BadgeProvider'
import type { BadgeData } from '@/components/gamification/BadgeToast'

/**
 * Hook para mostrar notificaciones de badges ganados.
 *
 * Uso:
 * ```tsx
 * const { notifyBadges } = useBadgeNotification()
 *
 * // Después de llamar a la API:
 * if (data.awardedBadges?.length > 0) {
 *   notifyBadges(data.awardedBadges)
 * }
 * ```
 */
export function useBadgeNotification() {
  const { showBadge, showBadges } = useBadgeToast()

  /**
   * Muestra notificaciones para múltiples badges (en cola)
   */
  const notifyBadges = (
    badges:
      | Array<{
          id: string
          title?: string
          name?: string
          slug?: string
          description?: string | null
          rarity?: string | null
          xpAwarded?: number
          xp_reward?: number
          icon?: string | null
          icon_url?: string | null
        }>
      | undefined
      | null
  ) => {
    if (!badges || badges.length === 0) return

    // Normalizar los datos de badges (la API puede usar diferentes nombres de campos)
    const normalizedBadges: BadgeData[] = badges.map((b) => ({
      id: b.id,
      title: b.title || b.name || 'Badge',
      slug: b.slug,
      description: b.description,
      rarity: b.rarity,
      xpAwarded: b.xpAwarded || b.xp_reward || 0,
      icon: b.icon || b.icon_url,
    }))

    showBadges(normalizedBadges)
  }

  /**
   * Muestra notificación para un solo badge
   */
  const notifyBadge = (badge: {
    id: string
    title?: string
    name?: string
    slug?: string
    description?: string | null
    rarity?: string | null
    xpAwarded?: number
    xp_reward?: number
    icon?: string | null
    icon_url?: string | null
  }) => {
    const normalized: BadgeData = {
      id: badge.id,
      title: badge.title || badge.name || 'Badge',
      slug: badge.slug,
      description: badge.description,
      rarity: badge.rarity,
      xpAwarded: badge.xpAwarded || badge.xp_reward || 0,
      icon: badge.icon || badge.icon_url,
    }

    showBadge(normalized)
  }

  return { notifyBadge, notifyBadges }
}
