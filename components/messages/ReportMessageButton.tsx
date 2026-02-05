'use client'

import { useState } from 'react'
import { Flag, X, AlertTriangle, CheckCircle } from 'lucide-react'

interface ReportMessageButtonProps {
  conversationId: string
  messageId?: string
  reportedUserId: string
  onReportSent?: () => void
  variant?: 'icon' | 'text'
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam o mensajes repetitivos', description: 'Mensajes no deseados o repetidos' },
  { value: 'external_promo', label: 'Promoción de enlaces externos', description: 'Links a sitios externos sospechosos' },
  { value: 'trading_promo', label: 'Promoción de trading/señales', description: 'Ofertas de señales de trading o grupos de inversión' },
  { value: 'scam', label: 'Posible estafa', description: 'Intentos de fraude o phishing' },
  { value: 'harassment', label: 'Acoso o comportamiento abusivo', description: 'Mensajes ofensivos o amenazantes' },
  { value: 'inappropriate', label: 'Contenido inapropiado', description: 'Contenido que viola las normas de la comunidad' },
  { value: 'other', label: 'Otro motivo', description: 'Cualquier otro problema no listado' }
] as const

type ReportReason = typeof REPORT_REASONS[number]['value']

export function ReportMessageButton({
  conversationId,
  messageId,
  reportedUserId,
  onReportSent,
  variant = 'icon'
}: ReportMessageButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      setError('Selecciona un motivo para el reporte')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/messages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messageId: messageId || null,
          reportedUserId,
          reason,
          details: details.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar reporte')
      }

      setSuccess(true)
      onReportSent?.()

      // Reset after showing success
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setReason('')
        setDetails('')
      }, 2500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el reporte')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false)
      setError('')
      setReason('')
      setDetails('')
    }
  }

  // Success state (shown briefly after report)
  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle size={16} />
        <span>Reporte enviado</span>
      </div>
    )
  }

  return (
    <>
      {/* Trigger Button */}
      {variant === 'icon' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="text-white/40 hover:text-red-400 transition-colors p-1 rounded"
          title="Reportar mensaje"
          aria-label="Reportar mensaje"
        >
          <Flag size={14} />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-white/60 hover:text-red-400 transition-colors text-sm"
        >
          <Flag size={14} />
          <span>Reportar</span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <div
            className="bg-[#0d1117] border border-white/10 rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Reportar mensaje</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-white/40 hover:text-white transition-colors p-1 rounded disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  ¿Por qué reportas este contenido?
                </label>
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value as ReportReason)
                    setError('')
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-brand-light focus:outline-none focus:ring-1 focus:ring-brand-light/50 disabled:opacity-50"
                >
                  <option value="" className="bg-[#0d1117]">Selecciona un motivo</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value} className="bg-[#0d1117]">
                      {r.label}
                    </option>
                  ))}
                </select>
                {reason && (
                  <p className="mt-1.5 text-xs text-white/50">
                    {REPORT_REASONS.find(r => r.value === reason)?.description}
                  </p>
                )}
              </div>

              {/* Details (optional) */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Detalles adicionales <span className="text-white/40">(opcional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Describe brevemente el problema..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 resize-none h-24 focus:border-brand-light focus:outline-none focus:ring-1 focus:ring-brand-light/50 disabled:opacity-50"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-white/40 text-right">
                  {details.length}/500
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Info */}
              <p className="text-xs text-white/40">
                Tu reporte será revisado por nuestro equipo de moderación.
                No compartiremos tu identidad con el usuario reportado.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-white/10">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-white/80 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !reason}
                className="flex-1 px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ReportMessageButton
