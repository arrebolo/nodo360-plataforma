import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createInAppNotification } from '@/lib/notifications/broadcast'
import {
  enviarVerificacionAprobada,
  enviarVerificacionRechazada,
  DIAS_DE_ESPERA_TRAS_RECHAZO,
} from '@/lib/email/verificacion'
import { anunciarVerificacionAprobada } from '@/lib/anuncios/verificacion-de-instructor'

/**
 * VERIFICACIONES DE INSTRUCTOR
 *
 * POST  abre un expediente en «pendiente» para una persona y una especialidad.
 * PATCH lo resuelve: aprobada, rechazada o retirada.
 *
 * El examen mide; aqui decide una persona. Hasta la 092 la certificacion la
 * emitia sola submit/route.ts cuando la puntuacion pasaba del umbral, lo que
 * convertia un test de opcion multiple en la unica barrera para poder enseñar.
 *
 * Se escribe con el cliente de SERVICIO, y no por descuido: desde la 093
 * `authenticated` no tiene INSERT ni UPDATE sobre instructor_certifications.
 * Ninguna sesion puede dar de alta una verificacion desde PostgREST.
 *
 * El casteo de createAdminClient existe porque lib/supabase/types.ts esta
 * desfasado y no conoce las tablas instructor_*. Regenerar los tipos es su
 * propia tarea; mientras, se aisla aqui.
 */

/** El admin de la sesion, o null. No redirige: esto es una API. */
async function adminDeLaSesion() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return perfil?.role === 'admin' ? user : null
}

/** NODO360-INS-2026-A1B2C3D4 */
function numeroDeVerificacion() {
  const azar = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('').toUpperCase()
  return `NODO360-INS-${new Date().getFullYear()}-${azar}`
}

const RESULTADOS = ['pendiente', 'apto', 'no_apto'] as const
const DECISIONES = ['aprobada', 'rechazada', 'retirada'] as const

// ---------------------------------------------------------------------------
// POST · abrir expediente
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const limite = await checkRateLimit(req, 'api')
  if (limite) return limite

  const admin = await adminDeLaSesion()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let cuerpo: { user_id?: unknown; specialty_id?: unknown }
  try {
    cuerpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo no valido' }, { status: 400 })
  }

  const userId = typeof cuerpo.user_id === 'string' ? cuerpo.user_id : null
  const specialtyId = typeof cuerpo.specialty_id === 'string' ? cuerpo.specialty_id : null
  if (!userId || !specialtyId) {
    return NextResponse.json({ error: 'Hacen falta user_id y specialty_id' }, { status: 400 })
  }

  const db = createAdminClient() as unknown as SupabaseClient

  const { data: persona } = await db.from('users').select('id, full_name').eq('id', userId).maybeSingle()
  if (!persona) return NextResponse.json({ error: 'Esa persona no existe' }, { status: 404 })

  const { data: especialidad } = await db
    .from('instructor_specialties')
    .select('id, nombre, is_active')
    .eq('id', specialtyId)
    .maybeSingle()
  if (!especialidad) return NextResponse.json({ error: 'Esa especialidad no existe' }, { status: 404 })
  if (!especialidad.is_active) {
    return NextResponse.json({ error: 'Esa especialidad esta desactivada' }, { status: 400 })
  }

  const { data: fila, error } = await db
    .from('instructor_certifications')
    .insert({
      user_id: userId,
      specialty_id: specialtyId,
      certification_number: numeroDeVerificacion(),
      oral_result: 'pendiente',
      practical_result: 'pendiente',
    })
    .select('id, certification_number')
    .single()

  if (error) {
    // 23505 es el indice unico parcial de la 092: ya hay una viva —pendiente o
    // aprobada— para esa persona y esa especialidad.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ya hay una verificacion viva de esa especialidad para esa persona' },
        { status: 409 }
      )
    }
    console.error('[admin/verificaciones] Error al abrir expediente:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[admin/verificaciones] Expediente ${fila.certification_number} abierto por ${admin.id}`)
  return NextResponse.json({ success: true, data: fila })
}

