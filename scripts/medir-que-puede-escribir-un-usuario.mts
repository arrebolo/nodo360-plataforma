/**
 * ¿Qué puede escribir un usuario cualquiera en su fila de `users`?
 *
 *   npx tsx scripts/medir-que-puede-escribir-un-usuario.mts
 *
 * LA TRAMPA QUE ESTE SCRIPT YA TUVO, y por la que mide así
 *
 *   La primera versión pedía la fila de vuelta (`Prefer: return=representation`,
 *   que es lo que hace `.select()` en supabase-js) y concluyó que
 *   `authenticated` NO PODÍA ESCRIBIR NINGUNA de las 26 columnas: 42501 en todas.
 *   Era falso. El mismo PATCH, cambiando solo la cabecera:
 *
 *     Prefer: return=representation  ->  403  permission denied for table users
 *     Prefer: return=minimal         ->  204  y la fila cambia
 *
 *   `return=representation` obliga a PostgREST a hacer `RETURNING`, y para
 *   devolver la fila hace falta SELECT sobre las columnas devueltas.
 *   `authenticated` solo lee cinco de las veintiséis, así que el 42501 venía de
 *   LA LECTURA y no de la escritura. Un error que no distingue las dos cosas
 *   hace creer que una tabla está cerrada cuando está abierta.
 *
 *   De ahí la regla de este script: SE ESCRIBE CON `return=minimal`, Y EL EFECTO
 *   SE COMPRUEBA CON EL CLIENTE DE SERVICIO. La medida de la escritura no
 *   depende de ningún permiso de lectura.
 *
 * Y DOS PRECONDICIONES, porque si no esto no mide nada:
 *   · una columna legítima TIENE que poder escribirse. Si no, el PATCH no llega
 *     y todos los «no puede» de abajo son un verde vacío.
 *   · una columna sensible TIENE que ser rechazada. Si no, no hay nada que
 *     distinga a este script de uno que siempre dice que todo está bien.
 *
 * LA CUENTA ES DE PRUEBA Y SE BORRA. Dominio `@nodo360-pruebas.invalid`
 * (RFC 2606), rol `student`, borrada en el `finally` pase lo que pase. NO se crea
 * ninguna cuenta de administración.
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

let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

/** Las que un usuario NO debe poder tocar nunca, ni de su propia fila. */
const SENSIBLES = [
  'role', 'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by',
  'is_beta', 'is_beta_enabled', 'email', 'created_at', 'updated_at',
  'welcome_email_sent_at', 'email_confirmed_at', 'last_seen_at',
] as const

/**
 * Las que sí edita de su perfil: las nueve de la 085 —menos las dos que retiró
 * la 086— más `anunciar_logros`, que la 122 creó y concedió.
 *
 * Son exactamente las diez que manda `ProfileForm`. Si alguna dejara de estar
 * concedida, el formulario volvería a fallar entero: un PATCH es atómico.
 */
const DEL_PERFIL = [
  'full_name', 'bio', 'avatar_url', 'avatar_path',
  'website', 'twitter', 'linkedin', 'github', 'wants_beta_notification',
  'anunciar_logros',
] as const

const MARCA = `qa-escritura-${Date.now()}`
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let usuario: string | null = null

