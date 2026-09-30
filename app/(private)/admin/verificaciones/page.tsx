import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BadgeCheck, Clock, XCircle, Ban, Award } from 'lucide-react'
import AbrirExpediente from '@/components/admin/AbrirExpediente'
import ResolverExpediente from '@/components/admin/ResolverExpediente'

export const metadata = {
  title: 'Verificaciones de instructor',
}

export const dynamic = 'force-dynamic'

const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente', icono: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  aprobada: { etiqueta: 'Aprobada', icono: BadgeCheck, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  rechazada: { etiqueta: 'Rechazada', icono: XCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  retirada: { etiqueta: 'Retirada', icono: Ban, color: 'text-gray-400 bg-white/5 border-white/10' },
} as const

export default async function VerificacionesPage() {
  await requireAdmin()

  // Cliente de servicio: desde la 093 `authenticated` no escribe aqui, y la
  // lectura completa —con accreditation_ref y las notas— es solo de
  // administracion. La pagina ya esta detras de requireAdmin().
  const db = createAdminClient() as unknown as SupabaseClient

  const { data: expedientes } = await db
    .from('instructor_certifications')
    .select(`
      id, certification_number, status, issued_at, expires_at, revoked_at, revoked_reason,
      oral_result, practical_result, evaluator_notes, evaluator_is_external,
      accreditation_type, accreditation_ref, attempt_id, created_at, updated_at,
      rechazada_el,
      users!user_id ( id, full_name, email ),
      instructor_specialties ( id, nombre, slug, requiere_acreditacion, permite_evaluador_externo )
    `)
    .order('created_at', { ascending: false })

  const { data: especialidades } = await db
    .from('instructor_specialties')
    .select('id, nombre, slug, requiere_acreditacion, permite_evaluador_externo')
    .eq('is_active', true)
    .order('position')

  // Quien puede tener un expediente: quien ya enseña o media.
  const { data: candidatos } = await db
    .from('users')
    .select('id, full_name, email, role')
    .in('role', ['instructor', 'mentor'])
    .order('full_name')

  const lista = expedientes ?? []
  const pendientes = lista.filter((e: any) => e.status === 'pendiente')
  const resueltos = lista.filter((e: any) => e.status !== 'pendiente')

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Award className="w-6 h-6 text-orange-400" aria-hidden="true" />
          Verificaciones de instructor
        </h1>
        <p className="text-white/60 mt-2 text-sm leading-relaxed">
          El examen mide; aquí decide una persona. Para aprobar hacen falta las
          repreguntas y la parte práctica <strong className="text-white/80">aptas</strong>, y
          en las especialidades que lo exigen, la acreditación.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Abrir un expediente</h2>
        {candidatos?.length && especialidades?.length ? (
          <AbrirExpediente
            candidatos={candidatos as any}
            especialidades={especialidades as any}
          />
        ) : (
          <p className="text-white/50 text-sm">
            {!candidatos?.length
              ? 'No hay nadie con rol de instructor o mentor todavía.'
              : 'No hay especialidades activas. ¿Se aplicó la migración 090?'}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Pendientes ({pendientes.length})
        </h2>
        {pendientes.length === 0 ? (
          <p className="text-white/50 text-sm rounded-xl border border-white/10 bg-white/5 p-6">
            Nada pendiente.
          </p>
        ) : (
          <div className="space-y-4">
            {pendientes.map((e: any) => (
              <Expediente key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>

      {resueltos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Resueltos ({resueltos.length})
          </h2>
          <div className="space-y-4">
            {resueltos.map((e: any) => (
              <Expediente key={e.id} e={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Expediente({ e }: { e: any }) {
  const estado = ESTADOS[e.status as keyof typeof ESTADOS] ?? ESTADOS.pendiente
  const Icono = estado.icono
  const persona = e.users
  const esp = e.instructor_specialties
  const fecha = (v: string | null) => (v ? new Date(v).toLocaleDateString('es-ES') : '—')

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">
            {persona?.full_name || persona?.email || 'Sin nombre'}
          </p>
          <p className="text-sm text-white/60">
            {esp?.nombre}
            {esp?.requiere_acreditacion && (
              <span className="ml-2 text-xs text-amber-400">requiere acreditación</span>
            )}
          </p>
          <p className="text-xs text-white/40 mt-1">N.º {e.certification_number}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${estado.color}`}>
          <Icono className="w-3.5 h-3.5" aria-hidden="true" />
          {estado.etiqueta}
        </span>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
        <div>
          <dt className="text-white/40">Repreguntas</dt>
          <dd className="text-white/80">{e.oral_result ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-white/40">Práctica</dt>
          <dd className="text-white/80">{e.practical_result ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-white/40">Intento de examen</dt>
          <dd className="text-white/80">{e.attempt_id ? 'sí' : 'sin examen'}</dd>
        </div>
        <div>
          <dt className="text-white/40">{e.status === 'aprobada' ? 'Caduca' : 'Abierto'}</dt>
          <dd className="text-white/80">
            {e.status === 'aprobada' ? fecha(e.expires_at) : fecha(e.created_at)}
          </dd>
        </div>
      </dl>

      {/*
        LO RESUELTO SE CUENTA, NO SE DEJA EN BLANCO.
        Una rechazada o una retirada no ofrecen acciones —el formulario solo sale
        para pendiente y aprobada—, asi que si no se dice aqui por que y cuando, la
        tarjeta se queda muda justo en los dos casos en los que hay algo que
        explicar. El motivo de una retirada vive en revoked_reason, no en
        evaluator_notes: son campos distintos y antes solo se pintaba el segundo.
      */}
      {e.status === 'retirada' && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/40">
            Retirada el {fecha(e.revoked_at)}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {e.revoked_reason ?? 'Sin motivo registrado.'}
          </p>
        </div>
      )}

      {e.status === 'rechazada' && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/40">
            Rechazada el {fecha(e.rechazada_el ?? e.updated_at ?? e.created_at)}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {e.evaluator_notes ?? 'Sin motivo registrado.'}
          </p>
          <p className="mt-2 text-xs text-white/40">
            Puede volver a solicitarla 30 días después del rechazo.
          </p>
        </div>
      )}

      {/*
        Las notas sueltas, SOLO para lo que esta sin resolver.
        En una retirada, la ruta escribe la nota en evaluator_notes Y en
        revoked_reason —comprobado: las dos columnas son identicas—, asi que
        pintar las dos mostraba el motivo dos veces. Cuando el expediente esta
        resuelto, el motivo lo cuenta su propio recuadro y aqui no hace falta.
      */}
      {e.evaluator_notes && e.status !== 'rechazada' && e.status !== 'retirada' && (
        <p className="mt-3 text-sm text-white/60 border-l-2 border-white/10 pl-3">
          {e.evaluator_notes}
        </p>
      )}

      {(e.status === 'pendiente' || e.status === 'aprobada') && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <ResolverExpediente
            id={e.id}
            estado={e.status}
            requiereAcreditacion={!!esp?.requiere_acreditacion}
            permiteEvaluadorExterno={!!esp?.permite_evaluador_externo}
            oralActual={e.oral_result}
            practicaActual={e.practical_result}
          />
        </div>
      )}
    </article>
  )
}
