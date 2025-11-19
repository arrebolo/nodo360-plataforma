'use client'

/**
 * UpgradeBanner Component
 *
 * Call-to-action banner to upgrade to premium
 */

import { Sparkles, Lock, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UpgradeBannerProps {
  lockedModulesCount?: number
  onUpgrade?: () => void
  upgradeUrl?: string
  variant?: 'default' | 'compact' | 'inline'
}

export function UpgradeBanner({
  lockedModulesCount = 3,
  onUpgrade,
  upgradeUrl = '/premium',
  variant = 'default',
}: UpgradeBannerProps) {
  if (variant === 'compact') {
    return (
      <div className="p-4 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/30 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#FFD700]" />
            <div>
              <p className="text-sm font-semibold text-white">
                {lockedModulesCount} módulos bloqueados
              </p>
              <p className="text-xs text-white/60">Desbloquea todo con Premium</p>
            </div>
          </div>
          {upgradeUrl ? (
            <Link
              href={upgradeUrl}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black text-sm font-semibold hover:shadow-lg transition-all"
            >
              Actualizar
            </Link>
          ) : (
            <button
              onClick={onUpgrade}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black text-sm font-semibold hover:shadow-lg transition-all"
            >
              Actualizar
            </button>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg">
        <Lock className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
        <p className="text-sm text-white/80 flex-1">
          Actualiza a <span className="font-semibold text-[#FFD700]">Premium</span> para desbloquear
        </p>
        {upgradeUrl ? (
          <Link
            href={upgradeUrl}
            className="px-3 py-1.5 rounded-lg bg-[#FFD700]/20 text-[#FFD700] text-xs font-semibold hover:bg-[#FFD700]/30 transition-all"
          >
            Ver Planes
          </Link>
        ) : (
          <button
            onClick={onUpgrade}
            className="px-3 py-1.5 rounded-lg bg-[#FFD700]/20 text-[#FFD700] text-xs font-semibold hover:bg-[#FFD700]/30 transition-all"
          >
            Ver Planes
          </button>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className="p-8 bg-gradient-to-r from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e] border-2 border-[#FFD700]/30 rounded-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFA500]/10 rounded-full blur-3xl -ml-32 -mb-32" />

      <div className="relative">
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">
              Desbloquea Todo el Contenido
            </h3>
            <p className="text-white/70 mb-6">
              Tienes {lockedModulesCount} módulos adicionales esperándote. Actualiza a premium para
              acceder a todo el contenido del curso y obtener certificados verificables.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-white/80">Acceso a todos los módulos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-white/80">Certificados verificables</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-white/80">Material descargable</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-white/80">Soporte prioritario</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              {upgradeUrl ? (
                <Link
                  href={upgradeUrl}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold hover:shadow-lg hover:shadow-[#FFD700]/50 transition-all flex items-center gap-2"
                >
                  Actualizar a Premium
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <button
                  onClick={onUpgrade}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold hover:shadow-lg hover:shadow-[#FFD700]/50 transition-all flex items-center gap-2"
                >
                  Actualizar a Premium
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <p className="text-sm text-white/60">Desde $29/mes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
