import Link from 'next/link'
import { ArrowRight, BookOpen, ListOrdered } from 'lucide-react'

type Props = {
  courseSlug: string
  courseTitle: string
  /** Modulo que falta por terminar. */
  moduloTitulo: string
  pendientes: number
  total: number
  /** Primera leccion sin completar de ese modulo. */
  siguienteSlug: string | null
  siguienteTitulo: string | null
}

/**
 * Lo que ve quien entra por URL a una leccion que todavia no le toca.
 *
 * No es un candado mudo: dice cuanto falta, por que existe el orden, y lleva
 * a la primera leccion pendiente —no al inicio del curso—, que es donde esa
 * persona tiene que seguir.
 */
export function LessonLocked({
  courseSlug,
  courseTitle,
  moduloTitulo,
  pendientes,
  total,
  siguienteSlug,
  siguienteTitulo,
}: Props) {
  const hechas = total - pendientes

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-surface via-dark-soft to-dark-surface">
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-3 text-brand-light">
            <ListOrdered className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium uppercase tracking-wide">Aún no disponible</span>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Esta lección se abre al terminar el módulo anterior
          </h1>

          <p className="mt-4 text-white/70">
            Te {pendientes === 1 ? 'queda' : 'quedan'}{' '}
            <strong className="text-white">
              {pendientes} {pendientes === 1 ? 'lección' : 'lecciones'}
            </strong>{' '}
            del módulo <strong className="text-white">«{moduloTitulo}»</strong>
            {hechas > 0 && (
              <span className="text-white/50"> · llevas {hechas} de {total}</span>
            )}
            .
          </p>

          <p className="mt-3 text-sm text-white/60">
            El curso sigue un orden porque cada módulo da por sabido el anterior. No es
            una restricción: es que lo que viene después se entiende mucho mejor con lo
            de antes ya visto.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {siguienteSlug && (
              <Link
                href={`/cursos/${courseSlug}/${siguienteSlug}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-light to-brand px-5 py-3 font-medium text-white transition hover:opacity-90"
              >
                Continuar por donde ibas
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            <Link
              href={`/cursos/${courseSlug}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Ver el temario
            </Link>
          </div>

          {siguienteTitulo && (
            <p className="mt-4 text-sm text-white/50">
              Siguiente: {siguienteTitulo}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-white/40">{courseTitle}</p>
      </div>
    </div>
  )
}

export default LessonLocked
