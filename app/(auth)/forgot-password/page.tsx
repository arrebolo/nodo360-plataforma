'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      console.log('[Forgot Password] Solicitando reset para:', email)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (resetError) {
        console.error('[Forgot Password] Error de Supabase:', {
          message: resetError.message,
          status: resetError.status,
          name: resetError.name,
        })

        // Mapear errores específicos a mensajes en español
        const errorMessage = resetError.message.toLowerCase()

        if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          setError('Has solicitado demasiados correos. Espera unos minutos e intenta de nuevo.')
        } else if (errorMessage.includes('invalid email') || errorMessage.includes('invalid_email')) {
          setError('El formato del email no es valido.')
        } else if (errorMessage.includes('email not confirmed')) {
          setError('Tu email aun no ha sido confirmado. Revisa tu bandeja de entrada.')
        } else if (errorMessage.includes('user not found')) {
          // Por seguridad, no revelamos si el usuario existe o no
          // Mostramos exito de todos modos
          console.log('[Forgot Password] Usuario no encontrado, mostrando exito por seguridad')
          setSuccess(true)
          return
        } else if (errorMessage.includes('smtp') || errorMessage.includes('email provider')) {
          setError('Error del servidor de correo. Intenta de nuevo en unos minutos.')
        } else {
          // Mostrar el mensaje original de Supabase si no es sensible
          setError(`Error: ${resetError.message}`)
        }
        return
      }

      console.log('[Forgot Password] Email de recuperacion enviado exitosamente')
      setSuccess(true)
    } catch (err) {
      console.error('[Forgot Password] Error inesperado:', err)
      setError('Error inesperado. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Mostrar exito
  if (success) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Revisa tu correo
            </h1>
            <p className="text-white/60 mb-2">
              Hemos enviado un enlace de recuperacion a:
            </p>
            <p className="text-brand font-medium mb-6">
              {email}
            </p>
            <p className="text-white/40 text-sm mb-6">
              Si no ves el correo, revisa tu carpeta de spam.
              El enlace expira en 1 hora.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="w-full px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                Enviar a otro correo
              </button>
              <Link
                href="/login"
                className="block w-full px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark transition-colors text-center"
              >
                Volver al inicio de sesion
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <span className="text-3xl">N</span>
            <span className="text-xl font-bold text-white">Nodo360</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">
            Recuperar contrasena
          </h1>
          <p className="text-white/60">
            Te enviaremos un enlace para restablecer tu contrasena
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email de tu cuenta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/40" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Enviar enlace de recuperacion
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-white/10" />

          {/* Info */}
          <div className="text-center text-sm text-white/40">
            <p>
              Recibiras un email con instrucciones para
              crear una nueva contrasena.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  )
}
