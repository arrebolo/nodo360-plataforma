/**
 * El aviso de un feedback nuevo: que falte el destinatario no rompe el formulario.
 *
 *   npx tsx scripts/probar-el-aviso-de-feedback.mts [http://localhost:3124]
 *
 * POR QUE
 *   El destinatario del aviso estaba escrito dentro de `app/api/feedback/route.ts` —una
 *   dirección personal, en un repositorio público— y ahora sale de `FEEDBACK_EMAIL_TO`.
 *   Sacar algo a una variable de entorno crea un modo de fallo nuevo: que falte. Y aquí
 *   lo que no puede pasar es que el formulario de feedback deje de funcionar, porque
 *   **el comentario ya está guardado** cuando llega el turno del correo: perderlo por no
 *   poder avisar sería cambiar un problema pequeño por uno grande.
 *
 * LO QUE SE COMPRUEBA, con una cuenta de usar y tirar
 *   1. sin sesión: 401, y no se guarda nada
 *   2. con sesión: responde success y la fila queda guardada con su mensaje y su autor,
 *      pase lo que pase con el correo
 *
 * Y LOS TRES MONTAJES DEL SERVIDOR, que se eligen al arrancarlo. Lo que distingue a uno
 * de otro está en el REGISTRO del servidor, no en la respuesta —la respuesta es 200 en
 * los tres, que es justo lo que hay que garantizar—:
 *
 *   sin FEEDBACK_EMAIL_TO          «FEEDBACK_EMAIL_TO no está definida: el feedback … »
 *   FEEDBACK_EMAIL_TO=no-es-correo «Aviso NO enviado del feedback …: validation_error … »
 *   FEEDBACK_EMAIL_TO=algo@valido  «Aviso enviado del feedback … »
 *
 * CUIDADO CON EL DESTINO QUE SE ELIGE. `@ejemplo.invalid` NO sirve para probar el error:
 * Resend lo ACEPTA y lo encola —el rebote es posterior—, así que recorre la rama del
 * éxito. Medido. Para ejercitar la rama del error hace falta algo que Resend rechace en
 * el momento, como una dirección sin arroba. Y para no escribirle a nadie de verdad,
 * cualquiera de los dos primeros montajes.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const REF = new URL(URL_BASE).hostname.split('.')[0]
const SITIO = process.argv[2] ?? 'http://localhost:3124'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-feedback'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

const creado: { usuarios: string[]; feedback: string[] } = { usuarios: [], feedback: [] }

const pedir = async (cuerpo: unknown, cookie?: string) => {
  for (let intento = 0; intento < 4; intento++) {
    const r = await fetch(`${SITIO}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(cuerpo),
    })
    const texto = await r.text()
    let json: Record<string, unknown> = {}
    try { json = JSON.parse(texto) } catch { /* no era json */ }
    // El limitador de /api/feedback es «strict»: pasar dos veces la prueba lo agota.
    if (r.status === 429) {
      console.log('   (429: el limitador estricto. Esperando 30 s y reintentando)')
      await esperar(30000)
      continue
    }
    return { status: r.status, json, texto }
  }
  return { status: 429, json: {}, texto: '' }
}

try {
  console.log(`\nSitio: ${SITIO}`)
  console.log(`FEEDBACK_EMAIL_TO que se le supone al servidor: ${(process.env.FEEDBACK_EMAIL_TO ?? env.FEEDBACK_EMAIL_TO) ? 'definida' : 'NO definida (es el caso 1)'}`)

  // ── la cuenta de usar y tirar ────────────────────────────────────────────────
  const correo = `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ full_name: 'Prueba feedback' }).eq('id', u!.user.id)

  const { data: s, error: elog } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email: correo, password: CLAVE })
  if (elog || !s.session) throw new Error(`sesion: ${elog?.message}`)
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`

  // ── 1. sin sesión ────────────────────────────────────────────────────────────
  console.log('\n1. Sin sesión')
  const sinSesion = await pedir({ pageUrl: '/prueba', message: 'No deberia guardarse.' })
  di(sinSesion.status === 401, 'responde 401', String(sinSesion.status))

  // ── 2. con sesión, con el servidor tal como está ─────────────────────────────
  // Lo que tiene el SERVIDOR, no lo que tiene este script: se le dice al arrancarlo
  // (FEEDBACK_EMAIL_TO=... npx tsx scripts/...), porque el servidor puede llevarla
  // puesta sin que este en .env.local.
  const conVariable = Boolean(process.env.FEEDBACK_EMAIL_TO ?? env.FEEDBACK_EMAIL_TO)
  console.log(`\n2. Con sesión (el servidor ${conVariable ? 'SÍ' : 'NO'} tiene FEEDBACK_EMAIL_TO)`)
  const mensaje = `${MARCA}: comprobando que el aviso no rompe el formulario. ${Date.now()}`
  const r = await pedir({ pageUrl: '/prueba-del-aviso', message: mensaje }, cookie)
  di(r.status === 200, 'responde 200', `${r.status} ${r.texto.slice(0, 120)}`)
  di(r.json.success === true, 'dice success')
  const id = r.json.id as string | undefined
  di(Boolean(id), 'devuelve el id del feedback', String(id))
  if (id) creado.feedback.push(id)

  // Y lo que importa: la fila está guardada.
  if (id) {
    const { data: fila, error: ef } = await svc.from('beta_feedback')
      .select('id, user_id, message, page_url').eq('id', id).maybeSingle()
    di(!ef && Boolean(fila), 'la fila está guardada en beta_feedback', ef?.message ?? '')
    di(fila?.message === mensaje, 'con el mensaje tal cual')
    di(fila?.user_id === u!.user.id, 'y atribuida a quien lo escribió')
  }

  console.log(
    conVariable
      ? '\n   (con la variable definida, el envío se intenta y el RESULTADO se mira:\n' +
        '    si Resend lo rechaza, el servidor registra «Aviso NO enviado del feedback\n' +
        '    <id>: <motivo>» y la fila se queda guardada igual. `emails.send()` no lanza:\n' +
        '    devuelve { data, error }, y sin mirarlo un aviso perdido no dejaba rastro)'
      : '\n   (sin la variable, el servidor registra «FEEDBACK_EMAIL_TO no está definida»\n' +
        '    con el id del feedback, y la petición sigue devolviendo success: lo de arriba)'
  )
} catch (e) {
  fallos++
  console.error('\nSE ROMPIÓ LA PRUEBA:', e instanceof Error ? e.message : e)
} finally {
  // ── limpieza ────────────────────────────────────────────────────────────────
  for (const id of creado.feedback) await svc.from('beta_feedback').delete().eq('id', id)
  for (const id of creado.usuarios) {
    await svc.from('beta_feedback').delete().eq('user_id', id)
    await svc.from('users').delete().eq('id', id)
    await svc.auth.admin.deleteUser(id)
  }
  const { count } = await svc.from('beta_feedback').select('id', { count: 'exact', head: true })
    .ilike('message', `${MARCA}%`)
  console.log(`\nlimpieza: ${creado.feedback.length} feedback y ${creado.usuarios.length} usuario(s) borrados; restos: ${count ?? '?'}`)
}

console.log(`\n${fallos === 0 ? 'TODO CORRECTO' : `FALLOS: ${fallos}`}`)
process.exit(fallos === 0 ? 0 : 1)
