'use client'

import { useEffect, useState } from 'react'
import { Trophy, Zap, Flame } from 'lucide-react'

interface GamificationStats {
  total_xp: number
  current_level: number
  xp_to_next_level: number
  total_badges: number
  current_streak: number
  longest_streak: number
}

interface UserLevelProps {
  variant?: 'default' | 'compact' | 'card'
}

export default function UserLevel({ variant = 'default' }: UserLevelProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/gamification/stats')
      const data = await response.json()

      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('[UserLevel] Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        {variant === 'compact' ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        ) : (
          <div className="p-4 bg-gray-100 rounded-xl">
            <div className="w-32 h-6 bg-gray-200 rounded mb-2" />
            <div className="w-full h-3 bg-gray-200 rounded" />
          </div>
        )}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // Calcular progreso del nivel actual
  const xpForCurrentLevel = calculateXpForLevel(stats.current_level)
  const xpInCurrentLevel = stats.total_xp - calculateTotalXpForLevel(stats.current_level - 1)
  const progressPercentage = Math.round((xpInCurrentLevel / xpForCurrentLevel) * 100)

  // Variante compacta (para header/navbar)
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        {/* Nivel */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white font-semibold text-sm">
          <Trophy className="w-4 h-4" />
          <span>Nivel {stats.current_level}</span>
        </div>

        {/* XP */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="font-medium">{stats.total_xp.toLocaleString()} XP</span>
        </div>

        {/* Racha */}
        {stats.current_streak > 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-600">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{stats.current_streak} días</span>
          </div>
        )}
      </div>
    )
  }

  // Variante card (para dashboard/profile)
  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-6 text-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Tu Nivel</p>
              <h3 className="text-3xl font-bold">Nivel {stats.current_level}</h3>
            </div>
          </div>

          {/* Badges */}
          <div className="text-right">
            <p className="text-white/80 text-sm">Badges</p>
            <p className="text-2xl font-bold">{stats.total_badges}</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              {xpInCurrentLevel.toLocaleString()} / {xpForCurrentLevel.toLocaleString()} XP
            </span>
            <span className="text-sm font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-white/80 text-xs mt-2">
            {stats.xp_to_next_level.toLocaleString()} XP para el siguiente nivel
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          {/* Total XP */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-300" />
            <div>
              <p className="text-white/80 text-xs">Total XP</p>
              <p className="font-bold">{stats.total_xp.toLocaleString()}</p>
            </div>
          </div>

          {/* Racha actual */}
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-300" />
            <div>
              <p className="text-white/80 text-xs">Racha Actual</p>
              <p className="font-bold">{stats.current_streak} días</p>
            </div>
          </div>
        </div>

        {/* Racha más larga */}
        {stats.longest_streak > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-white/80 text-xs">Racha más larga</p>
            <p className="font-bold text-lg">{stats.longest_streak} días 🔥</p>
          </div>
        )}
      </div>
    )
  }

  // Variante default
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      {/* Level Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          {stats.current_level}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">Nivel {stats.current_level}</h4>
          <p className="text-sm text-gray-600">{stats.total_xp.toLocaleString()} XP total</p>
        </div>
        <Trophy className="w-6 h-6 text-yellow-500" />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{xpInCurrentLevel.toLocaleString()} XP</span>
          <span>{xpForCurrentLevel.toLocaleString()} XP</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {stats.xp_to_next_level.toLocaleString()} XP para nivel {stats.current_level + 1}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-500">Badges</p>
          <p className="text-lg font-bold text-gray-900">{stats.total_badges}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Racha</p>
          <p className="text-lg font-bold text-gray-900">{stats.current_streak}🔥</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Récord</p>
          <p className="text-lg font-bold text-gray-900">{stats.longest_streak}</p>
        </div>
      </div>
    </div>
  )
}

// Calcular XP requerido para un nivel específico
function calculateXpForLevel(level: number): number {
  return 100 + ((level - 1) * 50)
}

// Calcular XP total acumulado hasta un nivel
function calculateTotalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i <= level; i++) {
    total += calculateXpForLevel(i)
  }
  return total
}
