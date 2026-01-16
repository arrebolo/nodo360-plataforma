'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  userId: string
}

export default function FeedbackModal({ isOpen, onClose, userEmail, userId }: FeedbackModalProps) {
  const pathname = usePathname()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          pageUrl: pathname,
          message: message.trim()
        })
      })

      if (res.ok) {
        setSubmitStatus('success')
        setMessage('')
        // Cerrar modal despues de 2 segundos
        setTimeout(() => {
          onClose()
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error enviando feedback:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Enviar Feedback</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {submitStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Gracias por tu feedback!</h3>
              <p className="text-gray-400 text-sm">Tu opinion nos ayuda a mejorar Nodo360.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Info del usuario */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Enviando como:</p>
                <p className="text-sm text-white">{userEmail}</p>
                <p className="text-xs text-gray-500 mt-1">Pagina: {pathname}</p>
              </div>

              {/* Textarea */}
              <div className="mb-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-300 mb-2">
                  Que te gustaria decirnos?
                </label>
                <textarea
                  id="feedback"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuentanos que podemos mejorar, si encontraste algun problema, o cualquier sugerencia..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f7931a] focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Error message */}
              {submitStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Error al enviar. Intentalo de nuevo.
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Tu feedback es anonimo y nos ayuda a construir una mejor plataforma.
          </p>
        </div>
      </div>
    </div>
  )
}
