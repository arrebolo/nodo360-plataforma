'use client'

/**
 * LessonLockIndicator Component
 *
 * Shows lock status for individual lessons
 */

import { Lock, PlayCircle, CheckCircle } from 'lucide-react'

interface LessonLockIndicatorProps {
  isLocked: boolean
  isCompleted?: boolean
  isInProgress?: boolean
  previousLessonTitle?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LessonLockIndicator({
  isLocked,
  isCompleted = false,
  isInProgress = false,
  previousLessonTitle,
  size = 'md',
}: LessonLockIndicatorProps) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (isCompleted) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <CheckCircle className={`${iconSizes[size]} text-green-400`} />
        {size !== 'sm' && <span className="text-sm text-green-400 font-medium">Completada</span>}
      </div>
    )
  }

  if (isInProgress) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <PlayCircle className={`${iconSizes[size]} text-brand-light`} />
        {size !== 'sm' && <span className="text-sm text-brand-light font-medium">En progreso</span>}
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="inline-flex items-center gap-1.5" title={previousLessonTitle ? `Completa: ${previousLessonTitle}` : 'Lección bloqueada'}>
        <Lock className={`${iconSizes[size]} text-white/40`} />
        {size !== 'sm' && <span className="text-sm text-white/40 font-medium">Bloqueada</span>}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <PlayCircle className={`${iconSizes[size]} text-white/70`} />
      {size !== 'sm' && <span className="text-sm text-white/70 font-medium">Disponible</span>}
    </div>
  )
}

/**
 * LessonLockMessage Component
 *
 * Detailed message for locked lessons
 */

export function LessonLockMessage({
  previousLessonTitle,
  onGoToPrevious,
}: {
  previousLessonTitle: string
  onGoToPrevious?: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto mt-8 p-8 bg-white/5 border-2 border-white/10 rounded-xl text-center">
      <div className="inline-block p-4 bg-brand-light/20 rounded-2xl mb-4">
        <Lock className="w-12 h-12 text-brand-light" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">Lección Bloqueada</h3>
      <p className="text-lg text-white/70 mb-6">
        Completa la lección anterior para desbloquear esta lección.
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-500/30 mb-6">
        <PlayCircle className="w-5 h-5 text-blue-400" />
        <span className="text-blue-200">
          Lección requerida: <span className="font-semibold">{previousLessonTitle}</span>
        </span>
      </div>

      {onGoToPrevious && (
        <button
          onClick={onGoToPrevious}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white font-semibold hover:shadow-lg hover:shadow-brand-light/50 transition-all"
        >
          Ir a Lección Anterior
        </button>
      )}
    </div>
  )
}


