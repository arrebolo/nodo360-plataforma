'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  initialValue: boolean
  userRole: string
  onUpdate?: () => void
}

export default function BetaToggle({ userId, initialValue, userRole, onUpdate }: Props) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  // Admins siempre tienen acceso, no mostrar toggle
  if (userRole === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
        <Check size={12} />
        Siempre
      </span>
    )
  }

  async function toggleBeta() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, enabled: !enabled }),
      })

      const data = await res.json()

      if (data.success) {
        setEnabled(!enabled)
        onUpdate?.()
      } else {
        alert(data.error || 'Error al cambiar acceso beta')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar acceso beta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleBeta}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-green-600' : 'bg-gray-600'
      } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      title={enabled ? 'Desactivar acceso beta' : 'Activar acceso beta'}
    >
      {isLoading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={14} className="animate-spin text-white" />
        </span>
      ) : (
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      )}
    </button>
  )
}
