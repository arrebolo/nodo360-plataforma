import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Cuenta Confirmada | Nodo360',
  description: 'Tu cuenta ha sido confirmada correctamente'
}

export default function ConfirmadoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-surface to-dark flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card principal */}
        <div className="bg-dark-surface/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl text-center">

          {/* Icono de exito */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>

          {/* Titulo */}
          <h1 className="text-2xl font-bold text-white mb-2">
            ¡Cuenta Confirmada!
          </h1>

          <p className="text-gray-400 mb-8">
            Tu email ha sido verificado correctamente. Ya puedes iniciar sesion y comenzar tu aprendizaje.
          </p>

          {/* Boton de login */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-brand text-white rounded-xl hover:bg-brand-dark transition font-medium"
          >
            Iniciar Sesion
          </Link>

          {/* Info adicional */}
          <p className="text-gray-500 text-sm mt-6">
            ¿Problemas para acceder?{' '}
            <a href="mailto:soporte@nodo360.com" className="text-brand hover:underline">
              Contactanos
            </a>
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
