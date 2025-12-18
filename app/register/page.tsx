'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        console.error('[Register] Error Supabase:', signUpError)
        setError(signUpError.message || 'Error al crear la cuenta')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      // Opcional: si no usas confirmación por email, puedes enviar directo al dashboard:
      // router.push(redirectTo)
      // router.refresh()
    } catch (err) {
      console.error('[Register] Error inesperado:', err)
      setError('Error inesperado al crear la cuenta')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-lg">
      <h1 className="text-2xl font-bold text-white mb-2">
        Crea tu cuenta en <span className="text-[#f7931a]">Nodo360</span>
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        Accede a cursos, rutas de aprendizaje y certificados digitales.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-200">
          Cuenta creada correctamente. Revisa tu correo para confirmar el acceso.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
            placeholder="tucorreo@nodo360.com"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-500 text-center">
        ¿Ya tienes cuenta?{' '}
        <a
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="text-[#f7931a] hover:underline"
        >
          Inicia sesión
        </a>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-lg animate-pulse">
          <div className="h-8 bg-white/10 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-full mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-white/10 rounded"></div>
            <div className="h-10 bg-white/10 rounded"></div>
            <div className="h-10 bg-white/10 rounded"></div>
          </div>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
