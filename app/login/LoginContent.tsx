'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  signInWithEmail,
  signInWithPassword,
  signInWithOAuth,
  signUp,
  type OAuthProvider,
} from './actions'

type TabType = 'login' | 'register'

export default function LoginContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('login')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Leer parámetros de URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')

    if (errorParam) setError(decodeURIComponent(errorParam))
    if (successParam) setSuccess(decodeURIComponent(successParam))
  }, [searchParams])

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await signInWithEmail(formData)

    if (result.success) {
      setEmailSent(true)
      setSuccess(result.message)
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoading(true)
    setError(null)
    await signInWithOAuth(provider)
    // La redirección ocurre en la server action
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-[#ff6b35]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="text-[#ff6b35] hover:text-[#f7931a] font-medium transition"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center px-4 py-8">
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
          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-500/10 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>

            <button
              onClick={() => handleOAuth('github')}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#24292e] text-white font-medium rounded-lg hover:bg-[#2f363d] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Continuar con GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1a1f2e] text-white/60">O continúa con email</span>
            </div>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <>
              {/* Magic Link Form */}
              <form onSubmit={handleMagicLink} className="space-y-4 mb-4">
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
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace mágico'}
                </button>
              </form>

              {/* Password Form */}
              <form action={signInWithPassword} className="space-y-4">
                <div>
                  <label htmlFor="email-password" className="block text-sm font-medium text-white/90 mb-2">
                    Email
                  </label>
                  <input
                    id="email-password"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition"
                >
                  Iniciar sesión con contraseña
                </button>
              </form>
            </>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form action={signUp} className="space-y-4">
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Crear cuenta
              </button>
            </form>
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
