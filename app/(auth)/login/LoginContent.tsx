'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import {
  signInWithEmail,
  signInWithPassword,
  signInWithOAuth,
  signUp,
  type OAuthProvider,
} from './actions'
import { getSpanishErrorMessage } from '@/lib/auth/error-messages'

type TabType = 'login' | 'register'

export default function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('login')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isPasswordLogin, setIsPasswordLogin] = useState(false)
  const [loadingOAuth, setLoadingOAuth] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estado para código de invitación
  const [inviteCode, setInviteCode] = useState('')
  const [inviteValid, setInviteValid] = useState<boolean | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [validatingInvite, setValidatingInvite] = useState(false)

  // Leer parámetros de URL
  const redirectTo = searchParams.get('redirect')

  // Función para validar código de invitación
  const validateInviteCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setInviteValid(null)
      setInviteError('')
      return
    }

    setValidatingInvite(true)
    try {
      const res = await fetch(`/api/invites/validate?code=${encodeURIComponent(code)}`)
      const data = await res.json()

      if (data.valid) {
        setInviteValid(true)
        setInviteError('')
      } else {
        setInviteValid(false)
        const messages: Record<string, string> = {
          not_found: 'Código de invitación no válido',
          inactive: 'Este código ya no está activo',
          expired: 'Este código ha expirado',
          used_up: 'Este código ha alcanzado el límite de usos',
        }
        setInviteError(messages[data.reason] || 'Código no válido')
      }
    } catch {
      setInviteError('Error al validar el código')
      setInviteValid(false)
    } finally {
      setValidatingInvite(false)
    }
  }, [])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')
    const inviteParam = searchParams.get('invite')

    // Traducir el error al español si viene de la URL
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam)
      // El error ya se traducirá en el render con getSpanishErrorMessage
      setError(decodedError)
    }
    if (successParam) setSuccess(decodeURIComponent(successParam))

    // Si viene código de invitación en URL, validarlo y cambiar a tab registro
    if (inviteParam) {
      const code = inviteParam.toUpperCase()
      setInviteCode(code)
      setActiveTab('register')
      validateInviteCode(code)
    }
  }, [searchParams, validateInviteCode])

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await signInWithEmail(formData)

      if (result.success) {
        setEmailSent(true)
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoadingOAuth(provider)
    setError(null)
    await signInWithOAuth(provider, redirectTo || undefined)
    // La redirección ocurre en la server action
  }

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPasswordLogin(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await signInWithPassword(formData)
      // Si no hay error, la redirección ocurre en la server action
    } catch (err) {
      // Los errores de redirect son esperados, no mostrarlos
      const isRedirect = err instanceof Error && (
        err.message.includes('NEXT_REDIRECT') ||
        (err as any).digest?.startsWith?.('NEXT_REDIRECT')
      )
      if (!isRedirect) {
        setError(getSpanishErrorMessage(err instanceof Error ? err.message : 'Error inesperado'))
      }
    } finally {
      // Siempre resetear el estado de loading
      // Si hay redirect, el componente se desmontará de todos modos
      setIsPasswordLogin(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsRegistering(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await signUp(formData)

      if (result.success) {
        setSuccess(result.message)
        // Redirigir al dashboard después de registro exitoso
        router.push('/dashboard')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsRegistering(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-brand-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              ¡Revisa tu email!
            </h2>
            <p className="text-white/70 mb-6">
              Te hemos enviado un enlace mágico para iniciar sesión.
              Haz click en el enlace del email para continuar.
            </p>
            <button
              onClick={() => setEmailSent(false)}
              className="text-brand-light hover:text-brand font-medium transition"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Nodo360
          </h1>
          <p className="text-white/70">
            Plataforma educativa de Bitcoin y Blockchain
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg" role="tablist" aria-label="Opciones de acceso">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-brand-light to-brand text-white'
                  : 'text-white/60 hover:text-white'
              }`}
              role="tab"
              aria-selected={activeTab === 'login'}
              aria-controls="login-panel"
              id="login-tab"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-brand-light to-brand text-white'
                  : 'text-white/60 hover:text-white'
              }`}
              role="tab"
              aria-selected={activeTab === 'register'}
              aria-controls="register-panel"
              id="register-tab"
            >
              Registrarse
            </button>
          </div>

          {/* Mensajes de error - con iconos y estilos mejorados */}
          {error && (
            <div
              className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {error.toLowerCase().includes('suspendid') || error.toLowerCase().includes('banned') ? (
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  ) : error.toLowerCase().includes('navegador') || error.toLowerCase().includes('expirad') ? (
                    <Info className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-red-300 text-sm font-medium">
                    {getSpanishErrorMessage(error)}
                  </p>
                  {/* Mostrar sugerencia según el tipo de error */}
                  {error.toLowerCase().includes('navegador') && (
                    <p className="text-red-300/70 text-xs mt-1">
                      Abre el enlace en el mismo navegador donde lo solicitaste.
                    </p>
                  )}
                  {error.toLowerCase().includes('credenciales') && (
                    <p className="text-red-300/70 text-xs mt-1">
                      ¿Olvidaste tu contraseña?{' '}
                      <Link href="/forgot-password" className="underline hover:text-red-200">
                        Recupérala aquí
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div
              className="mb-4 bg-success/10 border border-success/30 rounded-lg p-4"
              role="status"
              aria-live="polite"
            >
              <p className="text-success text-sm">{success}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              disabled={loadingOAuth !== null || isPasswordLogin}
              className={`w-full py-3 px-4 font-medium rounded-lg transition flex items-center justify-center gap-2 ${
                loadingOAuth === 'google'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-white text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loadingOAuth === 'google' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-neutral-600">Conectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>

            <button
              onClick={() => handleOAuth('github')}
              disabled={loadingOAuth !== null || isPasswordLogin}
              className={`w-full py-3 px-4 font-medium rounded-lg transition flex items-center justify-center gap-2 ${
                loadingOAuth === 'github'
                  ? 'bg-gray-600 cursor-not-allowed text-white'
                  : 'bg-dark-tertiary text-white hover:bg-dark-soft disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loadingOAuth === 'github' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  Continuar con GitHub
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-surface text-white/60">O continúa con email</span>
            </div>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <div id="login-panel" role="tabpanel" aria-labelledby="login-tab">
              {/* Magic Link Form */}
              <form onSubmit={handleMagicLink} className="space-y-4 mb-4">
                {/* Hidden redirect field */}
                {redirectTo && (
                  <input type="hidden" name="redirect" value={redirectTo} />
                )}
                <div>
                  <label htmlFor="email-magic" className="block text-sm font-medium text-white/90 mb-2">
                    Email para enlace mágico
                  </label>
                  <input
                    id="email-magic"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || isPasswordLogin || loadingOAuth !== null}
                  className={`w-full py-3 px-4 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-light to-brand text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar enlace mágico'
                  )}
                </button>
              </form>

              {/* Password Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                {/* Hidden redirect field */}
                {redirectTo && (
                  <input type="hidden" name="redirect" value={redirectTo} />
                )}
                <div>
                  <label htmlFor="email-password" className="block text-sm font-medium text-white/90 mb-2">
                    Email
                  </label>
                  <input
                    id="email-password"
                    name="email"
                    type="email"
                    required
                    disabled={isPasswordLogin}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-white/90">
                      Contraseña
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-brand-light hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={isPasswordLogin}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPasswordLogin || loadingOAuth !== null}
                  className={`w-full py-3 px-4 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    isPasswordLogin
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isPasswordLogin ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión con contraseña'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <div id="register-panel" role="tabpanel" aria-labelledby="register-tab">
              {/* Mensaje si no hay código */}
              {!inviteCode && (
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg text-center mb-4">
                  <p className="text-warning font-medium">Registro por invitación</p>
                  <p className="text-sm text-white/60 mt-1">
                    Actualmente solo aceptamos registros con código de invitación.
                  </p>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Campo oculto para el código de invitación */}
                <input type="hidden" name="inviteCode" value={inviteCode} />

                {/* Código de invitación */}
                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-white/90 mb-2">
                    Código de invitación *
                  </label>
                  <div className="relative">
                    <input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase()
                        setInviteCode(code)
                        if (code.length >= 4) {
                          validateInviteCode(code)
                        } else {
                          setInviteValid(null)
                          setInviteError('')
                        }
                      }}
                      placeholder="Ej: BETA2024"
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition ${
                        inviteValid === true
                          ? 'border-success'
                          : inviteValid === false
                          ? 'border-error'
                          : 'border-white/20'
                      }`}
                      required
                    />
                    {validatingInvite && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!validatingInvite && inviteValid === true && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                    )}
                    {!validatingInvite && inviteValid === false && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-error" />
                    )}
                  </div>
                  {inviteValid === true && (
                    <p className="text-sm text-success mt-1 flex items-center gap-1">
                      Código válido
                    </p>
                  )}
                  {inviteError && (
                    <p className="text-sm text-error mt-1">{inviteError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-white/90 mb-2">
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="email-register" className="block text-sm font-medium text-white/90 mb-2">
                    Email
                  </label>
                  <input
                    id="email-register"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="password-register" className="block text-sm font-medium text-white/90 mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password-register"
                    name="password"
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition"
                  />
                </div>

                {/* Aceptación de términos */}
                <label className="flex items-start gap-3 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    required
                    className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/5 text-brand focus:ring-brand focus:ring-offset-0"
                  />
                  <span>
                    Acepto los{' '}
                    <Link href="/terminos" className="text-brand hover:underline" target="_blank">
                      Términos de Servicio
                    </Link>
                    {' '}y la{' '}
                    <Link href="/privacidad" className="text-brand hover:underline" target="_blank">
                      Política de Privacidad
                    </Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={inviteValid !== true || validatingInvite || isRegistering}
                  className={`w-full py-3 px-4 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    isRegistering
                      ? 'bg-gray-500 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-light to-brand text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  }`}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear cuenta'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-white/50 hover:text-white/80 text-sm transition inline-flex items-center"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}


