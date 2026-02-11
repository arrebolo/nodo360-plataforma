'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle,
  Bell,
  LogOut,
  Twitter,
  MessageCircle,
  Send,
  Shield,
  Users
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

          {/* Icono de éxito */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-full flex items-center justify-center border border-green-500/30">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>

          {/* Titulo */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Tu cuenta esta activa
          </h1>

          <p className="text-gray-300 text-center mb-4">
            Ya puedes acceder a los cursos gratuitos. El contenido premium se habilitara progresivamente durante la beta.
          </p>

          {/* Seccion ¿Por que beta? */}
          <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              ¿Por que beta?
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Nodo360 esta en fase beta porque preferimos crecer de forma responsable, escuchar a los primeros usuarios y asegurar una experiencia solida antes de escalar.
            </p>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Transparencia total:</strong> no recopilamos datos innecesarios ni compartimos tu informacion.
              </span>
            </div>
          </div>

          {/* Acceso a cursos gratuitos */}
          <Link
            href="/cursos"
            className="block w-full py-4 px-6 bg-gradient-to-r from-brand-light to-brand text-white rounded-xl hover:shadow-lg hover:shadow-brand/30 transition font-semibold text-center mb-4"
          >
            Explorar cursos gratuitos
          </Link>

          {/* Cuadro secundario - Notificarme para premium */}
          <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
            {!notifySubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand/20 to-brand/5 rounded-lg flex items-center justify-center border border-brand/30">
                    <Bell className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Contenido premium
                    </h2>
                    <p className="text-xs text-gray-400">
                      Te avisamos cuando se habilite el acceso completo
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNotify}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-white/10 text-white rounded-lg hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Notificarme
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Registrado</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Te enviaremos un email cuando el acceso premium este listo.
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
