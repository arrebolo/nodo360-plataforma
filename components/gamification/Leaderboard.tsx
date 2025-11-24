'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  position: number
  userId: string
  name: string
  email: string
  totalXp: number
  level: number
  totalBadges: number
  currentStreak: number
}

interface LeaderboardProps {
  limit?: number
  showCurrentUser?: boolean
  variant?: 'full' | 'compact'
}

export default function Leaderboard({
  limit = 10,
  showCurrentUser = true,
  variant = 'full'
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [limit])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/gamification/leaderboard')
      const data = await response.json()

      if (data.leaderboard) {
        const limitedLeaderboard = data.leaderboard.slice(0, limit)
        setLeaderboard(limitedLeaderboard)
      }

      // Obtener posición del usuario actual
      if (showCurrentUser) {
        const statsResponse = await fetch('/api/gamification/stats')
        const statsData = await statsResponse.json()
        if (statsData.leaderboardPosition) {
          setCurrentUserPosition(statsData.leaderboardPosition)
        }
      }
    } catch (error) {
      console.error('[Leaderboard] Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-20 h-3 bg-gray-200 rounded" />
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Leaderboard vacío
        </h3>
        <p className="text-gray-600 text-sm">
          Sé el primero en aparecer en el ranking
        </p>
      </div>
    )
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />
      default:
        return null
    }
  }

  const getPositionBadge = (position: number) => {
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"

    switch (position) {
      case 1:
        return `${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg`
      case 2:
        return `${baseClasses} bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md`
      case 3:
        return `${baseClasses} bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  // Variante compacta
  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className={getPositionBadge(entry.position)}>
              {entry.position <= 3 ? getPositionIcon(entry.position) : entry.position}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {entry.name}
              </p>
              <p className="text-xs text-gray-500">Nivel {entry.level}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-gray-900">
                {entry.totalXp.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">XP</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Variante completa
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-5">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
            <p className="text-white/80 text-sm">Top {limit} estudiantes</p>
          </div>
        </div>
      </div>

      {/* Current User Position (si no está en top) */}
      {showCurrentUser && currentUserPosition && currentUserPosition > limit && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-900">
              Tu posición: <span className="font-bold">#{currentUserPosition}</span>
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-100">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.userId}
            className={`
              flex items-center gap-4 px-6 py-4 transition-colors
              ${index === 0 ? 'bg-yellow-50/50' : ''}
              ${index === 1 ? 'bg-gray-50/50' : ''}
              ${index === 2 ? 'bg-orange-50/50' : ''}
              hover:bg-gray-50
            `}
          >
            {/* Position */}
            <div className="flex items-center gap-3 w-16">
              <div className={getPositionBadge(entry.position)}>
                {entry.position <= 3 ? (
                  getPositionIcon(entry.position)
                ) : (
                  <span>{entry.position}</span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {entry.name}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">
                  Nivel {entry.level}
                </span>
                {entry.totalBadges > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {entry.totalBadges} badges
                    </span>
                  </>
                )}
                {entry.currentStreak > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      🔥 {entry.currentStreak} días
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* XP */}
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {entry.totalXp.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">XP</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Actualizado en tiempo real • Completa lecciones para subir de posición
        </p>
      </div>
    </div>
  )
}

// Componente de podio (top 3)
export function LeaderboardPodium() {
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopThree()
  }, [])

  const fetchTopThree = async () => {
    try {
      const response = await fetch('/api/gamification/leaderboard')
      const data = await response.json()

      if (data.leaderboard) {
        setTopThree(data.leaderboard.slice(0, 3))
      }
    } catch (error) {
      console.error('[Podium] Error fetching top 3:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || topThree.length === 0) {
    return null
  }

  // Reordenar para podio visual: 2º, 1º, 3º
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean)

  return (
    <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-8 text-white">
      <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
        <Trophy className="w-7 h-7" />
        Top 3 de la Semana
      </h2>

      <div className="flex items-end justify-center gap-4">
        {podiumOrder.map((entry, visualIndex) => {
          if (!entry) return null

          // Posición real
          const actualPosition = entry.position
          const heights = ['h-32', 'h-40', 'h-28'] // 2º más bajo, 1º más alto, 3º el más bajo

          return (
            <div key={entry.userId} className="flex flex-col items-center">
              {/* Avatar/Position */}
              <div className={`
                mb-4 rounded-full flex items-center justify-center
                ${actualPosition === 1 ? 'w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-2xl' : ''}
                ${actualPosition === 2 ? 'w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-400 shadow-lg' : ''}
                ${actualPosition === 3 ? 'w-14 h-14 bg-gradient-to-br from-orange-300 to-orange-500 shadow-lg' : ''}
              `}>
                {actualPosition === 1 && <Trophy className="w-10 h-10 text-white" />}
                {actualPosition === 2 && <Medal className="w-8 h-8 text-white" />}
                {actualPosition === 3 && <Medal className="w-7 h-7 text-white" />}
              </div>

              {/* Podio */}
              <div className={`
                ${heights[visualIndex]} w-32 rounded-t-2xl
                flex flex-col items-center justify-start pt-4
                ${actualPosition === 1 ? 'bg-gradient-to-b from-yellow-400/30 to-yellow-500/30 border-2 border-yellow-300' : ''}
                ${actualPosition === 2 ? 'bg-white/10 border-2 border-white/30' : ''}
                ${actualPosition === 3 ? 'bg-orange-400/20 border-2 border-orange-300/50' : ''}
              `}>
                <span className={`
                  text-4xl font-bold mb-2
                  ${actualPosition === 1 ? 'text-yellow-300' : 'text-white'}
                `}>
                  #{actualPosition}
                </span>
                <p className="font-bold text-center text-sm px-2 line-clamp-1">
                  {entry.name}
                </p>
                <p className="text-xs opacity-90 mt-1">Nivel {entry.level}</p>
                <p className="text-sm font-bold mt-2">
                  {entry.totalXp.toLocaleString()} XP
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
