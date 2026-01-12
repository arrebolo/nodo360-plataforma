'use client'

/**
 * ModuleLockBadge Component
 *
 * Shows lock status and requirements for accessing a module
 */

import { Lock, CheckCircle, Trophy, Sparkles } from 'lucide-react'

interface ModuleLockBadgeProps {
  isLocked: boolean
  reason?: 'not_premium' | 'quiz_not_passed' | 'module_1'
  previousModuleTitle?: string
  requiredScore?: number
  className?: string
}

export function ModuleLockBadge({
  isLocked,
  reason,
  previousModuleTitle,
  requiredScore = 70,
  className = '',
}: ModuleLockBadgeProps) {
  if (!isLocked) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 ${className}`}>
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-sm font-semibold text-green-400">Desbloqueado</span>
      </div>
    )
  }

  if (reason === 'not_premium') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/20 border border-gold/30 ${className}`}>
        <Sparkles className="w-4 h-4 text-gold" />
        <span className="text-sm font-semibold text-gold">Premium</span>
      </div>
    )
  }

  if (reason === 'quiz_not_passed') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-light/20 border border-brand-light/30 ${className}`}>
        <Trophy className="w-4 h-4 text-brand-light" />
        <span className="text-sm font-semibold text-brand-light">
          Requiere aprobar quiz anterior ({requiredScore}%)
        </span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 ${className}`}>
      <Lock className="w-4 h-4 text-white/70" />
      <span className="text-sm font-semibold text-white/70">Bloqueado</span>
    </div>
  )
}

/**
 * ModuleLockCard Component
 *
 * Full card showing module lock status with detailed information
 */

export function ModuleLockCard({
  moduleTitle,
  reason,
  previousModuleTitle,
  onUpgrade,
}: {
  moduleTitle: string
  reason: 'not_premium' | 'quiz_not_passed'
  previousModuleTitle?: string
  onUpgrade?: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto mt-8 p-8 bg-white/5 border-2 border-white/10 rounded-xl">
      <div className="text-center">
        {/* Icon */}
        <div className="inline-block p-4 bg-gradient-to-r from-brand-light/20 to-brand/20 rounded-2xl mb-4">
          <Lock className="w-12 h-12 text-brand-light" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2">Módulo Bloqueado</h3>

        {/* Message */}
        {reason === 'not_premium' ? (
          <>
            <p className="text-lg text-white/70 mb-6">
              El módulo <span className="font-semibold text-white">{moduleTitle}</span> está
              disponible solo para miembros premium.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={onUpgrade}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-light text-black font-bold text-lg hover:shadow-lg hover:shadow-gold/50 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Actualizar a Premium
              </button>
              <p className="text-sm text-white/60">
                Accede a todos los módulos y contenido exclusivo
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg text-white/70 mb-6">
              Para desbloquear <span className="font-semibold text-white">{moduleTitle}</span>,
              debes aprobar el quiz del módulo anterior con un 70% o más.
            </p>
            {previousModuleTitle && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 mb-6">
                <Trophy className="w-5 h-5 text-blue-400" />
                <span className="text-blue-200">
                  Completa el quiz: <span className="font-semibold">{previousModuleTitle}</span>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

