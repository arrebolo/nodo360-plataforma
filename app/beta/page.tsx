'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Lock,
  Bell,
  CheckCircle,
  LogOut,
  Twitter,
  MessageCircle,
  Send
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BetaAccessPage() {
  const router = useRouter()
  const [notifySubmitted, setNotifySubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cerrar sesion
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // Notificarme cuando mi acceso este listo
  async function handleNotify() {
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Marcar en la tabla users que quiere ser notificado
        await supabase
          .from('users')
          .update({ wants_beta_notification: true })
          .eq('id', user.id)

        setNotifySubmitted(true)
      }
    } catch (error) {
      console.error('Error al registrar notificacion:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-surface to-dark flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card principal */}
        <div className="bg-dark-surface/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/imagenes/logo-nodo360.png"
                alt="Nodo360"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-white">Nodo360</span>
            </Link>
          </div>

          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-brand/20 to-brand/5 rounded-full flex items-center justify-center border border-brand/30">
              <Lock className="w-10 h-10 text-brand" />
            </div>
          </div>

          {/* Titulo */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Acceso Beta Privada
          </h1>

          <p className="text-gray-400 text-center mb-8">
            Tu cuenta esta registrada. Estamos activando accesos gradualmente para garantizar la mejor experiencia.
          </p>

          {/* Cuadro principal - Notificarme */}
          <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
            {!notifySubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand/20 to-brand/5 rounded-xl flex items-center justify-center border border-brand/30">
                    <Bell className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      ¿Quieres que te avisemos?
                    </h2>
                    <p className="text-sm text-gray-400">
                      Te enviaremos un email cuando tu acceso este listo
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNotify}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-brand text-white rounded-xl hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Notificarme cuando mi acceso este listo
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  ¡Registrado correctamente!
                </h3>
                <p className="text-gray-400 text-sm">
                  Te enviaremos un email a tu correo registrado cuando tu acceso este habilitado.
                </p>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Redes sociales */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm mb-4">Siguenos para novedades y actualizaciones</p>
            <div className="flex justify-center gap-3">
              <a
                href="https://twitter.com/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/ag5aPsNuPY"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://t.me/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px bg-white/10 mb-6" />

          {/* Contacto */}
          <p className="text-center text-gray-500 text-sm mb-4">
            ¿Preguntas? Escribenos a{' '}
            <a href="mailto:soporte@nodo360.com" className="text-brand hover:underline">
              soporte@nodo360.com
            </a>
          </p>

          {/* Cerrar sesion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          2024 Nodo360. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
