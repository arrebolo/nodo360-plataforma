/**
 * ¿Ve el middleware que una cuenta está suspendida?
 *
 * El middleware lee `users.is_suspended` CON LA SESION DE ESA PERSONA (clave anónima),
 * no con el cliente de servicio. Si la RLS o los permisos de columna no se lo dejan
 * leer, `userRow` llega vacío, `userRow?.is_suspended` es undefined y la puerta no se
 * cierra: una cuenta suspendida sigue navegando.
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
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })
const CLAVE = 'Medir-' + Math.random().toString(36).slice(2) + 'K3!'

const creado: string[] = []
try {
  const correo = `qa-suspension-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(error.message)
  creado.push(u!.user.id)

  const { error: eSusp } = await svc.from('users')
    .update({ is_suspended: true, suspended_reason: 'Prueba de la puerta' }).eq('id', u!.user.id)
  console.log(`\nsuspender con el cliente de servicio: ${eSusp ? `${eSusp.code}: ${eSusp.message}` : 'hecho'}`)

  const { data: comoServicio } = await svc.from('users')
    .select('role, is_suspended, suspended_reason').eq('id', u!.user.id).maybeSingle()
  console.log(`   como servicio: ${JSON.stringify(comoServicio)}`)

  const cliente = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { error: elog } = await cliente.auth.signInWithPassword({ email: correo, password: CLAVE })
  if (elog) throw new Error(`login: ${elog.message}`)

  // LO MISMO QUE HACE EL MIDDLEWARE, con la sesión de esa persona
  const { data: comoElla, error: eElla } = await cliente.from('users')
    .select('role, is_suspended, suspended_reason').eq('id', u!.user.id).maybeSingle()
  console.log(`   con su propia sesion: ${eElla ? `${eElla.code}: ${eElla.message}` : JSON.stringify(comoElla)}`)

  if (!comoElla) {
    console.log('\n   *** el middleware NO puede ver la suspension: la puerta no se cierra')
  } else if (comoElla.is_suspended === true) {
    console.log('\n   la puerta puede cerrarse: ve is_suspended = true')
  } else {
    console.log(`\n   *** lee la fila pero is_suspended llega como ${JSON.stringify(comoElla.is_suspended)}`)
  }

  // ¿Y columna a columna?
  for (const col of ['role', 'is_suspended', 'suspended_reason']) {
    const { data, error: e } = await cliente.from('users').select(col).eq('id', u!.user.id).maybeSingle()
    console.log(`   solo ${col.padEnd(18)} ${e ? `${e.code}: ${e.message.slice(0, 60)}` : JSON.stringify(data)}`)
  }
} catch (e) {
  console.log(`\nEXPLOTO: ${e instanceof Error ? e.message : String(e)}`)
} finally {
  for (const id of creado) await svc.auth.admin.deleteUser(id)
  const { count } = await svc.from('users')
    .select('id', { count: 'exact' }).ilike('email', 'qa-suspension-%').limit(0)
  console.log(`\ncuentas_de_prueba ${count ?? 0}  ${(count ?? 0) === 0 ? 'TODO CORRECTO' : 'REVISAR'}\n`)
}
