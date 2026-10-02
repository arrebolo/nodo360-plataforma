import Link from 'next/link'
import { Award, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { DiscordIcon } from '@/components/lesson/CommunityIcons'
import { DISCORD_LINK_PROPS } from '@/lib/discord/invite'
import { PedirCertificado } from '@/components/certificates/PedirCertificado'

type Props = {
  /** Fecha de finalizacion (ISO). Se muestra si viene. */
  completedAt?: string | null
  /** Id del certificado, si lo hay, para enlazarlo. */
  certificateId?: string | null
  /**
   * Hace falta para poder emitirlo desde aquí: cumple las condiciones y no lo tiene.
   * Sin esto, el aviso decía «lo terminaste» y no ofrecía nada, que es un callejón sin
   * salida para quien aprobó el examen y llegó al 100 % más tarde.
   */
  cursoId?: string | null
  /** Numero del certificado, para mostrarlo junto al enlace. */
  certificateNumber?: string | null
  /** 'curso' en la ficha, 'leccion' al entrar a repasar. */
  contexto?: 'curso' | 'leccion'
  /**
   * Ha terminado las lecciones pero le falta aprobar el examen final, asi que
   * todavia no hay certificado. Sin esto, el enlace al certificado simplemente
   * no aparecia y no habia nada que explicara por que.
   */
  examenPendiente?: boolean
  /** Slug del curso, para enlazar el examen cuando esta pendiente. */
  cursoSlug?: string | null
  /**
   * Lecciones anadidas al curso DESPUES de que lo terminara.
   *
   * Con 0 el aviso es el de siempre. Por encima de 0 cambia de mensaje: decir
   * "ya has completado este curso" cuando quedan lecciones nuevas por leer es
   * falso, y decir "te faltan 3 lecciones" a quien ya tiene su certificado
   * tambien. El estado lo calcula estadoDeLaMatricula() en
   * @/lib/progress/estadoMatricula.
   */
  leccionesNuevas?: number
}

function formatearFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return null
  }
}

/**
 * Aviso de que el curso ya esta completado.
 *
 * Dice explicitamente que repasar no vuelve a sumar experiencia. Desde la 037
 * las recompensas son idempotentes —una por usuario y fuente—, asi que volver
 * a pasar por las lecciones no suma XP. Sin este aviso, el usuario lo
 * descubriria por su cuenta y pareceria un fallo.
 *
 * Y desde el 25/09/2026 el certificado exige aprobar el examen final, no solo
 * marcar las lecciones. Cuando falta ese paso hay que DECIRLO: antes, el enlace
 * al certificado no aparecia y no habia ninguna explicacion, que es la peor de
 * las dos opciones. Un paso que falta y un fallo se parecen mucho cuando la
 * pantalla no dice nada.
 */
export function CourseAlreadyCompleted({
  completedAt,
  certificateId,
  cursoId,
  certificateNumber,
  contexto = 'curso',
  examenPendiente = false,
  cursoSlug = null,
  leccionesNuevas = 0,
}: Props) {
  const fecha = completedAt ? formatearFecha(completedAt) : null
  const ampliado = leccionesNuevas > 0 && !examenPendiente
  // Si falta el examen, el certificado no existe todavia: no se enlaza.
  const mostrarCertificado = !!certificateId && !examenPendiente
  // Cumple y no lo tiene: se puede emitir. El servidor vuelve a comprobarlo.
  const puedeEmitirlo = !certificateId && !examenPendiente && !!cursoId

  return (
    <div
      role="status"
      className={`rounded-xl border p-4 sm:p-5 ${
        examenPendiente
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-green-500/30 bg-green-500/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {examenPendiente ? (
          <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className={`font-semibold ${examenPendiente ? 'text-amber-300' : 'text-green-300'}`}>
            {examenPendiente
              ? 'Has terminado las lecciones. Queda el examen final'
              : ampliado
                ? 'Completaste este curso, y desde entonces ha crecido'
                : 'Ya has completado este curso'}
          </p>

          {fecha && (
            <p className="mt-0.5 text-sm text-white/70">
              {examenPendiente
                ? `Terminaste las lecciones el ${fecha}.`
                : ampliado
                  ? `Lo terminaste el ${fecha}, sobre el temario de entonces.`
                  : `Lo terminaste el ${fecha}.`}
            </p>
          )}

          {examenPendiente ? (
            <>
              <p className="mt-2 text-sm text-white/80">
                No ha fallado nada: <strong className="text-white/95">el certificado
                se emite al aprobar el examen</strong>, y no tendrás que volver a marcar
                ninguna lección.
              </p>
              <p className="mt-2 text-sm text-white/70">
                Las preguntas se sortean entre las de todos los módulos, se aprueba con un
                70% y puedes intentarlo tantas veces como quieras. Al fallar verás la
                respuesta correcta y por qué lo es.
              </p>
            </>
          ) : ampliado ? (
            <>
              <p className="mt-2 text-sm text-white/80">
                {leccionesNuevas === 1
                  ? 'Se ha añadido una lección nueva'
                  : `Se han añadido ${leccionesNuevas} lecciones nuevas`}{' '}
                después de que lo terminaras.{' '}
                <strong className="text-white/95">Tu certificado sigue siendo válido</strong>:
                acredita el temario que había el día que lo completaste.
              </p>
              <p className="mt-2 text-sm text-white/70">
                Puedes leer lo nuevo cuando quieras. No vuelve a sumar experiencia:
                cada recompensa se concede una sola vez.
              </p>
            </>
          ) : puedeEmitirlo ? (
            <p className="mt-2 text-sm text-white/80">
              Tienes el curso completo y el examen aprobado:{' '}
              <strong className="text-white/95">tu certificado está listo para emitirse</strong>.
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/70">
              {contexto === 'leccion'
                ? 'Puedes repasar las lecciones siempre que quieras. '
                : 'Puedes volver a repasarlo cuando quieras. '}
              Ten en cuenta que{' '}
              <strong className="text-white/90">no vuelve a sumar experiencia</strong>: cada
              recompensa se concede una sola vez.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {examenPendiente && cursoSlug && (
              <Link
                href={`/cursos/${cursoSlug}/quiz-final`}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-1.5
                           text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30"
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Hacer el examen final
              </Link>
            )}

            {puedeEmitirlo && cursoId && (
              <PedirCertificado courseId={cursoId} />
            )}

            {mostrarCertificado && (
              <Link
                href={`/certificados/${certificateId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5
                           text-sm text-white transition hover:bg-white/15"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                Ver tu certificado
                {certificateNumber && (
                  <span className="text-white/50">· {certificateNumber}</span>
                )}
              </Link>
            )}

            {/* Terminar un curso es el momento con mas ganas de preguntar y de
                contar lo aprendido, asi que es donde tiene sentido ofrecer la
                comunidad. */}
            <a
              {...DISCORD_LINK_PROPS}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2]/15 px-3 py-1.5
                         text-sm text-white transition hover:bg-[#5865F2]/25"
            >
              <DiscordIcon className="h-4 w-4" />
              Comenta el curso en Discord
            </a>
          </div>

          <p className="mt-2 text-xs text-white/50">
            {examenPendiente
              ? 'Si algo del examen no te cuadra, preguntalo en la comunidad de Discord.'
              : 'Comenta el curso y resuelve dudas en la comunidad de Discord.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CourseAlreadyCompleted
