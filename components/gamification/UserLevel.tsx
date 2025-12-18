// components/gamification/UserLevel.tsx
import React from 'react'
import { getLevelFromXp } from '@/lib/gamification/leveling'

interface UserLevelProps {
  // XP total del usuario (la suma de todo lo que ha ganado)
  totalXp: number
}

export function UserLevel({ totalXp }: UserLevelProps) {
  const { level, xpIntoLevel, xpToNextLevel, progressPct } = getLevelFromXp(totalXp)

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-500 p-5 shadow-lg">
      <div className="text-sm font-semibold text-violet-100">Tu Nivel</div>

      <div className="mt-1 text-3xl font-bold text-white">
        Nivel {level}
      </div>

      <div className="mt-1 text-xs text-violet-100/80">
        {totalXp} XP totales · {xpToNextLevel} XP para el siguiente nivel
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-violet-100/80">
        <span>Progreso del nivel</span>
        <span>{progressPct.toFixed(0)}%</span>
      </div>

      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-violet-900/60">
        <div
          className="h-full rounded-full bg-white/90"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-2 text-[11px] text-violet-100/70">
        XP en este nivel: {xpIntoLevel}/{100}
      </div>
    </div>
  )
}

export default UserLevel
