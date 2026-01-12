import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Lock } from 'lucide-react'

export const metadata = {
  title: 'Acceso Beta | Nodo360',
  description: 'Tu cuenta esta pendiente de activacion para la beta privada.',
}

export default function BetaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-orange-600" />
        </div>

        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Acceso en Beta
        </h1>

        <p className="text-neutral-600 mb-6">
          Tu cuenta esta registrada, pero todavia no esta habilitada para la beta privada.
        </p>

        <p className="text-sm text-neutral-500 mb-8">
          Si tienes una invitacion, contacta con soporte o espera la activacion.
          Te notificaremos cuando tu acceso este listo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="soft">
              Volver a inicio
            </Button>
          </Link>

          <Link href="/api/auth/logout">
            <Button variant="ghost">
              Cerrar sesion
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-neutral-400">
          ¿Preguntas? Escribenos a{' '}
          <a href="mailto:soporte@nodo360.com" className="text-orange-600 hover:underline">
            soporte@nodo360.com
          </a>
        </p>
      </Card>
    </div>
  )
}


