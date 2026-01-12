'use client'

import { Flame } from 'lucide-react'

interface StreakIndicatorProps {
  currentStreak: number
  longestStreak?: number
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  isActive = true,
  size = 'md',
  showLabel = true,
  className = '',
}: StreakIndicatorProps) {
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 gap-1',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs',
      number: 'text-sm font-semibold',
    },
    md: {
      container: 'px-3 py-1.5 gap-1.5',
      icon: 'w-4 h-4',
      text: 'text-sm',
      number: 'text-base font-bold',
    },
    lg: {
      container: 'px-4 py-2 gap-2',
      icon: 'w-5 h-5',
      text: 'text-base',
      number: 'text-xl font-bold',
    },
  }

  const s = sizeClasses[size]

  // Colores basados en la racha
  const getStreakColor = () => {
    if (!isActive || currentStreak === 0) return 'text-white/40'
    if (currentStreak >= 30) return 'text-orange-400'
    if (currentStreak >= 14) return 'text-yellow-400'
    if (currentStreak >= 7) return 'text-amber-400'
    return 'text-orange-500'
  }

  const getBgColor = () => {
    if (!isActive || currentStreak === 0) return 'bg-white/5 border-white/10'
    if (currentStreak >= 30) return 'bg-orange-500/10 border-orange-500/30'
    if (currentStreak >= 14) return 'bg-yellow-500/10 border-yellow-500/30'
    if (currentStreak >= 7) return 'bg-amber-500/10 border-amber-500/30'
    return 'bg-orange-500/10 border-orange-500/20'
  }

  return (
    <div
      className={`inline-flex items-center ${s.container} ${getBgColor()} border rounded-lg ${className}`}
    >
      <Flame className={`${s.icon} ${getStreakColor()} ${isActive && currentStreak > 0 ? 'animate-pulse' : ''}`} />
      <span className={`${s.number} ${getStreakColor()}`}>
        {currentStreak}
      </span>
      {showLabel && (
        <span className={`${s.text} text-white/60`}>
          {currentStreak === 1 ? 'día' : 'días'}
        </span>
      )}
    </div>
  )
}

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  lastActivityDate?: string | null
  className?: string
}

export function StreakCard({
  currentStreak,
  longestStreak,
  lastActivityDate,
  className = '',
}: StreakCardProps) {
  // Calcular si la racha está activa
  const isActive = (() => {
    if (!lastActivityDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastActivity = new Date(lastActivityDate)
    lastActivity.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 1
  })()

  const displayStreak = isActive ? currentStreak : 0

  return (
    <div className={`bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'text-white/40'}`} />
          <span className="text-sm font-medium text-white">Racha de estudio</span>
        </div>
        {!isActive && currentStreak > 0 && (
          <span className="text-xs text-orange-400/80 bg-orange-500/10 px-2 py-0.5 rounded">
            Perdida
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className={`text-3xl font-bold ${isActive ? 'text-orange-400' : 'text-white/40'}`}>
          {displayStreak}
        </span>
        <span className="text-white/60">
          {displayStreak === 1 ? 'día' : 'días'}
        </span>
      </div>

      <div className="flex justify-between text-xs">
        <div>
          <span className="text-white/40">Mejor racha</span>
          <p className="text-white font-medium">{longestStreak} días</p>
        </div>
        <div className="text-right">
          <span className="text-white/40">Estado</span>
          <p className={isActive ? 'text-green-400' : 'text-orange-400'}>
            {isActive ? 'Activa' : 'Inactiva'}
          </p>
        </div>
      </div>

      {!isActive && (
        <p className="text-xs text-white/50 mt-3 pt-3 border-t border-white/10">
          Completa una lección hoy para iniciar una nueva racha
        </p>
      )}
    </div>
  )
}
