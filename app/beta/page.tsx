'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Lock,
  Ticket,
  Bell,
  CheckCircle,
  XCircle,
  LogOut,
  Twitter,
  MessageCircle,
  Send
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BetaAccessPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    message: string
  } | null>(null)
  const [notifySubmitted, setNotifySubmitted] = useState(false)

  // Validar codigo de invitacion
  async function handleValidateCode(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setIsValidating(true)
    setValidationResult(null)

    try {
      const res = await fetch(`/api/invites/validate?code=${encodeURIComponent(inviteCode)}`)
      const data = await res.json()

      if (data.valid) {
        setValidationResult({
          valid: true,
          message: 'Codigo valido! Activando tu acceso...'
        })

        // Consumir codigo y activar acceso
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          await fetch('/api/invites/consume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: inviteCode, userId: user.id })
          })

          // Activar is_beta en el usuario
          await supabase
            .from('users')
            .update({ is_beta: true })
            .eq('id', user.id)

          // Redirigir al dashboard
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        }
      } else {
        const messages: Record<string, string> = {
          not_found: 'Codigo no encontrado',
          inactive: 'Este codigo ya no esta activo',
          expired: 'Este codigo ha expirado',
          used_up: 'Este codigo ha alcanzado el limite de usos',
        }
        setValidationResult({
          valid: false,
          message: messages[data.reason] || 'Codigo no valido'
        })
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Error al validar el codigo'
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Cerrar sesion
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
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

          {/* Seccion codigo de invitacion */}
          <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="w-5 h-5 text-brand" />
              <h2 className="text-sm font-medium text-white">Tienes un codigo de invitacion?</h2>
            </div>

            <form onSubmit={handleValidateCode} className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ej: N360-ABC123"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                disabled={isValidating}
              />
              <button
                type="submit"
                disabled={isValidating || !inviteCode.trim()}
                className="px-5 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isValidating ? 'Validando...' : 'Validar'}
              </button>
            </form>

            {/* Resultado de validacion */}
            {validationResult && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${
                validationResult.valid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validationResult.valid ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                {validationResult.message}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Notificarme */}
          {!notifySubmitted ? (
            <div className="text-center mb-6">
              <button
                onClick={() => setNotifySubmitted(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-gray-300 rounded-lg hover:bg-white/15 transition text-sm"
              >
                <Bell size={16} />
                Notificarme cuando mi acceso este listo
              </button>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 text-sm">
                Perfecto! Te notificaremos cuando tu acceso este habilitado.
              </p>
            </div>
          )}

          {/* Redes sociales */}
          <div className="border-t border-white/10 pt-6 mb-6">
            <p className="text-xs text-gray-500 text-center mb-3">
              Siguenos para novedades y actualizaciones
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="https://twitter.com/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://discord.gg/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Discord"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="https://t.me/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Telegram"
              >
                <Send size={18} />
              </a>
            </div>
          </div>

          {/* Contacto */}
          <p className="text-xs text-gray-500 text-center mb-6">
            Preguntas? Escribenos a{' '}
            <a
              href="mailto:soporte@nodo360.com"
              className="text-brand hover:underline"
            >
              soporte@nodo360.com
            </a>
          </p>

          {/* Cerrar sesion */}
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition"
            >
              <LogOut size={14} />
              Cerrar sesion
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          2024 Nodo360. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
