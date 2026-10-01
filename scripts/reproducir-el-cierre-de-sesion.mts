/**
 * «Gestionar módulos» cierra la sesión: ¿por qué?
 *
 *   npx tsx scripts/reproducir-el-cierre-de-sesion.mts [http://localhost:3128]
 *
 * Recorre las pantallas como un navegador, CON TARRO DE COOKIES: cada respuesta
 * puede traer cookies nuevas y la petición siguiente las usa. Eso importa aquí más
 * que en ninguna otra prueba, porque el modo de fallo que se sospecha es justo ese —
 * que una respuesta no propague los tokens renovados y la siguiente petición llegue
 * con un refresh token ya gastado.
 *
 * Y de paso prueba qué le responden al instructor los endpoints /api/admin/* que su
 * propio editor llama.
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

const MARCA = 'qa-sesion'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
const di = (t: string, v: string) => console.log(`   ${t.padEnd(52)} ${v}`)

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

// ── El tarro de cookies ─────────────────────────────────────────────────────
const tarro = new Map<string, string>()

function guardarCookies(r: Response) {
  const puestas: string[] = []
  // getSetCookie existe en Node 20+; es la unica forma de ver varias Set-Cookie.
  const todas = (r.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
  for (const linea of todas) {
    const [par] = linea.split(';')
    const i = par.indexOf('=')
    const nombre = par.slice(0, i).trim()
    const valor = par.slice(i + 1).trim()
    if (valor === '' || /expires=Thu, 01 Jan 1970/i.test(linea) || /max-age=0/i.test(linea)) {
      tarro.delete(nombre)
      puestas.push(`${nombre}=BORRADA`)
    } else {
      tarro.set(nombre, valor)
      puestas.push(`${nombre}=(${valor.length} car)`)
    }
  }
  return puestas
}

const cabeceraCookie = () => [...tarro].map(([k, v]) => `${k}=${v}`).join('; ')

async function ir(ruta: string, opciones: RequestInit = {}) {
  const r = await fetch(`${SITIO}${ruta}`, {
    ...opciones,
    redirect: 'manual',
    headers: { Cookie: cabeceraCookie(), ...(opciones.headers ?? {}) },
  })
  const cookies = guardarCookies(r)
  const destino = r.headers.get('location')
  return { estado: r.status, destino, cookies, r }
}

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((x) => x.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  // ── Montaje ───────────────────────────────────────────────────────────────
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', u!.user.id)

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
    instructor_id: u!.user.id, owner_id: u!.user.id,
  }).select('id').single()
  if (ec) throw new Error(ec.message)
  creado.cursos.push(c!.id)
  await svc.from('modules').insert({ course_id: c!.id, title: 'Modulo 1', order_index: 1 })

  // La sesion, armada como la guarda @supabase/ssr
  const cliente = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: s, error: el } = await cliente.auth.signInWithPassword({
    email: u!.user.email as string, password: CLAVE,
  })
  if (el) throw new Error(el.message)
  const valor = 'base64-' + Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')
  const TROZO = 3180
  if (valor.length <= TROZO) {
    tarro.set(`sb-${REF}-auth-token`, valor)
  } else {
    for (let i = 0, n = 0; i < valor.length; i += TROZO, n++) {
      tarro.set(`sb-${REF}-auth-token.${n}`, valor.slice(i, i + TROZO))
    }
  }
  console.log(`\n   sesion de instructor: ${tarro.size} cookie(s), ${valor.length} caracteres`)

  // ── El recorrido ──────────────────────────────────────────────────────────
  console.log('\n=== el recorrido, con tarro de cookies ===')

  const panel = await ir('/dashboard/instructor')
  di('GET /dashboard/instructor', `${panel.estado}${panel.destino ? ' -> ' + panel.destino : ''}  ${panel.cookies.join(' ')}`)

  const editor = await ir(`/dashboard/instructor/cursos/${c!.id}`)
  di('GET el editor del curso', `${editor.estado}${editor.destino ? ' -> ' + editor.destino : ''}  ${editor.cookies.join(' ')}`)

  const modulos = await ir(`/dashboard/instructor/cursos/${c!.id}/modulos`)
  di('GET .../modulos  (Gestionar modulos)',
    `${modulos.estado}${modulos.destino ? ' -> ' + modulos.destino : ''}  ${modulos.cookies.join(' ')}`)

  const despues = await ir('/dashboard')
  di('GET /dashboard justo despues',
    `${despues.estado}${despues.destino ? ' -> ' + despues.destino : ''}  ${despues.cookies.join(' ')}`)

  const sigueDentro = despues.estado === 200
  console.log(sigueDentro
    ? '\n   LA SESION SOBREVIVE a Gestionar modulos'
    : '\n   *** LA SESION SE PIERDE: /dashboard ya redirige')

  // ── Y la ruta de admin, que es lo que el usuario sospechaba ───────────────
  console.log('\n=== que pasa si un instructor entra en /admin ===')
  const admin = await ir(`/admin/cursos/${c!.id}/modulos`)
  di('GET /admin/cursos/<id>/modulos',
    `${admin.estado}${admin.destino ? ' -> ' + admin.destino : ''}  ${admin.cookies.join(' ')}`)
  const tras = await ir('/dashboard')
  di('GET /dashboard despues de pasar por /admin',
    `${tras.estado}${tras.destino ? ' -> ' + tras.destino : ''}`)

  // ── LA COOKIE PARTIDA EN TROZOS ───────────────────────────────────────────
  // Mi sesion de prueba cabe en una cookie. La de una cuenta con mas claims no, y
  // @supabase/ssr la parte en sb-<ref>-auth-token.0, .1, ... El modo de fallo que se
  // sospecha es este: si al renovar el token el servidor escribe UNA cookie sin
  // borrar los trozos viejos, la peticion siguiente concatena basura y la sesion
  // deja de poder leerse. Se fuerza el reparto a mano para verlo.
  console.log('\n=== la misma sesion, pero con la cookie PARTIDA EN DOS ===')
  tarro.clear()
  const mitad = Math.ceil(valor.length / 2)
  tarro.set(`sb-${REF}-auth-token.0`, valor.slice(0, mitad))
  tarro.set(`sb-${REF}-auth-token.1`, valor.slice(mitad))
  di('cookie repartida', `${tarro.size} trozos de ${mitad} y ${valor.length - mitad}`)

  const conTrozos = await ir('/dashboard/instructor')
  di('GET /dashboard/instructor con la cookie partida',
    `${conTrozos.estado}${conTrozos.destino ? ' -> ' + conTrozos.destino : ''}  ${conTrozos.cookies.join(' ') || '(sin cookies nuevas)'}`)

  const trozosDespues = [...tarro.keys()].filter((k) => k.includes('auth-token')).sort()
  di('cookies de sesion tras la peticion', trozosDespues.join(' + ') || '(ninguna)')

  const modulosTrozos = await ir(`/dashboard/instructor/cursos/${c!.id}/modulos`)
  di('GET .../modulos con la cookie partida',
    `${modulosTrozos.estado}${modulosTrozos.destino ? ' -> ' + modulosTrozos.destino : ''}`)

  const finalTrozos = await ir('/dashboard')
  di('GET /dashboard despues',
    `${finalTrozos.estado}${finalTrozos.destino ? ' -> ' + finalTrozos.destino : ''}`)
  console.log(finalTrozos.estado === 200
    ? '   la sesion partida tambien sobrevive'
    : '   *** CON LA COOKIE PARTIDA SI SE PIERDE LA SESION')

  // ── Y lo ajeno: el curso de OTRO instructor ───────────────────────────────
  console.log('\n=== /api/admin/courses/<id>/paths con el curso de OTRO ===')
  const { data: otro } = await svc.auth.admin.createUser({
    email: `${MARCA}-otro-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  creado.usuarios.push(otro!.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', otro!.user.id)
  const { data: ajeno } = await svc.from('courses').insert({
    slug: `${MARCA}-ajeno-${Date.now()}`, title: `${MARCA} ajeno`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
    instructor_id: otro!.user.id, owner_id: otro!.user.id,
  }).select('id').single()
  creado.cursos.push(ajeno!.id)

  // se vuelve a la cookie entera, que es la que funciona
  tarro.clear()
  tarro.set(`sb-${REF}-auth-token`, valor)

  const leerAjeno = await ir(`/api/admin/courses/${ajeno!.id}/paths`)
  di('GET .../paths del curso de otro', `${leerAjeno.estado} ${leerAjeno.estado === 200 ? '*** LO LEE' : 'rechazado'}`)

  const escribirAjeno = await ir(`/api/admin/courses/${ajeno!.id}/paths`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathId: '00000000-0000-0000-0000-000000000000' }),
  })
  di('POST .../paths del curso de otro',
    `${escribirAjeno.estado} ${escribirAjeno.estado < 400 ? '*** LO ESCRIBE' : 'rechazado'}`)

  // ── Los endpoints /api/admin/* que llama su propio editor ─────────────────
  console.log('\n=== /api/admin/* con sesion de INSTRUCTOR ===')
  for (const [metodo, ruta] of [
    ['GET', '/api/admin/learning-paths'],
    ['GET', `/api/admin/courses/${c!.id}/paths`],
    ['GET', `/api/admin/quiz?courseId=${c!.id}`],
    ['GET', '/api/admin/metrics'],
    ['GET', '/api/admin/users'],
  ] as const) {
    const r = await ir(ruta, { method: metodo })
    let pista = ''
    try {
      const j = await r.r.clone().json()
      pista = Array.isArray(j) ? `array de ${j.length}`
        : typeof j === 'object' && j ? Object.keys(j as object).slice(0, 4).join(',') : ''
    } catch { /* no es json */ }
    di(`${metodo} ${ruta}`, `${r.estado}${r.destino ? ' -> ' + r.destino : ''}  ${pista}`)
  }
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) await svc.auth.admin.deleteUser(id)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di('no queda nada', `cursos con la marca: ${count ?? 0}`)
}
