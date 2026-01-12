'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Ban, Trash2, Rocket, Loader2 } from 'lucide-react'

type AdminAction = 'validate' | 'reject_validation' | 'veto' | 'cancel' | 'implement'

interface AdminActionButtonsProps {
  proposalId: string
  actions: string[]
}

const ACTION_CONFIG: Record<AdminAction, {
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  hoverColor: string
  requiresReason: boolean
  confirmMessage: string
}> = {
  validate: {
    label: 'Aprobar',
    icon: <Check className="w-4 h-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    hoverColor: 'hover:bg-green-500/30',
    requiresReason: false,
    confirmMessage: '¿Aprobar esta propuesta para votación?'
  },
  reject_validation: {
    label: 'Rechazar',
    icon: <X className="w-4 h-4" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    hoverColor: 'hover:bg-red-500/30',
    requiresReason: true,
    confirmMessage: '¿Rechazar esta propuesta? Volverá a borrador.'
  },
  veto: {
    label: 'Vetar',
    icon: <Ban className="w-4 h-4" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    hoverColor: 'hover:bg-orange-500/30',
    requiresReason: true,
    confirmMessage: '¿Vetar esta propuesta? Esta acción es definitiva.'
  },
  cancel: {
    label: 'Cancelar',
    icon: <Trash2 className="w-4 h-4" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    hoverColor: 'hover:bg-yellow-500/30',
    requiresReason: true,
    confirmMessage: '¿Cancelar esta votación?'
  },
  implement: {
    label: 'Implementar',
    icon: <Rocket className="w-4 h-4" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    hoverColor: 'hover:bg-purple-500/30',
    requiresReason: false,
    confirmMessage: '¿Marcar como implementada?'
  }
}

export function AdminActionButtons({ proposalId, actions }: AdminActionButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<AdminAction | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleActionClick = (action: AdminAction) => {
    const config = ACTION_CONFIG[action]
    setCurrentAction(action)
    setReason('')
    setError(null)

    if (config.requiresReason) {
      setShowModal(true)
    } else {
      // Confirmar directamente
      if (confirm(config.confirmMessage)) {
        executeAction(action, '')
      }
    }
  }

  const executeAction = async (action: AdminAction, actionReason: string) => {
    setLoading(action)
    setError(null)

    try {
      const response = await fetch('/api/governance/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          action,
          reason: actionReason || undefined,
          isPublic: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar acción')
      }

      setShowModal(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(null)
    }
  }

  const handleModalSubmit = () => {
    if (!currentAction) return

    const config = ACTION_CONFIG[currentAction]
    if (config.requiresReason && !reason.trim()) {
      setError('Debes proporcionar una razón')
      return
    }

    executeAction(currentAction, reason)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {actions.map((action) => {
          const config = ACTION_CONFIG[action as AdminAction]
          if (!config) return null

          return (
            <button
              key={action}
              onClick={() => handleActionClick(action as AdminAction)}
              disabled={loading !== null}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${config.bgColor} ${config.color} ${config.hoverColor}
              `}
              title={config.label}
            >
              {loading === action ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                config.icon
              )}
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          )
        })}
      </div>

      {/* Modal para razón */}
      {showModal && currentAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-secondary rounded-xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">
              {ACTION_CONFIG[currentAction].label} Propuesta
            </h3>
            <p className="text-white/60 text-sm mb-4">
              {ACTION_CONFIG[currentAction].confirmMessage}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Razón {ACTION_CONFIG[currentAction].requiresReason ? '(requerida)' : '(opcional)'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explica la razón de esta acción..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading !== null}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={loading !== null}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${ACTION_CONFIG[currentAction].bgColor} ${ACTION_CONFIG[currentAction].color}
                  ${ACTION_CONFIG[currentAction].hoverColor}
                `}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  ACTION_CONFIG[currentAction].icon
                )}
                {ACTION_CONFIG[currentAction].label}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

