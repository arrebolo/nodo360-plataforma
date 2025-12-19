'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User, CheckCircle2 } from 'lucide-react'

export default function RegistroPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validaciones
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este email ya está registrado. ¿Quieres iniciar sesión?')
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        setSuccess(true)
      }
    } catch (err) {
      setError('Error al crear la cuenta. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError('Error al registrarse con Google')
      }
    } catch (err) {
      setError('Error al conectar con Google')
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
            <h1 className="text-2xl font-bold text-white mb-3">¡Cuenta creada!</h1>
            <p className="text-white/60 mb-6">
              Hemos enviado un email de confirmación a <strong className="text-white">{email}</strong>.
              Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all"
              >
                Ir a Iniciar Sesión
              </Link>
              <Link
                href="/"
                className="block w-full py-3 px-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Volver al Inicio
              </Link>
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
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-white font-bold text-2xl">NODO360</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Crea tu cuenta</h1>
          <p className="text-white/60">Comienza tu viaje en Web3 hoy</p>
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
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Contraseña
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

            {/* Terms */}
            <p className="text-xs text-white/50">
              Al registrarte, aceptas nuestros{' '}
              <Link href="/terminos" className="text-[#ff6b35] hover:underline">
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link href="/privacidad" className="text-[#ff6b35] hover:underline">
                Política de Privacidad
              </Link>
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || password !== confirmPassword}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta gratis'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0a0a0a] text-white/40">o regístrate con</span>
            </div>
          </div>

          {/* Social Register */}
          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          {/* Login Link */}
          <p className="mt-6 text-center text-white/60">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#ff6b35] hover:text-[#f7931a] font-medium transition-colors">
              Inicia sesión
            </Link>
          </p>
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
