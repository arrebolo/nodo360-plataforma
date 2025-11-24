'use client'

import { useEffect, useState } from 'react'
import { Award, Lock } from 'lucide-react'

interface Badge {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface UserBadge {
  id: string
  unlockedAt: string
  badge: Badge
}

interface BadgeDisplayProps {
  variant?: 'grid' | 'carousel' | 'compact'
  showLocked?: boolean
  limit?: number
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500'
}

const RARITY_TEXT = {
  common: 'text-gray-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-yellow-600'
}

export default function BadgeDisplay({
  variant = 'grid',
  showLocked = false,
  limit
}: BadgeDisplayProps) {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/gamification/stats')
      const data = await response.json()

      if (data.badges) {
        const badgesToShow = limit ? data.badges.slice(0, limit) : data.badges
        setBadges(badgesToShow)
      }
    } catch (error) {
      console.error('[BadgeDisplay] Error fetching badges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        {variant === 'compact' ? (
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 bg-gray-200 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 bg-gray-100 rounded-xl h-32" />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Aún no tienes badges
        </h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto">
          Completa lecciones y cursos para desbloquear badges y ganar XP extra
        </p>
      </div>
    )
  }

  // Variante compacta (para mostrar pocos badges)
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map(userBadge => (
          <div
            key={userBadge.id}
            className="group relative"
            title={userBadge.badge.title}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              bg-gradient-to-br ${RARITY_COLORS[userBadge.badge.rarity]}
              shadow-md hover:shadow-xl transition-all cursor-pointer
              transform hover:scale-110
            `}>
              <span className="text-2xl">{userBadge.badge.icon}</span>
            </div>

            {/* Tooltip */}
            <div className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              bg-gray-900 text-white text-xs rounded-lg py-2 px-3
              opacity-0 group-hover:opacity-100 pointer-events-none
              transition-opacity whitespace-nowrap z-10
            ">
              <p className="font-semibold">{userBadge.badge.title}</p>
              <p className="text-gray-300 text-xs capitalize">{userBadge.badge.rarity}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                border-l-4 border-l-transparent
                border-r-4 border-r-transparent
                border-t-4 border-t-gray-900"
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Variante carousel (horizontal scrollable)
  if (variant === 'carousel') {
    return (
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {badges.map(userBadge => (
            <div
              key={userBadge.id}
              className="flex-shrink-0 w-48 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  bg-gradient-to-br ${RARITY_COLORS[userBadge.badge.rarity]}
                  shadow-md
                `}>
                  <span className="text-2xl">{userBadge.badge.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                    {userBadge.badge.title}
                  </h4>
                  <p className={`text-xs capitalize font-medium ${RARITY_TEXT[userBadge.badge.rarity]}`}>
                    {userBadge.badge.rarity}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {userBadge.badge.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {new Date(userBadge.unlockedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Variante grid (por defecto)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {badges.map(userBadge => (
        <div
          key={userBadge.id}
          className="group bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-3">
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
              bg-gradient-to-br ${RARITY_COLORS[userBadge.badge.rarity]}
              shadow-md group-hover:shadow-xl transition-shadow
              transform group-hover:scale-105 transition-transform
            `}>
              <span className="text-3xl">{userBadge.badge.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 mb-1">
                {userBadge.badge.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className={`
                  text-xs font-semibold capitalize px-2 py-0.5 rounded-full
                  ${userBadge.badge.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-100 to-orange-100' : ''}
                  ${userBadge.badge.rarity === 'epic' ? 'bg-purple-100' : ''}
                  ${userBadge.badge.rarity === 'rare' ? 'bg-blue-100' : ''}
                  ${userBadge.badge.rarity === 'common' ? 'bg-gray-100' : ''}
                  ${RARITY_TEXT[userBadge.badge.rarity]}
                `}>
                  {userBadge.badge.rarity}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {userBadge.badge.category}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {userBadge.badge.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Desbloqueado el {new Date(userBadge.unlockedAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Componente para mostrar badge bloqueado
export function LockedBadge({ badge }: { badge: Badge }) {
  return (
    <div className="group bg-gray-50 rounded-xl p-5 border border-gray-200 opacity-60">
      <div className="flex items-start gap-4 mb-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-200 relative">
          <span className="text-3xl filter grayscale opacity-40">{badge.icon}</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <div>
          <h4 className="font-bold text-gray-600 mb-1">{badge.title}</h4>
          <span className="text-xs text-gray-500 capitalize">{badge.rarity}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-2">{badge.description}</p>
      <p className="text-xs text-gray-400">🔒 Badge bloqueado</p>
    </div>
  )
}
