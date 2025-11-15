'use client'

import { useState, useCallback } from 'react'
import { Mail, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface NewsletterFormProps {
  variant?: 'inline' | 'card'
  showName?: boolean
  className?: string
}

export function NewsletterForm({
  variant = 'inline',
  showName = false,
  className = ''
}: NewsletterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: showName ? formData.name : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al suscribirse')
      }

      setSubmitStatus('success')
      setFormData({ email: '', name: '' })

      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000)
    } catch (error) {
      logger.error('Error subscribing to newsletter:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Error al suscribirse')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData.email, formData.name, showName])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 backdrop-blur-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-[#ff6b35]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Newsletter</h3>
            <p className="text-sm text-white/60">Recibe las últimas actualizaciones</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showName && (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
            />
          )}

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
          />

          <button
            type="submit"
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Suscribiendo...
              </>
            ) : submitStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ¡Suscrito!
              </>
            ) : (
              <>
                Suscribirse
                <Send className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              ¡Gracias por suscribirte! Revisa tu email.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorMessage || 'Error al suscribirse. Intenta de nuevo.'}
            </div>
          )}
        </form>

        <p className="mt-4 text-xs text-white/50 text-center">
          Enviamos contenido de calidad. Sin spam.
        </p>
      </div>
    )
  }

  // Inline variant
  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        {showName && (
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
          />
        )}

        <div className="flex-1 relative">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || submitStatus === 'success'}
          className="px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="hidden sm:inline">Suscribiendo...</span>
            </>
          ) : submitStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span className="hidden sm:inline">¡Suscrito!</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Suscribirse</span>
              <Send className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          ¡Gracias por suscribirte! Revisa tu email.
        </div>
      )}
      {submitStatus === 'error' && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMessage || 'Error al suscribirse. Intenta de nuevo.'}
        </div>
      )}

      {submitStatus === 'idle' && (
        <p className="mt-2 text-xs text-white/50 text-center">
          Enviamos contenido de calidad. Sin spam.
        </p>
      )}
    </div>
  )
}
