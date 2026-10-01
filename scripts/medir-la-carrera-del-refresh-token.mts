/**
 * ¿Puede un prefetch cerrarte la sesión?
 *
 *   npx tsx scripts/medir-la-carrera-del-refresh-token.mts [http://localhost:3128]
 *
 * EL MECANISMO QUE SE SOSPECHA
 *   Supabase ROTA el refresh token: al renovar, el viejo queda gastado. El
 *   middleware llama a getUser() en cada ruta privada y eso renueva si toca.
 *
 *   Next precarga los <Link> al pasar el raton por encima, y manda esas peticiones
 *   con la cabecera `Next-Router-Prefetch`. Si la renovacion ocurre en el prefetch,
 *   las cookies nuevas viajan en una respuesta que el navegador puede descartar, y
 *   el clic de verdad llega con la cookie vieja, cuyo refresh token ya no sirve.
 *   Resultado: /login. Y como la cookie del navegador se queda obsoleta, la
 *   siguiente pagina privada tambien manda a /login. Es decir: «se cierra la sesion
 *   por completo», que es justo lo descrito.
 *
 * Esto no prueba que sea LA causa de lo que viste, pero prueba si el mecanismo
 * existe en esta aplicacion, que es lo que hay que saber antes de arreglar nada.
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
const SITIO = process.argv[2] ?? 'http://localhost:3128'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-carrera'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
const di = (t: string, v: string) => console.log(`   ${t.padEnd(54)} ${v}`)

const creado: string[] = []

const cookieDe = (sesion: unknown) =>
  `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')}`

async function pedir(ruta: string, cookie: string, cabeceras: Record<string, string> = {}) {
  const r = await fetch(`${SITIO}${ruta}`, {
    redirect: 'manual', headers: { Cookie: cookie, ...cabeceras },
  })
  return { estado: r.status, destino: r.headers.get('location') }
}

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((x) => x.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.push(u!.user.id)

  const cliente = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: s, error: el } = await cliente.auth.signInWithPassword({
    email: u!.user.email as string, password: CLAVE,
  })
  if (el) throw new Error(el.message)
  const cookieVieja = cookieDe(s.session)

  console.log('\n=== 1. la cookie recien hecha funciona ===')
  const antes = await pedir('/dashboard', cookieVieja)
  di('GET /dashboard', `${antes.estado}${antes.destino ? ' -> ' + antes.destino : ''}`)

  // ── 2. Se consume el refresh token por otra via, como lo haria un prefetch ──
  console.log('\n=== 2. alguien renueva el token (lo que hace el middleware) ===')
  const otro = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: nueva, error: er } = await otro.auth.refreshSession({
    refresh_token: s.session!.refresh_token,
  })
  di('refreshSession con el refresh token',
    er ? `falla: ${er.message}` : `nuevo token, caduca en ${nueva.session?.expires_in}s`)

  console.log('\n=== 3. y la cookie VIEJA, la que tiene el navegador ===')
  const despues = await pedir('/dashboard', cookieVieja)
  di('GET /dashboard con la cookie vieja',
    `${despues.estado}${despues.destino ? ' -> ' + despues.destino : ''}`)

  const seCierra = despues.estado !== 200
  console.log(seCierra
    ? '   *** CONFIRMADO: con el refresh token gastado, la cookie del navegador\n       ya no vale y toda ruta privada manda a /login. Es «se cerro la sesion».'
    : '   la cookie vieja sigue valiendo: el access token aun no habia caducado,\n       asi que el middleware no necesito renovar.')

  // ── 4. ¿Manda Next la cabecera de prefetch, y la mira el middleware? ───────
  console.log('\n=== 4. el prefetch, tal como lo manda Next ===')
  const nuevaCookie = cookieDe(nueva.session)
  const pf = await pedir('/dashboard', nuevaCookie, {
    'Next-Router-Prefetch': '1', RSC: '1', purpose: 'prefetch',
  })
  di('GET /dashboard con Next-Router-Prefetch: 1',
    `${pf.estado}${pf.destino ? ' -> ' + pf.destino : ''}`)
  di('¿el middleware distingue el prefetch?',
    'hoy NO: trata igual un prefetch que una visita, asi que renueva en los dos')
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado) await svc.auth.admin.deleteUser(id)
  di('cuentas de prueba borradas', String(creado.length))
}
