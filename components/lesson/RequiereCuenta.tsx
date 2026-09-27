import Link from 'next/link'
import { UserPlus } from 'lucide-react'

interface Props {
  /** Titulo de lo que esta detras de la cuenta. */
  titulo: string
  /** Que se gana al tenerla, en una frase. Nada de "inicia sesion para continuar". */
  queSeGana: string
  /** Ruta a la que volver despues de entrar, empezando por /. */
  volverA: string
  className?: string
}

/**
 * Aviso para lo que si necesita cuenta dentro de una leccion publica.
 *
 * La leccion se lee entera sin registrarse. Lo que guarda estado -progreso,
 * notas, comentarios, examen, certificado, XP- no puede existir sin una cuenta
 * donde guardarlo. En vez de esconder esas piezas sin explicar nada, que es lo
 * que se hacia con los comentarios, aqui se dice que hay detras y se vuelve a
 * la misma leccion despues de entrar.
 */
export function RequiereCuenta({ titulo, queSeGana, volverA, className = '' }: Props) {
  return (
    <div
      className={`bg-dark-surface border border-white/10 rounded-2xl p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light/10">
          <UserPlus className="h-5 w-5 text-brand-light" aria-hidden />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">{titulo}</h3>
            <p className="text-sm text-white/60 max-w-prose">{queSeGana}</p>
          </div>

          <Link
            href={`/login?redirect=${volverA}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand"
          >
            Entrar o crear cuenta gratis
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
