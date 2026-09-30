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

  const { data: fila, error } = await db
    .from('instructor_certifications')
    .insert({
      // La identidad, del servidor. No del cuerpo.
      user_id: user.id,
      specialty_id: specialtyId,
      certification_number: numeroDeVerificacion(),
      oral_result: 'pendiente',
      practical_result: 'pendiente',
      // La fecha va con el consentimiento o no va: lo exige el CHECK de la 108,
      // porque un consentimiento sin fecha no se puede demostrar.
      consentimiento_anuncio: consiente,
      consentimiento_anuncio_el: consiente ? new Date().toISOString() : null,
    })
    .select('id, certification_number')
    .single()

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

  console.log(`[instructor/verificacion] ${user.id} solicita ${esp.nombre} (${fila.certification_number})`)
  return NextResponse.json({ success: true, data: fila })
}
