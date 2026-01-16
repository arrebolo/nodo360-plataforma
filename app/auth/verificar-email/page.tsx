import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Verifica tu Email | Nodo360',
  description: 'Te hemos enviado un email de confirmacion'
}

export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-surface to-dark flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card principal */}
        <div className="bg-dark-surface/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl text-center">

          {/* Icono de email */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-brand/20 to-brand/5 rounded-full flex items-center justify-center border border-brand/30">
              <Mail className="w-10 h-10 text-brand" />
            </div>
          </div>

          {/* Titulo */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Revisa tu Email
          </h1>

          <p className="text-gray-400 mb-6">
            Te hemos enviado un enlace de confirmacion. Haz clic en el enlace del email para activar tu cuenta.
          </p>

          {/* Instrucciones */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10 text-left">
            <p className="text-sm text-gray-300 mb-2">¿No encuentras el email?</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>- Revisa tu carpeta de spam o correo no deseado</li>
              <li>- Verifica que escribiste bien tu email</li>
              <li>- Espera unos minutos y vuelve a intentarlo</li>
            </ul>
          </div>

          {/* Boton volver */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-medium border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Login
          </Link>

          {/* Reenviar email */}
          <p className="text-gray-500 text-sm mt-6">
            ¿No recibiste el email?{' '}
            <Link href="/login?mode=register" className="text-brand hover:underline">
              Intentar de nuevo
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          2024 Nodo360. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