try {
  const { data: alta, error: eAlta } = await svc.auth.admin.createUser({
    email: `${MARCA}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eAlta || !alta?.user) throw new Error(`no se pudo crear la cuenta: ${eAlta?.message}`)
  usuario = alta.user.id

  const { data: perfil } = await svc.from('users').select('role').eq('id', usuario).maybeSingle()
  di(perfil?.role === 'student', 'la cuenta nace con rol student', `role=${perfil?.role}`)

  const sesion = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: entrada, error: eEntrada } = await sesion.auth.signInWithPassword({
    email: `${MARCA}@nodo360-pruebas.invalid`, password: CLAVE,
  })
  if (eEntrada || !entrada.session) throw new Error(`no se pudo iniciar sesion: ${eEntrada?.message}`)
  const TOKEN = entrada.session.access_token

  /** El tipo y el valor de cada columna, del OpenAPI y no de una lista recordada. */
  const spec = await (await fetch(`${URL_BASE}/rest/v1/`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY as string, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  })).json() as { definitions: Record<string, { properties: Record<string, { format?: string; enum?: string[] }> }> }
  const props = spec.definitions.users.properties

  // OJO CON EL VALOR, no solo con el permiso. La primera version de esto mando
  // «qa122-website» a `website` y recibio 23514: `website`, `linkedin` y `github`
  // llevan CHECK de formato desde la 101 —el formulario no es la unica puerta—,
  // asi que un valor invalido se rechaza por el CHECK y no por el permiso. Dos
  // cosas distintas con la misma pinta de fallo.
  const CON_CHECK_DE_URL = new Set(['website', 'linkedin', 'github'])

  const valorPara = (col: string): unknown => {
    const p = props[col] ?? {}
    if (CON_CHECK_DE_URL.has(col)) return `https://ejemplo.invalid/qa122-${col}`
    if (p.format === 'boolean') return true
    if (/timestamp|date/.test(p.format ?? '')) return new Date().toISOString()
    if (/integer|numeric|double/.test(p.format ?? '')) return 1
    if (p.format === 'uuid') return null
    if (p.enum) return p.enum[0]
    return `qa122-${col}`
  }

  /**
   * ESCRIBE SIN PEDIR LA FILA. `return=minimal` no hace RETURNING, así que el
   * resultado no depende de tener permiso de lectura.
   */
  async function escribir(id: string, cuerpo: Record<string, unknown>) {
    const r = await fetch(`${URL_BASE}/rest/v1/users?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: ANON, Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify(cuerpo),
    })
    const t = await r.text()
    let codigo: string | null = null
    try { codigo = JSON.parse(t).code ?? null } catch { /* 204 no trae cuerpo */ }
    return { estado: r.status, codigo, cuerpo: t.slice(0, 130) }
  }

  /** Y el efecto se lee con el cliente de SERVICIO, que sí puede leerlo todo. */
  const leerConServicio = async (col: string) => {
    const { data } = await svc.from('users').select(col).eq('id', usuario as string).maybeSingle()
    return (data as Record<string, unknown> | null)?.[col]
  }

  // ── 1. PRECONDICIÓN: una columna legítima se escribe de verdad ────────────
  console.log('\n=== precondicion: el PATCH llega ===')
  const antes = await leerConServicio('full_name')
  const legitimo = await escribir(usuario, { full_name: 'Nombre de prueba 122' })
  const despues = await leerConServicio('full_name')
  di(legitimo.estado === 204 && despues === 'Nombre de prueba 122' && despues !== antes,
    'SI puede cambiarse full_name, y la fila lo refleja',
    `${legitimo.estado}, ${JSON.stringify(antes)} -> ${JSON.stringify(despues)}`)
  if (legitimo.estado !== 204) {
    console.log('\n   *** Si esto falla, nada de lo de abajo mide el permiso de columna. Parar.')
  }

  // ── 2. La trampa, medida, para que nadie la repita ────────────────────────
  const conLectura = await fetch(`${URL_BASE}/rest/v1/users?id=eq.${usuario}`, {
    method: 'PATCH',
    headers: {
      apikey: ANON, Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    body: JSON.stringify({ full_name: 'Nombre con la fila de vuelta' }),
  })
  di(conLectura.status === 403,
    'y el MISMO cambio pidiendo la fila de vuelta da 403: es la LECTURA, no la escritura',
    `${conLectura.status}`)

  // ── 3. Las nueve del perfil: todas tienen que poder escribirse ────────────
  console.log('\n=== las diez columnas del perfil ===')
  const noEscriben: string[] = []
  for (const col of DEL_PERFIL) {
    const r = await escribir(usuario, { [col]: valorPara(col) })
    if (r.estado !== 204) {
      const motivo = r.codigo === '42501' ? 'PERMISO'
        : r.codigo === '23514' ? 'CHECK: el valor de prueba no vale, no es el permiso'
        : r.codigo ?? 'sin codigo'
      noEscriben.push(`${col} (${r.estado} ${motivo})`)
    }
  }
  di(noEscriben.length === 0, 'las diez se escriben',
    noEscriben.length ? '*** no: ' + noEscriben.join(', ') : `${DEL_PERFIL.length} de ${DEL_PERFIL.length}`)

  // ── 4. Las sensibles: ninguna, y comprobando que el valor no se movió ─────
  console.log('\n=== las columnas sensibles ===')
  const escribieron: string[] = []
  for (const col of SENSIBLES) {
    const valorAntes = await leerConServicio(col)
    const r = await escribir(usuario, { [col]: valorPara(col) })
    const valorDespues = await leerConServicio(col)
    const cambio = JSON.stringify(valorAntes) !== JSON.stringify(valorDespues)
    if (r.estado === 204 || cambio) {
      escribieron.push(`${col} (${r.estado}${cambio ? ', Y CAMBIO' : ''})`)
    }
  }
  di(escribieron.length === 0, 'ninguna columna sensible se puede escribir',
    escribieron.length ? '*** SI: ' + escribieron.join('; ') : `${SENSIBLES.length} rechazadas`)

  // ── 5. PRECONDICIÓN AL REVÉS: que el rechazo signifique algo ──────────────
  // Si `role` se rechazara porque el PATCH no llega nunca, el punto 4 sería un
  // verde vacío. El punto 1 ya lo descarta, y esto lo deja dicho por escrito.
  const rol = await escribir(usuario, { role: 'admin' })
  di(rol.estado === 403 && rol.codigo === '42501',
    'el rechazo de role es 42501 de permiso de columna, no otra cosa',
    `${rol.estado} ${rol.codigo}`)
  di((await leerConServicio('role')) === 'student', 'y sigue siendo student')

  // ── 6. La fila de otra persona ────────────────────────────────────────────
  console.log('\n=== la fila de otra persona ===')
  const { data: otros } = await svc.from('users').select('id, full_name').neq('id', usuario).limit(1)
  const ajeno = otros?.[0]
  if (!ajeno) throw new Error('no hay otra fila con la que probar')
  const nombreAjenoAntes = ajeno.full_name
  const aOtro = await escribir(ajeno.id, { full_name: 'tocado por otro' })
  const { data: ajenoDespues } = await svc.from('users').select('full_name').eq('id', ajeno.id).maybeSingle()
  di(ajenoDespues?.full_name === nombreAjenoAntes,
    'la fila de otra persona no se ha movido',
    `${aOtro.estado}, nombre ${nombreAjenoAntes === ajenoDespues?.full_name ? 'intacto' : '*** CAMBIADO'}`)
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  if (usuario) {
    const { error } = await svc.auth.admin.deleteUser(usuario)
    di(!error, 'la cuenta de prueba se ha borrado', error ? error.message : usuario.slice(0, 8))
    const { count } = await svc.from('users').select('id', { count: 'exact', head: true }).like('email', 'qa-escritura-%')
    di((count ?? 0) === 0, 'no queda ninguna cuenta qa-escritura-', `${count ?? 0}`)
  }
  console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\nREVISAR: ${fallos} comprobaciones falladas\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
