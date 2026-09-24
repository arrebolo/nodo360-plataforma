import Link from 'next/link'
import { Award, CheckCircle2 } from 'lucide-react'
import { DiscordIcon } from '@/components/lesson/CommunityIcons'
import { DISCORD_LINK_PROPS } from '@/lib/discord/invite'

type Props = {
  /** Fecha de finalizacion (ISO). Se muestra si viene. */
  completedAt?: string | null
  /** Id del certificado, si lo hay, para enlazarlo. */
  certificateId?: string | null
  /** Numero del certificado, para mostrarlo junto al enlace. */
  certificateNumber?: string | null
  /** 'curso' en la ficha, 'leccion' al entrar a repasar. */
  contexto?: 'curso' | 'leccion'
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
 */
export function CourseAlreadyCompleted({
  completedAt,
  certificateId,
  certificateNumber,
  contexto = 'curso',
}: Props) {
  const fecha = completedAt ? formatearFecha(completedAt) : null

  return (
    <div
      role="status"
      className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold text-green-300">Ya has completado este curso</p>

          {fecha && (
            <p className="mt-0.5 text-sm text-white/70">Lo terminaste el {fecha}.</p>
          )}

          <p className="mt-2 text-sm text-white/70">
            {contexto === 'leccion'
              ? 'Puedes repasar las lecciones siempre que quieras. '
              : 'Puedes volver a repasarlo cuando quieras. '}
            Ten en cuenta que{' '}
            <strong className="text-white/90">no vuelve a sumar experiencia</strong>: cada
            recompensa se concede una sola vez.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {certificateId && (
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
            Comenta el curso y resuelve dudas en la comunidad de Discord.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CourseAlreadyCompleted
