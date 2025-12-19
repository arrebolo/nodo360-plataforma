'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function RestablecerPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar si hay una sesión de recuperación válida
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }
    checkSession()
  }, [])

  const validatePassword = (pass: string) => {
    const checks = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
    }
    return checks
  }

  const passwordChecks = validatePassword(password)
  const isPasswordValid = Object.values(passwordChecks).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err) {
      setError('Error al actualizar la contraseña. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
      </div>
    )
  }

  // Invalid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Enlace inválido o expirado</h1>
            <p className="text-white/60 mb-6">
              El enlace de recuperación ha expirado o ya fue utilizado.
              Por favor solicita uno nuevo.
            </p>
            <Link
              href="/recuperar-password"
              className="block w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-white mb-3">¡Contraseña actualizada!</h1>
            <p className="text-white/60 mb-6">
              Tu contraseña ha sido restablecida correctamente.
              Serás redirigido al dashboard en unos segundos...
            </p>
            <div className="flex items-center justify-center gap-2 text-white/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirigiendo...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 border border-[#ff6b35]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-[#ff6b35]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Nueva contraseña</h1>
          <p className="text-white/60">
            Crea una contraseña segura para tu cuenta
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
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crea una contraseña segura"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PasswordCheck valid={passwordChecks.length} text="8+ caracteres" />
                  <PasswordCheck valid={passwordChecks.uppercase} text="Mayúscula" />
                  <PasswordCheck valid={passwordChecks.lowercase} text="Minúscula" />
                  <PasswordCheck valid={passwordChecks.number} text="Número" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                      : 'border-white/10 focus:border-[#ff6b35]/50 focus:ring-[#ff6b35]/20'
                  }`}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-400">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || password !== confirmPassword}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar contraseña'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function PasswordCheck({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${valid ? 'text-green-400' : 'text-white/40'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${valid ? 'bg-green-400' : 'bg-white/30'}`} />
      {text}
    </div>
  )
}
