/**
 * Las tres correcciones de Codex sobre la especialidad, sirviendo las pantallas.
 *
 *   npx tsx scripts/probar-especialidad-en-el-formulario.mts [http://localhost:3133]
 *
 *   1. el bloqueo va por published_at, no por status === 'published'
 *   2. el checklist comprueba que la especialidad esté VERIFICADA, no solo que exista
 *   3. la preselección no aparece como guardada si no lo está
 *   4. crear curso pide la especialidad
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
// El entorno entero antes de importar nada del proyecto: hay modulos que exigen su
// variable al cargarse (NEXT_PUBLIC_SITE_URL, por ejemplo).
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const REF = new URL(URL_BASE).hostname.split('.')[0]
const SITIO = process.argv[2] ?? 'http://localhost:3133'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-esp'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }
let cookie = ''

const servir = async (ruta: string) => {
  const r = await fetch(`${SITIO}${ruta}`, { headers: { Cookie: cookie } })
  return { estado: r.status, html: await r.text() }
}

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', u!.user.id)

  const { data: esp } = await svc.from('instructor_specialties')
    .select('id, nombre').eq('slug', 'ethereum-contratos').single()

  const { error: ec1 } = await svc.from('instructor_certifications').insert({
    user_id: u!.user.id, specialty_id: esp!.id, status: 'aprobada',
    certification_number: `${MARCA}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })
  if (ec1) throw new Error(`verificacion: ${ec1.message}`)

  const cl = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: s } = await cl.auth.signInWithPassword({ email: u!.user.email as string, password: CLAVE })
  cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`

  // ── 3. Sin especialidad guardada, una sola verificada ─────────────────────
  console.log('\n=== la preseleccion no puede parecer guardada ===')
  const { data: c1 } = await svc.from('courses').insert({
    slug: `${MARCA}-sin-${Date.now()}`, title: `${MARCA} sin especialidad`, level: 'beginner',
    status: 'draft', is_free: true, is_certifiable: false,
    instructor_id: u!.user.id, owner_id: u!.user.id,
  }).select('id').single()
  creado.cursos.push(c1!.id)

  const sinEsp = await servir(`/dashboard/instructor/cursos/${c1!.id}`)
  di(sinEsp.estado === 200, 'la pantalla se sirve', String(sinEsp.estado))
  di(sinEsp.html.includes('Elige la especialidad'),
    'el selector aparece vacio, con su marcador')
  di(sinEsp.html.includes('hasta que guardes, el curso sigue sin clasificar'),
    'y avisa de que hay que guardar')
  di(sinEsp.html.includes(esp!.nombre), 'con su especialidad verificada como opcion', esp!.nombre)

  // ── 2. El checklist, con la verificacion retirada ─────────────────────────
  console.log('\n=== el checklist cuando la verificacion ya no vale ===')
  await svc.from('courses').update({ specialty_id: esp!.id }).eq('id', c1!.id)
  const conEsp = await servir(`/dashboard/instructor/cursos/${c1!.id}`)
  di(conEsp.html.includes('Especialidad'), 'el checklist tiene la entrada de Especialidad')

  // Se retira la verificacion: el campo sigue relleno pero ya no vale
  await svc.from('instructor_certifications')
    .update({ status: 'retirada', revoked_at: new Date().toISOString() })
    .eq('user_id', u!.user.id)

  const { misEspecialidadesVerificadas } = await import('../lib/instructor/mis-especialidades.ts')
  const yaNo = await misEspecialidadesVerificadas(u!.user.id)
  di(yaNo.length === 0, 'retirada la verificacion, no queda ninguna vigente', `${yaNo.length}`)

  const retirada = await servir(`/dashboard/instructor/cursos/${c1!.id}`)
  di(retirada.html.includes('No tienes ninguna verificación aprobada'),
    'y la pantalla lo dice, aunque el curso tenga specialty_id puesto')

  // Se devuelve para el resto de las pruebas
  await svc.from('instructor_certifications')
    .update({ status: 'aprobada', revoked_at: null }).eq('user_id', u!.user.id)

  // ── 1. published_at, no status ────────────────────────────────────────────
  console.log('\n=== el bloqueo va por published_at ===')
  const { data: c2 } = await svc.from('courses').insert({
    slug: `${MARCA}-pub-${Date.now()}`, title: `${MARCA} publicado antes`, level: 'beginner',
    // Estuvo publicado y ahora esta en revision: es el hueco que dejaba `status`.
    status: 'pending_review', is_free: true, is_certifiable: false,
    specialty_id: esp!.id, instructor_id: u!.user.id, owner_id: u!.user.id,
    published_at: new Date().toISOString(),
  }).select('id').single()
  creado.cursos.push(c2!.id)

  const publicado = await servir(`/dashboard/instructor/cursos/${c2!.id}`)
  di(publicado.html.includes('La especialidad de un curso publicado la cambia la administración'),
    'con published_at puesta, el selector queda bloqueado aunque el estado sea pending_review')

  // ── 4. Crear curso pide la especialidad ──────────────────────────────────
  console.log('\n=== crear curso ===')
  const nuevo = await servir('/dashboard/instructor/cursos/nuevo')
  di(nuevo.estado === 200, 'la pantalla de crear se sirve', String(nuevo.estado))
  di(nuevo.html.includes('Especialidad'), 'pide la especialidad')
  di(nuevo.html.includes(esp!.nombre), 'con la verificada como opcion')
  di(nuevo.html.includes('Sin ella no podrás'), 'y explica para que hace falta')
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('lessons').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('lessons_publicadas').delete().eq('course_id', id)
    await svc.from('modules_publicados').delete().eq('course_id', id)
    await svc.from('courses_publicados').delete().eq('id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    await svc.auth.admin.deleteUser(id)
  }
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos ${count ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
