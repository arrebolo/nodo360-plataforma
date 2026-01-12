'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdjustXPForm({
  userId,
  currentXP
}: {
  userId: string
  currentXP: number
}) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !reason) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/xp/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseInt(amount),
          reason
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al ajustar XP')
      }

      setSuccess(true)
      setAmount('')
      setReason('')
      router.refresh()

      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const previewNewXP = amount ? Math.max(0, currentXP + parseInt(amount)) : currentXP

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-white/60 mb-2 block">
          XP Actual: <span className="text-white font-medium">{currentXP}</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Cantidad (+/-)"
          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-light/50"
        />
        <p className="text-xs text-white/50 mt-1">
          Usa números negativos para restar XP
        </p>
        {amount && (
          <p className="text-xs text-emerald-400 mt-1">
            Nuevo XP: {previewNewXP}
          </p>
        )}
      </div>

      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Razón del ajuste (ej: Corrección manual)"
        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-light/50"
      />

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {success && (
        <p className="text-sm text-emerald-400">✓ XP ajustado exitosamente</p>
      )}

      <button
        type="submit"
        disabled={loading || !amount || !reason}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors font-medium"
      >
        {loading ? 'Aplicando...' : 'Ajustar XP'}
      </button>
    </form>
  )
}
