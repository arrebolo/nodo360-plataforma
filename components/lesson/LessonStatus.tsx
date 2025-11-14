'use client'

import { Lock, CheckCircle, Circle } from 'lucide-react'

interface LessonStatusProps {
  isCompleted: boolean
  isLocked: boolean
  isCurrentLesson: boolean
}

export function LessonStatus({ isCompleted, isLocked, isCurrentLesson }: LessonStatusProps) {
  if (isCompleted) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm text-green-500 font-medium">Completada</span>
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="flex items-center gap-2">
        <Lock className="w-5 h-5 text-white/30" />
        <span className="text-sm text-white/30">Bloqueada</span>
      </div>
    )
  }

  if (isCurrentLesson) {
    return (
      <div className="flex items-center gap-2">
        <Circle className="w-5 h-5 text-[#ff6b35]" />
        <span className="text-sm text-[#ff6b35] font-medium">En progreso</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Circle className="w-5 h-5 text-white/50" />
      <span className="text-sm text-white/50">Disponible</span>
    </div>
  )
}
