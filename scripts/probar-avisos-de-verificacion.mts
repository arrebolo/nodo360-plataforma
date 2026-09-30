/**
 * Prueba de los avisos y del anuncio de una verificación de instructor.
 *
 *   npx tsx scripts/probar-avisos-de-verificacion.mts
 *
 * NO PUBLICA NADA EN DISCORD NI EN TELEGRAM. Dos barreras, y las dos se
 * comprueban e imprimen al empezar:
 *
 *   1. El script fuerza `ANUNCIOS_MODO_PRUEBA=1`, así que el módulo de anuncios
 *      registra por consola el mensaje exacto que habría publicado y no llama a
 *      ninguna API.
 *   2. En `.env.local` no hay `DISCORD_WEBHOOK_ANNOUNCEMENTS` ni
 *      `TELEGRAM_BOT_TOKEN`, así que incluso sin el modo de prueba no habría a
 *      dónde enviar. Se verifica en vez de suponerlo.
 *
 * LOS CORREOS SÍ SE ENVÍAN DE VERDAD, a la dirección de la cuenta de pruebas,
 * porque es justo lo que había que comprobar.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// El entorno, antes de nada: los módulos leen process.env cuando se les llama.
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v as string
process.env.ANUNCIOS_MODO_PRUEBA = '1'

const { enviarVerificacionAprobada, enviarVerificacionRechazada } = await import('@/lib/email/verificacion')
const { anunciarVerificacionAprobada } = await import('@/lib/anuncios/verificacion-de-instructor')

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
)

let fallos = 0
const di = (ok: boolean, texto: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'PASA' : '*** FALLA ***'}  ${texto}${extra ? '  -> ' + extra : ''}`)
}
const tapar = (e: string | null) => {
  if (!e) return '(sin correo)'
  const [u, d] = e.split('@')
  return u.slice(0, 3) + '***@' + d
}

console.log('=== POR QUE NO SE VA A PUBLICAR NADA ===')
di(process.env.ANUNCIOS_MODO_PRUEBA === '1', 'ANUNCIOS_MODO_PRUEBA=1, forzado por el script')
di(!process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS, 'DISCORD_WEBHOOK_ANNOUNCEMENTS no está en el entorno local')
di(!process.env.TELEGRAM_BOT_TOKEN, 'TELEGRAM_BOT_TOKEN no está en el entorno local')
di(!!process.env.RESEND_API_KEY, 'RESEND_API_KEY sí está: los correos se enviarán de verdad')

// ── La cuenta de pruebas ────────────────────────────────────────────────────
const { data: persona } = await db
  .from('users')
  .select('id, email, full_name, role')
  .ilike('full_name', '%alberto21%')
  .maybeSingle()

if (!persona) {
  console.log('\nNo encuentro la cuenta alberto21. Abortado.')
  process.exit(1)
}

console.log('\n=== CUENTA DE PRUEBAS ===')
console.log(`   ${persona.full_name}   ${tapar(persona.email)}   rol: ${persona.role}`)

const { data: esp } = await db
  .from('instructor_specialties')
  .select('id, nombre')
  .eq('slug', 'ethereum-contratos')
  .maybeSingle()
const especialidad = esp?.nombre ?? 'Ethereum y contratos inteligentes'

// ── 1. Aprobación ───────────────────────────────────────────────────────────
console.log('\n=== 1. CORREO DE APROBACION (se envía de verdad) ===')
const r1 = await enviarVerificacionAprobada({
  to: persona.email as string,
  nombre: (persona.full_name as string) ?? 'instructor',
  especialidad,
  jurisdiccion: null,
})
di(r1.success, 'correo de aprobación enviado', r1.success ? `id ${r1.id}` : r1.error)

// ── 2. Rechazo, con el motivo tal cual ──────────────────────────────────────
console.log('\n=== 2. CORREO DE RECHAZO (se envía de verdad) ===')
const MOTIVO =
  'La parte práctica no llegó a cubrir el despliegue de un contrato con pruebas. ' +
  'Falta también detallar cómo verificarías el bytecode en un explorador.'
const r2 = await enviarVerificacionRechazada({
  to: persona.email as string,
  nombre: (persona.full_name as string) ?? 'instructor',
  especialidad,
  jurisdiccion: null,
  motivo: MOTIVO,
})
di(r2.success, 'correo de rechazo enviado', r2.success ? `id ${r2.id}` : r2.error)

// ── 3. El anuncio, en modo de prueba ────────────────────────────────────────
console.log('\n=== 3. ANUNCIO (modo de prueba: no sale nada) ===')
const r3 = await anunciarVerificacionAprobada({
  nombrePublico: (persona.full_name as string) ?? 'instructor',
  especialidad,
  jurisdiccion: null,
  userId: persona.id as string,
})
di(r3.discord === 'prueba' && r3.telegram === 'prueba', 'los dos canales en modo de prueba')
di(r3.algunoEnviado === false, 'algunoEnviado = false: la fecha de anuncio NO se marcaría')

// ── 4. Notificación en la plataforma ────────────────────────────────────────
console.log('\n=== 4. NOTIFICACION EN LA PLATAFORMA (necesita la 108) ===')
const notif = await db.from('notifications').insert({
  user_id: persona.id,
  type: 'verificacion_aprobada',
  title: `Verificación aprobada: ${especialidad}`,
  message: `Ya puedes crear cursos de ${especialidad} y enviarlos a revisión.`,
  link: '/dashboard/instructor',
}).select('id, type, title').maybeSingle()

if (notif.error) {
  console.log(`   PENDIENTE  la 108 no está aplicada (${notif.error.code}): ${notif.error.message.slice(0, 70)}`)
} else {
  di(true, `notificación creada: «${notif.data?.title}»`)
  const rech = await db.from('notifications').insert({
    user_id: persona.id,
    type: 'verificacion_rechazada',
    title: `Sobre tu solicitud en ${especialidad}`,
    message: 'Hemos revisado tu solicitud. Puedes volver a solicitarla cuando quieras.',
    link: '/dashboard/instructor/verificacion',
  }).select('id').maybeSingle()
  di(!rech.error, 'notificación de rechazo creada', rech.error?.code)

  // Se dejan un momento para que se puedan ver en la campana, y se borran.
  const ids = [notif.data?.id, rech.data?.id].filter(Boolean) as string[]
  console.log(`   (se borran las ${ids.length} notificaciones de prueba)`)
  for (const nid of ids) await db.from('notifications').delete().eq('id', nid)
  const { count } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .in('id', ids)
  di(count === 0, 'no queda ninguna notificación de prueba')
}

// ── 5. El consentimiento y el cerrojo ───────────────────────────────────────
console.log('\n=== 5. CONSENTIMIENTO Y CERROJO DEL ANUNCIO (necesita la 108) ===')
const certs = await db
  .from('instructor_certifications')
  .select('id, status, consentimiento_anuncio, consentimiento_anuncio_el, anunciado_el')
  .eq('user_id', persona.id)

if (certs.error) {
  console.log(`   PENDIENTE  la 108 no está aplicada (${certs.error.code})`)
} else {
  const lista = certs.data as Array<{
    id: string; status: string
    consentimiento_anuncio: boolean
    consentimiento_anuncio_el: string | null
    anunciado_el: string | null
  }>
  di(true, `la 108 está aplicada; ${lista.length} certificación(es) de esta cuenta`)
  for (const c of lista) {
    console.log(`      ${c.status.padEnd(11)} consentimiento: ${c.consentimiento_anuncio}   anunciada: ${c.anunciado_el ?? 'no'}`)
  }

  const cert = lista.find((c) => c.status === 'aprobada') ?? lista[0]
  if (cert) {
    const antes = { ...cert }

    const sinCons = await db.from('instructor_certifications')
      .update({ consentimiento_anuncio: false, consentimiento_anuncio_el: null, anunciado_el: new Date().toISOString() })
      .eq('id', cert.id)
    di(!!sinCons.error, 'sin consentimiento, la base rechaza marcar el anuncio', sinCons.error?.code ?? 'LO ACEPTO')

    const sinFecha = await db.from('instructor_certifications')
      .update({ consentimiento_anuncio: true, consentimiento_anuncio_el: null })
      .eq('id', cert.id)
    di(!!sinFecha.error, 'un consentimiento sin fecha se rechaza', sinFecha.error?.code ?? 'LO ACEPTO')

    if (cert.status === 'aprobada') {
      await db.from('instructor_certifications')
        .update({ consentimiento_anuncio: true, consentimiento_anuncio_el: new Date().toISOString() })
        .eq('id', cert.id)
      const uno = await db.from('instructor_certifications')
        .update({ anunciado_el: new Date().toISOString() }).eq('id', cert.id)
      di(!uno.error, 'con consentimiento y aprobada, se puede marcar el anuncio', uno.error?.message)
      const dos = await db.from('instructor_certifications')
        .update({ anunciado_el: new Date().toISOString() }).eq('id', cert.id)
      di(!!dos.error, 'un segundo anuncio se rechaza', dos.error?.code ?? 'LO ACEPTO')
    }

    await db.from('instructor_certifications')
      .update({
        consentimiento_anuncio: antes.consentimiento_anuncio,
        consentimiento_anuncio_el: antes.consentimiento_anuncio_el,
        anunciado_el: antes.anunciado_el,
      })
      .eq('id', cert.id)
    const final = await db.from('instructor_certifications')
      .select('consentimiento_anuncio, consentimiento_anuncio_el, anunciado_el')
      .eq('id', cert.id).single()
    di(
      final.data?.consentimiento_anuncio === antes.consentimiento_anuncio &&
        final.data?.consentimiento_anuncio_el === antes.consentimiento_anuncio_el &&
        final.data?.anunciado_el === antes.anunciado_el,
      'la certificación queda exactamente como estaba'
    )
  }
}

console.log(`\n${fallos === 0 ? 'TODO CORRECTO' : 'REVISAR: ' + fallos + ' fallo(s)'}`)
console.log('Mira el buzón de la cuenta de pruebas: tienen que estar los DOS correos.')
process.exit(fallos === 0 ? 0 : 1)