// ---------------------------------------------------------------------------
// PATCH · resolver expediente
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const limite = await checkRateLimit(req, 'api')
  if (limite) return limite

  const admin = await adminDeLaSesion()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let c: Record<string, unknown>
  try {
    c = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo no valido' }, { status: 400 })
  }

  const id = typeof c.id === 'string' ? c.id : null
  const decision = typeof c.decision === 'string' ? c.decision : null
  const notas = typeof c.evaluator_notes === 'string' ? c.evaluator_notes.trim() : ''
  const oral = typeof c.oral_result === 'string' ? c.oral_result : null
  const practica = typeof c.practical_result === 'string' ? c.practical_result : null
  const externo = c.evaluator_is_external === true
  const tipoAcred = typeof c.accreditation_type === 'string' ? c.accreditation_type.trim() : ''
  const refAcred = typeof c.accreditation_ref === 'string' ? c.accreditation_ref.trim() : ''

  if (!id || !decision || !(DECISIONES as readonly string[]).includes(decision)) {
    return NextResponse.json(
      { error: `decision debe ser una de: ${DECISIONES.join(', ')}` },
      { status: 400 }
    )
  }
  for (const [nombre, valor] of [['oral_result', oral], ['practical_result', practica]] as const) {
    if (valor !== null && !(RESULTADOS as readonly string[]).includes(valor)) {
      return NextResponse.json({ error: `${nombre} debe ser ${RESULTADOS.join(', ')}` }, { status: 400 })
    }
  }

  const db = createAdminClient() as unknown as SupabaseClient

  // Las columnas del consentimiento llegan con la 108, y pedirlas antes NO
  // devuelve la fila sin ellas: devuelve 42703 y tumba la consulta, asi que este
  // expediente saldria como «no existe» y NO SE PODRIA APROBAR NADA. Por eso se
  // piden y, si fallan, se repite sin ellas: da igual si se despliega antes o
  // despues de aplicar la migracion, y lo unico que falta mientras es el anuncio.
  const CAMPOS = 'id, status, user_id, specialty_id, exam_id'
  let { data: exp } = await db
    .from('instructor_certifications')
    .select(`${CAMPOS}, consentimiento_anuncio, anunciado_el`)
    .eq('id', id)
    .maybeSingle()

  if (!exp) {
    const reintento = await db
      .from('instructor_certifications')
      .select(CAMPOS)
      .eq('id', id)
      .maybeSingle()
    if (reintento.data) {
      console.warn('[admin/verificaciones] Sin columnas de consentimiento (¿falta la 108?): no se anunciara')
      exp = { ...reintento.data, consentimiento_anuncio: false, anunciado_el: null }
    }
  }

  if (!exp) return NextResponse.json({ error: 'Ese expediente no existe' }, { status: 404 })

  // Las transiciones posibles. Un expediente ya resuelto no se reabre: se abre
  // otro, que es justo lo que permite el indice unico parcial de la 092.
  const PERMITIDAS: Record<string, string[]> = {
    pendiente: ['aprobada', 'rechazada'],
    aprobada: ['retirada'],
    rechazada: [],
    retirada: [],
  }
  if (!PERMITIDAS[exp.status]?.includes(decision)) {
    return NextResponse.json(
      { error: `Un expediente en «${exp.status}» no puede pasar a «${decision}»` },
      { status: 409 }
    )
  }

  const cambios: Record<string, unknown> = {
    evaluator_id: admin.id,
    evaluator_is_external: externo,
    updated_at: new Date().toISOString(),
  }
  if (notas) cambios.evaluator_notes = notas
  if (oral) cambios.oral_result = oral
  if (practica) cambios.practical_result = practica

  if (decision === 'aprobada') {
    // Las dos partes no automaticas tienen que estar aptas. Es la regla del
    // diseño: el examen mide, las repreguntas y la practica deciden.
    if (oral !== 'apto' || practica !== 'apto') {
      return NextResponse.json(
        { error: 'Para aprobar, las repreguntas y la parte practica tienen que estar aptas' },
        { status: 400 }
      )
    }

    // Y si la especialidad exige acreditacion, tiene que constar
    const { data: esp } = await db
      .from('instructor_specialties')
      .select('nombre, requiere_acreditacion')
      .eq('id', exp.specialty_id)
      .maybeSingle()

    if (esp?.requiere_acreditacion && (!tipoAcred || !refAcred)) {
      return NextResponse.json(
        { error: `«${esp.nombre}» exige acreditacion: hacen falta el tipo y la referencia` },
        { status: 400 }
      )
    }
    if (tipoAcred) cambios.accreditation_type = tipoAcred
    if (refAcred) {
      cambios.accreditation_ref = refAcred
      cambios.accreditation_verified_at = new Date().toISOString()
    }

    // La validez sale del examen si lo hay; si no, dos años.
    let años = 2
    if (exp.exam_id) {
      const { data: examen } = await db
        .from('instructor_exams')
        .select('certification_validity_years')
        .eq('id', exp.exam_id)
        .maybeSingle()
      if (examen?.certification_validity_years) años = examen.certification_validity_years
    }
    const caduca = new Date()
    caduca.setFullYear(caduca.getFullYear() + años)

    cambios.status = 'aprobada'
    cambios.issued_at = new Date().toISOString()
    cambios.expires_at = caduca.toISOString()
  }

  if (decision === 'rechazada') {
    if (!notas) {
      return NextResponse.json(
        { error: 'Un rechazo necesita explicarse: escribe las notas' },
        { status: 400 }
      )
    }
    cambios.status = 'rechazada'
    // La fecha del rechazo, para contar los 30 dias. Se usa updated_at? No:
    // updated_at cambia por cualquier otra cosa y el plazo dejaria de ser el plazo.
    // La columna llega con la 108; si no esta, se quita mas abajo.
    cambios.rechazada_el = new Date().toISOString()
  }

  if (decision === 'retirada') {
    if (!notas) {
      return NextResponse.json(
        { error: 'Una retirada necesita explicarse: escribe el motivo' },
        { status: 400 }
      )
    }
    cambios.status = 'retirada'
    cambios.revoked_at = new Date().toISOString()
    cambios.revoked_reason = notas
  }

  let { error } = await db.from('instructor_certifications').update(cambios).eq('id', id)

  // rechazada_el llega con la 108. Sin ella, PostgREST rechaza el UPDATE entero
  // con PGRST204 y no se podria rechazar nada: se repite sin esa columna.
  if (error && (error.code === 'PGRST204' || error.code === '42703')) {
    console.warn('[admin/verificaciones] Sin columna rechazada_el (¿falta la 108?): se resuelve sin ella')
    const { rechazada_el: _fuera, ...sinColumna } = cambios
    ;({ error } = await db.from('instructor_certifications').update(sinColumna).eq('id', id))
  }

  if (error) {
    console.error('[admin/verificaciones] Error al resolver:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // APROBAR SUBE A INSTRUCTOR, Y NUNCA BAJA NADA.
  //
  // Sin esto, alguien con la verificacion aprobada seguia siendo `student` y no
  // podia entrar en el panel de instructor: aprobar no servia de nada.
  //
  // Y solo sube a quien es student. A un admin, un mentor o un council NO se les
  // toca el rol: para ellos «instructor» seria un descenso, y ademas la 100
  // bloquea en la base cualquier cambio de rol sobre una cuenta admin, asi que
  // intentarlo devolveria un error donde no hay ningun problema que resolver.
  if (decision === 'aprobada') {
    const { data: persona } = await db
      .from('users')
      .select('role')
      .eq('id', exp.user_id)
      .maybeSingle()

    if (persona?.role === 'student') {
      const { error: errorRol } = await db
        .from('users')
        .update({ role: 'instructor' })
        .eq('id', exp.user_id)
        .eq('role', 'student')   // cinturon: si cambio entre la lectura y esto, no se escribe

      if (errorRol) {
        // No se falla la peticion: la verificacion ya esta aprobada, que es lo
        // que importa. Queda en el log para poder arreglarlo a mano.
        console.error('[admin/verificaciones] Aprobada, pero no se pudo subir el rol:', errorRol)
      } else {
        console.log(`[admin/verificaciones] ${exp.user_id} sube de student a instructor`)
      }
    } else {
      console.log(`[admin/verificaciones] ${exp.user_id} ya es ${persona?.role}: el rol no se toca`)
    }
  }

  // ── AVISAR A LA PERSONA, SIEMPRE ──────────────────────────────────────────
  //
  // Antes no se avisaba de nada: quien solicitaba una verificacion se enteraba
  // entrando a mirar. Va al final y envuelto en su propio try: la decision ya
  // esta grabada y un fallo del correo no puede deshacerla ni devolver un error
  // donde no hay ningun problema que resolver.
  //
  // La retirada no manda nada: no estaba en lo pedido, y una retirada se explica
  // hablando con la persona, no con una plantilla.
  if (decision === 'aprobada' || decision === 'rechazada') {
    try {
      const [{ data: persona }, { data: esp }] = await Promise.all([
        db.from('users').select('email, full_name').eq('id', exp.user_id).maybeSingle(),
        db.from('instructor_specialties').select('nombre').eq('id', exp.specialty_id).maybeSingle(),
      ])

      const nombre =
        (persona as { full_name: string | null } | null)?.full_name?.trim() ||
        (persona as { email: string | null } | null)?.email?.split('@')[0] ||
        'instructor'
      const correo = (persona as { email: string | null } | null)?.email ?? null
      const especialidad = (esp as { nombre: string } | null)?.nombre ?? 'la especialidad solicitada'

      // La jurisdiccion llegara con la migracion de especialidades por pais; hasta
      // entonces es null y los textos la omiten solos.
      const jurisdiccion: string | null = null

      if (decision === 'aprobada') {
        await createInAppNotification(
          exp.user_id,
          'verificacion_aprobada',
          `Verificación aprobada: ${especialidad}`,
          `Ya puedes crear cursos de ${especialidad} y enviarlos a revisión.`,
          '/dashboard/instructor'
        )
        if (correo) {
          const envio = await enviarVerificacionAprobada({ to: correo, nombre, especialidad, jurisdiccion })
          if (!envio.success) console.error('[admin/verificaciones] Correo de aprobacion NO enviado:', envio.error)
        }
      } else {
        // El plazo de espera se cuenta desde AHORA, que es cuando se rechaza, y la
        // misma fecha va al correo y a la regla de la base: si el correo dijera una
        // fecha y el sistema aceptara otra, el correo estaria mintiendo.
        const puedeVolverEl = new Date(Date.now() + DIAS_DE_ESPERA_TRAS_RECHAZO * 86400000)

        await createInAppNotification(
          exp.user_id,
          'verificacion_rechazada',
          `Sobre tu solicitud en ${especialidad}`,
          `El equipo de Nodo360 ha revisado tu solicitud. Puedes volver a solicitarla a partir del ${puedeVolverEl.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          '/dashboard/instructor/verificacion'
        )
        if (correo) {
          const envio = await enviarVerificacionRechazada({
            to: correo, nombre, especialidad, jurisdiccion,
            motivo: notas as string,   // un rechazo sin notas ya se rechazo arriba
            puedeVolverEl,
          })
          if (!envio.success) console.error('[admin/verificaciones] Correo de rechazo NO enviado:', envio.error)
        }
      }
    } catch (e) {
      console.error('[admin/verificaciones] Fallo al avisar a la persona:', e)
    }
  }

  // ── ANUNCIARLO, SOLO SI SE APRUEBA Y SOLO CON CONSENTIMIENTO ──────────────
  //
  // Las tres condiciones se comprueban aqui Y en la base (trigger de la 108):
  // aprobada, consentida y no anunciada todavia. Que el anuncio publique el
  // nombre de una persona es justo el motivo de no dejarlo en manos de una sola
  // comprobacion.
  if (decision === 'aprobada' && exp.consentimiento_anuncio && !exp.anunciado_el) {
    try {
      const [{ data: persona }, { data: esp }] = await Promise.all([
        db.from('users').select('full_name').eq('id', exp.user_id).maybeSingle(),
        db.from('instructor_specialties').select('nombre').eq('id', exp.specialty_id).maybeSingle(),
      ])

      const nombrePublico = (persona as { full_name: string | null } | null)?.full_name?.trim()
      const especialidad = (esp as { nombre: string } | null)?.nombre

      if (!nombrePublico || !especialidad) {
        console.warn('[admin/verificaciones] Sin nombre publico o especialidad: no se anuncia')
      } else {
        // SE RECLAMA ANTES DE PUBLICAR, Y NO SE COMPRUEBA.
        //
        // La version anterior leia anunciado_el, publicaba, y despues marcaba la
        // fecha. Entre la lectura y la marca cabe otra peticion: dos aprobaciones
        // a la vez publicaban dos veces el mismo anuncio. El cerrojo es este
        // UPDATE condicionado a IS NULL, que es atomico: quien recibe fila
        // publica, y no hay segundo.
        const { data: reclamada, error: errorReclamo } = await db
          .from('instructor_certifications')
          .update({ anunciado_el: new Date().toISOString() })
          .eq('id', id)
          .is('anunciado_el', null)
          .select('id')

        if (errorReclamo) {
          console.error('[admin/verificaciones] No se pudo reclamar el anuncio:', errorReclamo)
        } else if (!reclamada || reclamada.length === 0) {
          console.log('[admin/verificaciones] Otra peticion se llevo el anuncio: no se publica')
        } else {
          const r = await anunciarVerificacionAprobada({
            nombrePublico,
            especialidad,
            jurisdiccion: null,
            userId: exp.user_id,
          })

          // Si no salio por ningun canal, se SUELTA el cerrojo para poder
          // reintentarlo. Reclamado y no publicado dejaria el anuncio sin hacer
          // para siempre. En modo de prueba tampoco se queda marcado, y asi la
          // prueba se puede repetir sin desbloquear nada a mano.
          if (!r.algunoEnviado) {
            const { error: errorSuelta } = await db
              .from('instructor_certifications')
              .update({ anunciado_el: null })
              .eq('id', id)
            if (errorSuelta) {
              console.error('[admin/verificaciones] No se pudo soltar el cerrojo del anuncio:', errorSuelta)
            }
          }

          console.log(`[admin/verificaciones] Anuncio -> discord: ${r.discord}, telegram: ${r.telegram}`)
        }
      }
    } catch (e) {
      // Un canal caido no impide una aprobacion.
      console.error('[admin/verificaciones] Fallo al anunciar:', e)
    }
  }

  console.log(`[admin/verificaciones] Expediente ${id} -> ${decision} por ${admin.id}`)
  return NextResponse.json({ success: true })
}
