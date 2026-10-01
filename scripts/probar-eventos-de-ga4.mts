/**
 * Los dos arreglos de GA4, comprobados.
 *
 *   npx tsx scripts/probar-eventos-de-ga4.mts [http://localhost:3129]
 *
 * 1. enviarEvento() encola el evento aunque GA no se haya inicializado todavia. Es el
 *    fallo de `email_confirmed`: sendGAEvent hacia `return` con un console.warn si
 *    `currDataLayerName` aun no estaba, y el evento se perdia. Aqui se simula ese
 *    instante —sin dataLayer— y se comprueba que el evento queda en la cola.
 *
 * 2. GET /api/enroll deja la cookie `n360_curso_empezado` cuando de verdad crea la
 *    matricula, y NO la deja si ya estaba matriculada. Es el fallo de `course_start`:
 *    ese camino —el enlace de la ficha, el que usa quien ya tiene acceso— matriculaba
 *    sin emitir nada.
 *
 * Lo segundo necesita el servidor levantado. Si no lo esta, se salta y se dice.
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
const SITIO = process.argv[2] ?? 'http://localhost:3129'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-ga4'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado = { usuario: null as string | null, curso: null as string | null }

try {
  // ── 1. enviarEvento sin que GA se haya inicializado ──────────────────────
  console.log('\n=== enviarEvento con GA todavia sin cargar ===')
  process.env.NODE_ENV = 'production'
  const falsaVentana: Record<string, unknown> = {}
  ;(globalThis as unknown as { window?: unknown }).window = falsaVentana
  ;(globalThis as unknown as { document?: unknown }).document = { cookie: '' }

  const { enviarEvento } = await import('../lib/analytics/eventos.ts')

  di(falsaVentana.dataLayer === undefined, 'de partida no hay dataLayer (el instante del fallo)')

  enviarEvento('email_confirmed', { method: 'email' })
  const cola = falsaVentana.dataLayer as unknown[] | undefined
  di(Array.isArray(cola) && cola.length === 1, 'el evento se encola igual, sin dataLayer previo',
    `cola: ${JSON.stringify(cola)}`)
  di(
    Array.isArray(cola) && JSON.stringify(cola[0]) === JSON.stringify(['event', 'email_confirmed', { method: 'email' }]),
    'y con la forma que espera gtag: [event, nombre, parametros]')

  enviarEvento('course_start', { course_slug: 'un-curso' })
  di((falsaVentana.dataLayer as unknown[]).length === 2, 'un segundo evento se añade a la misma cola')

  // ── 2. La cookie de GET /api/enroll ──────────────────────────────────────
  console.log('\n=== GET /api/enroll deja la cookie al matricular ===')
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) {
    console.log(`   (sin servidor en ${SITIO}: esta parte se salta)`)
  } else {
    const { data: u, error: eu } = await svc.auth.admin.createUser({
      email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
    })
    if (eu) throw new Error(eu.message)
    creado.usuario = u!.user.id

    const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
    const { data: c, error: ec } = await svc.from('courses').insert({
      slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'published',
      is_free: true, is_certifiable: false, specialty_id: esp!.id, published_at: new Date().toISOString(),
    }).select('id, slug').single()
    if (ec) throw new Error(ec.message)
    creado.curso = c!.id

    const cliente = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    const { data: s, error: el } = await cliente.auth.signInWithPassword({
      email: u!.user.email as string, password: CLAVE,
    })
    if (el) throw new Error(el.message)
    const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`

    const primera = await fetch(`${SITIO}/api/enroll?courseId=${c!.id}`, {
      redirect: 'manual', headers: { Cookie: cookie },
    })
    const puestas = (primera.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
    const laCookie = puestas.find((x) => x.startsWith('n360_curso_empezado='))
    di(Boolean(laCookie), 'al matricular, deja n360_curso_empezado',
      laCookie ? laCookie.split(';')[0] : `${puestas.length} cookies, ninguna`)
    di(Boolean(laCookie && laCookie.includes(c!.slug)), 'con el slug del curso', c!.slug)

    const { count: matriculas } = await svc.from('course_enrollments')
      .select('id', { count: 'exact', head: true }).eq('course_id', c!.id)
    di((matriculas ?? 0) === 1, 'y la matricula existe de verdad', `${matriculas ?? 0}`)

    // Segunda vez: ya matriculada, no debe volver a contar
    const segunda = await fetch(`${SITIO}/api/enroll?courseId=${c!.id}`, {
      redirect: 'manual', headers: { Cookie: cookie },
    })
    const puestas2 = (segunda.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
    di(!puestas2.some((x) => x.startsWith('n360_curso_empezado=')),
      'si ya estaba matriculada, NO deja la cookie (no cuenta dos veces)')
  }
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  if (creado.curso) {
    await svc.from('course_enrollments').delete().eq('course_id', creado.curso)
    await svc.from('lessons_publicadas').delete().eq('course_id', creado.curso)
    await svc.from('modules_publicados').delete().eq('course_id', creado.curso)
    await svc.from('courses_publicados').delete().eq('id', creado.curso)
    await svc.from('courses').delete().eq('id', creado.curso)
  }
  if (creado.usuario) await svc.auth.admin.deleteUser(creado.usuario)
  const { count: t } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  const { count: e } = await svc.from('courses_publicados').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((t ?? 0) === 0 && (e ?? 0) === 0, 'no queda nada', `trabajo ${t ?? 0}, registro ${e ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
