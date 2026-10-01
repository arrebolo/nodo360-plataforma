/**
 * Un mentor pide cambios: ¿vuelve el curso a su autor?
 *
 *   npx tsx scripts/probar-cambios-pedidos-por-el-mentor.mts [http://localhost:3123]
 *
 * Se prueba por /api/mentor/courses/review, que es una ruta de verdad y acepta una
 * sesión. La pantalla del mentor es un server action y no se puede llamar desde
 * aquí, pero las dos pasan por el mismo submitReview, que es donde está el cambio.
 *
 * Y se prueba lo que de verdad importaba: que después el instructor PUEDE reenviar.
 * Antes no podía, y eso era el fallo: el correo le decía que corrigiera y reenviara,
 * y submit-review se lo rechazaba porque el curso seguía en 'pending_review'.
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
const SITIO = process.argv[2] ?? 'http://localhost:3123'

const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-mentor'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
const COMENTARIO = 'El modulo 2 no tiene ninguna leccion y el examen final todavia no existe: sin eso no se puede evaluar.'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

function cookieDeSesion(sesion: unknown): string {
  const valor = 'base64-' + Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')
  const nombre = `sb-${REF}-auth-token`
  const TROZO = 3180
  if (valor.length <= TROZO) return `${nombre}=${valor}`
  const trozos: string[] = []
  for (let i = 0, n = 0; i < valor.length; i += TROZO, n++) trozos.push(`${nombre}.${n}=${valor.slice(i, i + TROZO)}`)
  return trozos.join('; ')
}

async function cuenta(nombre: string, rol: string) {
  const { data, error } = await svc.auth.admin.createUser({
    email: `${MARCA}-${nombre}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(`${nombre}: ${error.message}`)
  creado.usuarios.push(data.user.id)
  const { error: er } = await svc.from('users').update({ role: rol }).eq('id', data.user.id)
  if (er) throw new Error(`${nombre}: rol ${rol}: ${er.message}`)
  const c = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: s, error: el } = await c.auth.signInWithPassword({ email: data.user.email as string, password: CLAVE })
  if (el) throw new Error(`${nombre}: ${el.message}`)
  return { id: data.user.id, cookie: cookieDeSesion(s.session) }
}

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  const instructor = await cuenta('instructor', 'instructor')
  const mentor = await cuenta('mentor', 'mentor')

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()

  // Verificacion aprobada: sin ella, reenviar da 403 y con razon.
  const { error: ecert } = await svc.from('instructor_certifications').insert({
    user_id: instructor.id, specialty_id: esp!.id, status: 'aprobada',
    certification_number: `${MARCA}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })
  if (ecert) throw new Error(`verificacion: ${ecert.message}`)

  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'pending_review',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
    instructor_id: instructor.id, owner_id: instructor.id,
  }).select('id').single()
  if (ec) throw new Error(ec.message)
  creado.cursos.push(c!.id)

  const { data: mod } = await svc.from('modules')
    .insert({ course_id: c!.id, title: 'Modulo de prueba', order_index: 1 }).select('id').single()
  const { error: el } = await svc.from('lessons').insert({
    module_id: mod!.id, course_id: c!.id, title: 'Leccion de prueba',
    slug: `${MARCA}-l-${Date.now()}`, order_index: 1, content: '<p>contenido</p>',
  })
  if (el) throw new Error(`leccion: ${el.message}`)
  console.log('   montaje: instructor verificado, mentor, y un curso en revision')

  // ── 1. El mentor pide cambios por la ruta ────────────────────────────────
  const voto = await fetch(`${SITIO}/api/mentor/courses/review`, {
    method: 'POST',
    headers: { Cookie: mentor.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: c!.id, vote: 'request_changes', comment: COMENTARIO }),
  })
  const cuerpo = await voto.json().catch(() => ({}))
  di(voto.status === 200, 'el mentor pide cambios por la ruta', `${voto.status} ${JSON.stringify(cuerpo).slice(0, 70)}`)

  // ── 2. El curso vuelve a su autor, con el motivo ─────────────────────────
  const { data: tras } = await svc.from('courses')
    .select('status, rejection_reason').eq('id', c!.id).single()
  di(tras?.status === 'changes_requested', 'el curso pasa a changes_requested', String(tras?.status))
  di(tras?.rejection_reason === COMENTARIO, 'con el comentario del mentor, tal cual',
    `${(tras?.rejection_reason ?? '').length} caracteres`)

  // ── 3. Y el voto quedo registrado ────────────────────────────────────────
  const { count: votos } = await svc.from('course_reviews')
    .select('id', { count: 'exact', head: true }).eq('course_id', c!.id)
  di((votos ?? 0) === 1, 'el voto del mentor queda registrado', `${votos ?? 0} votos`)

  // ── 4. La notificacion le llega al instructor ────────────────────────────
  const { data: avisos } = await svc.from('notifications')
    .select('type, title, message').eq('user_id', instructor.id)
  const aviso = (avisos ?? []).find((a) => a.type === 'course_changes_requested')
  di(Boolean(aviso), 'el instructor recibe la notificacion en la plataforma',
    aviso ? String(aviso.title) : `${(avisos ?? []).length} notificaciones, ninguna de cambios`)
  di(Boolean(aviso && String(aviso.message).includes('Los mentores')),
    'y dice que la piden los mentores, no el equipo',
    aviso ? String(aviso.message).slice(0, 60) : '-')

  // ── 5. LO QUE IMPORTA: ahora si puede reenviar ───────────────────────────
  const reenvio = await fetch(`${SITIO}/api/instructor/courses/${c!.id}/submit-review`, {
    method: 'POST', headers: { Cookie: instructor.cookie, 'Content-Type': 'application/json' },
  })
  const cuerpoReenvio = await reenvio.json().catch(() => ({}))
  di(reenvio.status === 200, 'el instructor puede corregir y reenviar',
    `${reenvio.status} ${JSON.stringify(cuerpoReenvio).slice(0, 70)}`)

  const { data: final } = await svc.from('courses').select('status').eq('id', c!.id).single()
  di(final?.status === 'pending_review', 'y el curso vuelve a la cola de revision', String(final?.status))

  // ── 6. Un comentario corto se sigue rechazando ───────────────────────────
  const corto = await fetch(`${SITIO}/api/mentor/courses/review`, {
    method: 'POST',
    headers: { Cookie: mentor.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: c!.id, vote: 'request_changes', comment: '000' }),
  })
  di(corto.status === 400, 'un comentario de 3 caracteres se rechaza', String(corto.status))

  const { data: sigueEnCola } = await svc.from('courses').select('status').eq('id', c!.id).single()
  di(sigueEnCola?.status === 'pending_review', 'y el curso no se movio por ese intento',
    String(sigueEnCola?.status))
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('course_reviews').delete().eq('course_id', id)
    await svc.from('lessons').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    await svc.from('notifications').delete().eq('user_id', id)
    await svc.auth.admin.deleteUser(id)
  }
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos con la marca: ${count ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
