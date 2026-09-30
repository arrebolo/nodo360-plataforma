import { requireInstructorLike } from '@/lib/auth/requireInstructor'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Clock, BadgeCheck, XCircle, Ban, Award } from 'lucide-react'
import SolicitarVerificacion from '@/components/instructor/SolicitarVerificacion'

export const metadata = {
  title: 'Mi verificación | Instructor',
}

export const dynamic = 'force-dynamic'

const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente de evaluación', icono: Clock, color: 'text-amber-400' },
  aprobada: { etiqueta: 'Aprobada', icono: BadgeCheck, color: 'text-green-400' },
  rechazada: { etiqueta: 'Rechazada', icono: XCircle, color: 'text-red-400' },
  retirada: { etiqueta: 'Retirada', icono: Ban, color: 'text-gray-400' },
} as const

export default async function MiVerificacionPage() {
  const { userId } = await requireInstructorLike()
  const supabase = await createClient()

  // Cada uno lee sus propias certificaciones: es la politica de la 093. No hace
  // falta el cliente de servicio, y con el se estaria leyendo de mas.
  const { data: mias } = await supabase
    .from('instructor_certifications')
    .select(`
      id, certification_number, status, issued_at, expires_at,
      oral_result, practical_result, evaluator_notes, revoked_reason, created_at,
      instructor_specialties ( id, nombre, slug, requiere_acreditacion )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Por la vista de la 099, que ademas dice si la especialidad tiene examen
  // UTILIZABLE: uno activo cuyo banco de para servir una tanda completa. Cuatro
  // examenes antiguos existen con CERO preguntas, y prometer examen ahi dejaba a
  // la persona contra una pared cuando lo intentaba.
  const { data: especialidades } = await supabase
    .from('especialidades_publicas')
    .select('id, nombre, descripcion, requiere_acreditacion, tiene_examen')
    .order('position')

  const lista = mias ?? []
  // Las que ya tienen expediente vivo no se pueden volver a pedir: lo impide el
  // indice unico parcial de la 092, y aqui se quitan del desplegable para que
  // nadie choque contra un 409.
  const ocupadas = new Set(
    lista
      .filter((c: any) => c.status === 'pendiente' || c.status === 'aprobada')
      .map((c: any) => c.instructor_specialties?.id)
  )
  const disponibles = (especialidades ?? []).filter((e: any) => !ocupadas.has(e.id))

  const fecha = (v: string | null) => (v ? new Date(v).toLocaleDateString('es-ES') : '—')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link
          href="/dashboard/instructor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4 flex items-center gap-3">
          <Award className="w-6 h-6 text-orange-400" aria-hidden="true" />
          Mi verificación
        </h1>
        <p className="text-white/60 mt-2 text-sm leading-relaxed">
          Verificarse es por <strong className="text-white/80">especialidad</strong>, no por
          curso: estar verificado en Bitcoin no habilita para enseñar fiscalidad. Cada
          solicitud la evalúa una persona, con repreguntas y una parte práctica. El examen,
          cuando la especialidad lo tiene, es una parte y no la decisión.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Pedir una verificación</h2>
        {disponibles.length === 0 ? (
          <p className="text-white/50 text-sm">
            {especialidades?.length
              ? 'Ya has pedido todas las especialidades disponibles.'
              : 'No hay especialidades activas.'}
          </p>
        ) : (
          <SolicitarVerificacion especialidades={disponibles as any} />
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Mis solicitudes ({lista.length})
        </h2>
        {lista.length === 0 ? (
          <p className="text-white/50 text-sm rounded-xl border border-white/10 bg-white/5 p-6">
            Todavía no has pedido ninguna.
          </p>
        ) : (
          <div className="space-y-4">
            {lista.map((c: any) => {
              const estado = ESTADOS[c.status as keyof typeof ESTADOS] ?? ESTADOS.pendiente
              const Icono = estado.icono
              return (
                <article
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">
                        {c.instructor_specialties?.nombre}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        N.º {c.certification_number} · pedida el {fecha(c.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-sm ${estado.color}`}>
                      <Icono className="w-4 h-4" aria-hidden="true" />
                      {estado.etiqueta}
                    </span>
                  </div>

                  {c.status === 'aprobada' && (
                    <p className="mt-3 text-sm text-white/60">
                      Desde el {fecha(c.issued_at)}
                      {c.expires_at && <> · vigente hasta el {fecha(c.expires_at)}</>}
                    </p>
                  )}

                  {c.status === 'pendiente' && (
                    <dl className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div>
                        <dt className="text-white/40">Repreguntas</dt>
                        <dd className="text-white/80">{c.oral_result ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-white/40">Parte práctica</dt>
                        <dd className="text-white/80">{c.practical_result ?? '—'}</dd>
                      </div>
                    </dl>
                  )}

                  {(c.evaluator_notes || c.revoked_reason) && (
                    <div className="mt-3 border-l-2 border-white/10 pl-3">
                      <p className="text-xs text-white/40 mb-1">Del evaluador</p>
                      <p className="text-sm text-white/70">
                        {c.revoked_reason || c.evaluator_notes}
                      </p>
                    </div>
                  )}

                  {c.status === 'rechazada' && (
                    <p className="mt-3 text-xs text-white/40">
                      Puedes volver a pedirla cuando quieras.
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
