'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Error al enviar el email. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Email enviado</h1>
            <p className="text-white/60 mb-6">
              Hemos enviado un enlace de recuperación a <strong className="text-white">{email}</strong>.
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <p className="text-white/40 text-sm mb-6">
              ¿No recibes el email? Revisa tu carpeta de spam o{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-[#ff6b35] hover:underline"
              >
                intenta de nuevo
              </button>
            </p>
            <Link
              href="/login"
              className="block w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all"
            >
              Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Iniciar Sesión
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 border border-[#ff6b35]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#ff6b35]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-white/60">
            No te preocupes, te enviaremos instrucciones para restablecerla
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email de tu cuenta
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </button>
          </form>

          {/* Help */}
          <p className="mt-6 text-center text-white/50 text-sm">
            ¿Recuerdas tu contraseña?{' '}
            <Link href="/login" className="text-[#ff6b35] hover:text-[#f7931a] font-medium transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
