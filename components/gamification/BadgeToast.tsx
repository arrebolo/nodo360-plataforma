'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'

export interface BadgeData {
  id: string
  title: string
  slug?: string
  description?: string | null
  rarity?: string | null
  xpAwarded?: number
  icon?: string | null
}

interface BadgeToastProps {
  badge: BadgeData
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

// Obtener icono del badge
function getIcon(badge: BadgeData): string {
  if (badge.icon && !badge.icon.includes('&#')) {
    return badge.icon
  }
  // Iconos por defecto según nombre/slug
  const name = (badge.title || badge.slug || '').toLowerCase()
  if (name.includes('lección') || name.includes('leccion') || name.includes('lesson')) return '📖'
  if (name.includes('curso') || name.includes('course')) return '🎓'
  if (name.includes('nivel') || name.includes('level')) return '⭐'
  if (name.includes('racha') || name.includes('streak')) return '🔥'
  if (name.includes('quiz')) return '✅'
  if (name.includes('certificado') || name.includes('certificate')) return '📜'
  return '🏅'
}

// Obtener estilo por rareza
function getRarityStyle(rarity: string | null | undefined) {
  const r = rarity || 'common'
  const styles: Record<string, { gradient: string; glow: string; label: string }> = {
    common: {
      gradient: 'from-slate-500 to-slate-600',
      glow: 'shadow-slate-500/30',
      label: 'Común',
    },
    rare: {
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/40',
      label: 'Raro',
    },
    epic: {
      gradient: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/40',
      label: 'Épico',
    },
    legendary: {
      gradient: 'from-yellow-500 to-orange-500',
      glow: 'shadow-yellow-500/50',
      label: 'Legendario',
    },
  }
  return styles[r] || styles.common
}

export function BadgeToast({
  badge,
  onClose,
  autoClose = true,
  autoCloseDelay = 6000,
}: BadgeToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Trigger entrada con delay para animación
    const enterTimer = setTimeout(() => {
      setIsVisible(true)

      // Disparar confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b35', '#f7931a', '#ffd700', '#00ff88'],
      })
    }, 50)

    // Auto-cerrar
    let closeTimer: NodeJS.Timeout
    if (autoClose) {
      closeTimer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)
    }

    return () => {
      clearTimeout(enterTimer)
      if (closeTimer) clearTimeout(closeTimer)
    }
  }, [mounted, autoClose, autoCloseDelay])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const icon = getIcon(badge)
  const rarityStyle = getRarityStyle(badge.rarity)

  if (!mounted) return null

  const content = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-dark-surface border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center transform transition-all duration-300 shadow-2xl ${rarityStyle.glow} ${
          isVisible && !isClosing
            ? 'scale-100 translate-y-0'
            : 'scale-90 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${rarityStyle.gradient} opacity-20 blur-xl`}
        />

        {/* Contenido */}
        <div className="relative">
          {/* Confetti emoji decorativo */}
          <div className="absolute -top-2 -left-2 text-2xl animate-bounce">
            🎉
          </div>
          <div
            className="absolute -top-2 -right-2 text-2xl animate-bounce"
            style={{ animationDelay: '0.15s' }}
          >
            ✨
          </div>

          {/* Título */}
          <p className="text-brand-light text-sm font-medium uppercase tracking-wider mb-4">
            ¡Nuevo Badge Desbloqueado!
          </p>

          {/* Icono del badge */}
          <div
            className={`w-28 h-28 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${rarityStyle.gradient} p-1 shadow-lg ${rarityStyle.glow}`}
          >
            <div className="w-full h-full rounded-xl bg-dark-surface flex items-center justify-center">
              <span className="text-6xl">{icon}</span>
            </div>
          </div>

          {/* Nombre del badge */}
          <h3 className="text-2xl font-bold text-white mb-2">{badge.title}</h3>

          {/* Rareza badge */}
          <div className="flex justify-center mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${rarityStyle.gradient} text-white`}
            >
              {rarityStyle.label}
            </span>
          </div>

          {/* Descripción */}
          {badge.description && (
            <p className="text-white/60 text-sm mb-4">{badge.description}</p>
          )}

          {/* XP ganado */}
          {badge.xpAwarded && badge.xpAwarded > 0 && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-light/20 rounded-full mb-6 border border-brand-light/30">
              <span className="text-xl">⚡</span>
              <span className="text-brand-light font-bold text-lg">
                +{badge.xpAwarded} XP
              </span>
            </div>
          )}

          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition-all duration-200 active:scale-95"
          >
            ¡Genial!
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
