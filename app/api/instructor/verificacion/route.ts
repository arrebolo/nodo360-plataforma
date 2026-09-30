import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * SOLICITAR UNA VERIFICACION
 *
 * La pide el candidato para SI MISMO. La identidad sale de auth.uid() y nunca
 * del cuerpo de la peticion: PostgREST es alcanzable y la clave anonima es
 * publica, asi que aceptar un user_id de quien llama seria dejar abrir
 * expedientes a nombre de cualquiera.
 *
 * Va con el cliente de servicio porque desde la 093 `authenticated` no tiene
 * INSERT sobre instructor_certifications. Eso es a proposito: las
 * verificaciones no se dan de alta desde una sesion.
 *
 * Quien decide sigue siendo el evaluador, en /admin/verificaciones. Esto solo
 * abre el expediente en «pendiente».
 */

const ROLES_QUE_ENSENAN = ['instructor', 'mentor', 'admin']

/** NODO360-INS-2026-A1B2C3D4 */
function numeroDeVerificacion() {
  const azar = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('').toUpperCase()
  return `NODO360-INS-${new Date().getFullYear()}-${azar}`
}

export async function POST(req: NextRequest) {
  const limite = await checkRateLimit(req, 'api')
  if (limite) return limite

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const rol = perfil?.role ?? 'student'
  if (!ROLES_QUE_ENSENAN.includes(rol)) {
    return NextResponse.json(
      { error: 'Solo quien ya enseña o media puede pedir una verificacion' },
      { status: 403 }
    )
  }

  let cuerpo: { specialty_id?: unknown; consentimiento_anuncio?: unknown }
  try {
    cuerpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo no valido' }, { status: 400 })
  }
  const specialtyId = typeof cuerpo.specialty_id === 'string' ? cuerpo.specialty_id : null
  if (!specialtyId) {
    return NextResponse.json({ error: 'Falta specialty_id' }, { status: 400 })
  }

  // El consentimiento para el anuncio publico. Opcional, y por defecto NO.
  //
  // Solo se acepta el booleano verdadero: cualquier otra cosa que llegue en el
  // cuerpo —una cadena, un 1, un objeto— cuenta como no consentido. Un
  // consentimiento que se pueda dar por accidente no es un consentimiento.
  const consiente = cuerpo.consentimiento_anuncio === true

  const db = createAdminClient() as unknown as SupabaseClient

  const { data: esp } = await db
    .from('instructor_specialties')
    .select('id, nombre, is_active')
    .eq('id', specialtyId)
    .maybeSingle()
  if (!esp || !esp.is_active) {
    return NextResponse.json({ error: 'Esa especialidad no esta disponible' }, { status: 400 })
  }

  // EL EXPEDIENTE, CON EL CONSENTIMIENTO SI LA BASE LO ADMITE.
  //
  // Esto estuvo ROTO en produccion: el insert incluia consentimiento_anuncio y la
  // 108 no estaba aplicada, asi que PostgREST devolvia
  // «PGRST204 Could not find the 'consentimiento_anuncio' column» y NADIE PODIA
  // PEDIR UNA VERIFICACION. Medido contra la base, no deducido.
  //
  // Un insert con una columna que no existe no se degrada solo: PostgREST lo
  // rechaza entero antes de llegar a Postgres. Asi que se intenta con las columnas
  // y, si no estan, se repite sin ellas: mientras la migracion no este, el
  // consentimiento no se puede guardar y por tanto no se anunciara nada, que es
  // exactamente el comportamiento seguro.
  const base = {
    // La identidad, del servidor. No del cuerpo.
    user_id: user.id,
    specialty_id: specialtyId,
    certification_number: numeroDeVerificacion(),
    oral_result: 'pendiente',
    practical_result: 'pendiente',
  }

  const conConsentimiento = {
    ...base,
    // La fecha va con el consentimiento o no va: lo exige el CHECK de la 108,
    // porque un consentimiento sin fecha no se puede demostrar.
    consentimiento_anuncio: consiente,
    consentimiento_anuncio_el: consiente ? new Date().toISOString() : null,
  }

  let { data: fila, error } = await db
    .from('instructor_certifications')
    .insert(conConsentimiento)
    .select('id, certification_number')
    .single()

  if (error && (error.code === 'PGRST204' || error.code === '42703')) {
    console.warn('[instructor/verificacion] Sin columnas de consentimiento (¿falta la 108?): se guarda sin el')
    ;({ data: fila, error } = await db
      .from('instructor_certifications')
      .insert(base)
      .select('id, certification_number')
      .single())
  }

  if (error) {
    // 23505: el indice unico parcial de la 092. Ya hay una viva —pendiente o
    // aprobada— de esa especialidad para esta persona.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Ya tienes una verificacion pendiente o aprobada de ${esp.nombre}` },
        { status: 409 }
      )
    }
    console.error('[instructor/verificacion] Error al solicitar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sin error y sin fila no deberia pasar, pero el tipo lo admite desde que hay
  // reintento, y prefiero un 500 explicado a un fallo al leer una propiedad.
  if (!fila) {
    console.error('[instructor/verificacion] El insert no devolvio fila y no dio error')
    return NextResponse.json({ error: 'No se pudo crear la solicitud' }, { status: 500 })
  }

  console.log(`[instructor/verificacion] ${user.id} solicita ${esp.nombre} (${fila.certification_number})`)
  return NextResponse.json({ success: true, data: fila })
}
