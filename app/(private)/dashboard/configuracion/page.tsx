'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Settings,
  Bell,
  Moon,
  Globe,
  Shield,
  Loader2,
  CheckCircle,
  LogOut
} from 'lucide-react'

export default function ConfiguracionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  // Preferencias (por ahora solo UI, se pueden conectar a DB despues)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('es')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setEmail(user.email || '')
      setLoading(false)
    }
    loadUser()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configuracion
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Administra tus preferencias y cuenta
        </p>
      </div>

      <div className="space-y-6">
        {/* Notificaciones */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Notificaciones
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Notificaciones por email</div>
                <div className="text-sm text-white/60">Recibe actualizaciones sobre tu progreso</div>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative w-12 h-6 rounded-full transition ${
                  emailNotifications ? 'bg-brand-light' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    emailNotifications ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Apariencia */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-400" />
            Apariencia
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Modo oscuro</div>
                <div className="text-sm text-white/60">Activo por defecto en Nodo360</div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-12 h-6 rounded-full transition ${
                  darkMode ? 'bg-brand-light' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    darkMode ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Idioma */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" />
            Idioma
          </h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-light/50 transition"
          >
            <option value="es" className="bg-dark-surface">Espanol</option>
            <option value="en" className="bg-dark-surface">English (coming soon)</option>
          </select>
        </div>

        {/* Seguridad */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            Seguridad
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-white/60 mb-1">Email de la cuenta</div>
              <div className="text-white">{email}</div>
            </div>
            <div className="pt-2">
              <Link
                href="/auth/reset-password"
                className="text-sm text-brand-light hover:underline"
              >
                Cambiar contrasena
              </Link>
            </div>
          </div>
        </div>

        {/* Cerrar sesion */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-400" />
            Sesion
          </h2>
          <p className="text-sm text-white/60 mb-4">
            Cierra tu sesion en este dispositivo.
          </p>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  )
}


