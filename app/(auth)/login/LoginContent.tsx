'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, AlertTriangle, Info, Rocket, MailCheck } from 'lucide-react'
import {
  signInWithEmail,
  signInWithPassword,
  signInWithOAuth,
  signUp,
  resendSignUpConfirmation,
  type OAuthProvider,
} from './actions'
import { getSpanishErrorMessage } from '@/lib/auth/error-messages'
import { enviarEvento } from '@/lib/analytics/eventos'

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
  /**
   * Email de un registro que ha salido bien pero está esperando confirmación.
   * Mientras tenga valor se muestra la pantalla «Revisa tu correo» en lugar del
   * formulario: la cuenta existe, pero sin sesión no se puede entrar todavía.
   */
  const [registroPendiente, setRegistroPendiente] = useState<string | null>(null)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  // Leer parámetros de URL
  const redirectTo = searchParams.get('redirect')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')
    const modeParam = searchParams.get('mode')

    // Traducir el error al español si viene de la URL
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam)
      // El error ya se traducirá en el render con getSpanishErrorMessage
      setError(decodedError)
    }
    if (successParam) setSuccess(decodeURIComponent(successParam))

    // Si viene mode=register, cambiar a tab registro
    if (modeParam === 'register') {
      setActiveTab('register')
    }
  }, [searchParams])

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
        // El evento va PRIMERO, antes de cualquier return o navegación. Dos
        // razones, y las dos importan:
        //
        // 1. La cuenta ya existe en cuanto Supabase la crea, así que un registro
        //    pendiente de confirmar el email cuenta igual. Si el evento fuera
        //    después del `return` de abajo, con la confirmación activada no se
        //    mediría ni un registro por contraseña.
        // 2. Después del router.push, la navegación puede desmontar el
        //    componente antes de que el evento salga.
        enviarEvento('sign_up', { method: 'email' })

        // Con la confirmación de email activada no hay sesión todavía, así que
        // ir al dashboard solo consigue que el middleware devuelva a /login sin
        // decir nada. Quien acaba de registrarse necesita saber que le falta un
        // paso y dónde está, no volver a ver la pantalla de acceso.
        if (result.needsEmailConfirmation) {
          setRegistroPendiente(result.email ?? (formData.get('email') as string))
          return
        }

        setSuccess(result.message)
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

  const handleResend = async () => {
    if (!registroPendiente) return

    setReenviando(true)
    setError(null)

    try {
      const result = await resendSignUpConfirmation(registroPendiente)
      if (result.success) {
        setReenviado(true)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setReenviando(false)
    }
  }

  if (registroPendiente) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-brand-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-8 h-8 text-brand-light" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Revisa tu correo
            </h2>
            <p className="text-white/70">
              Tu cuenta ya está creada. Para activarla, abre el enlace de
              confirmación que acabamos de enviar a:
            </p>
            <p className="mt-2 mb-4 font-medium text-white break-all">
              {registroPendiente}
            </p>
            <p className="text-sm text-white/60 mb-6">
              Si no lo ves en unos minutos, míralo en spam o en correo no
              deseado. Abre el enlace en este mismo navegador.
            </p>

            {error && (
              <p
                className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                role="alert"
                aria-live="assertive"
              >
                {getSpanishErrorMessage(error)}
              </p>
            )}

            {reenviado ? (
              <p
                className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success"
                role="status"
                aria-live="polite"
              >
                Te lo hemos enviado otra vez a {registroPendiente}.
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={reenviando}
                className="w-full py-3 px-4 mb-4 font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reenviando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Reenviar el correo de confirmación'
                )}
              </button>
            )}

            <button
              onClick={() => {
                setRegistroPendiente(null)
                setReenviado(false)
                setError(null)
              }}
              className="text-brand-light hover:text-brand text-sm font-medium transition"
            >
              ← Usar otro correo
            </button>
          </div>
        </div>
      </div>
    )
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

            {/* Aquí había un «Continuar con GitHub», retirado el 26/09/2026.
                GitHub no está habilitado como proveedor en Supabase
                (/auth/v1/settings devuelve external.github = false), así que el
                botón solo podía acabar en un error de proveedor no habilitado:
                un camino de entrada visible que no llevaba a ninguna parte.
                Ninguna de las cuentas existentes lo usaba. Si algún día se
                habilita, vuelve el botón y 'github' a MetodoRegistro. */}
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
              {/* Beta Badge */}
              <div className="p-4 bg-brand-light/10 border border-brand-light/30 rounded-xl text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-brand-light font-medium">
                  <Rocket className="w-5 h-5" />
                  Beta abierta - Registrate gratis
                </div>
                <p className="text-sm text-white/60 mt-1">
                  Accede a cursos gratuitos y contenido exclusivo
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
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
                    minLength={6}
                    maxLength={72}
                    aria-describedby="password-register-ayuda"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition"
                  />
                  {/* El requisito va en un texto fijo, no en el placeholder: el
                      placeholder desaparece al primer carácter y no lo lee un
                      lector de pantalla, así que el límite solo se descubría
                      fallando el envío. El máximo son 72 caracteres porque es
                      el límite de bcrypt, y antes no se decía en ninguna parte. */}
                  <p id="password-register-ayuda" className="mt-2 text-xs text-white/50">
                    Entre 6 y 72 caracteres
                  </p>
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
                  disabled={isRegistering}
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
                    'Crear cuenta gratis'
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


