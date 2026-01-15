import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cuenta Suspendida | Nodo360',
  description: 'Tu cuenta ha sido suspendida temporalmente.',
}

interface PageProps {
  searchParams: Promise<{ reason?: string }>
}

export default async function CuentaSuspendidaPage({ searchParams }: PageProps) {
  const params = await searchParams
  const reason = params.reason

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-surface rounded-xl p-8 border border-white/10 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          Cuenta Suspendida
        </h1>

        <p className="text-gray-400 mb-6">
          Tu cuenta ha sido suspendida temporalmente y no puedes acceder a la plataforma en este momento.
        </p>

        {reason && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
            <p className="text-sm text-yellow-400">
              <strong>Motivo:</strong> {reason}
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">
          Si crees que esto es un error o tienes preguntas, por favor contacta con soporte.
        </p>

        <div className="space-y-3">
          <a
            href="mailto:soporte@nodo360.com"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition"
          >
            <Mail size={18} />
            Contactar Soporte
          </a>

          <Link
            href="/"
            className="block w-full px-4 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
