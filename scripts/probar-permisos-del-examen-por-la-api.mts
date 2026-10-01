/**
 * /api/admin/quiz contra un servidor de verdad, con sesiones de verdad.
 *
 *   npx tsx scripts/probar-permisos-del-examen-por-la-api.mts [http://localhost:3123]
 *
 * POR QUE POR LA API Y NO POR PostgREST
 *   Esta ruta escribe con el cliente de servicio, que salta la RLS. Todo lo que la
 *   RLS impide —escribir en el curso de otro— por aqui estaba permitido, porque
 *   solo se comprobaba el ROL. Medir la RLS no dice nada de esta via: hay que
 *   llamar a la ruta.
 *
 * COMO SE AUTENTICA
 *   @supabase/ssr 0.7 guarda la sesion en la cookie `sb-<ref>-auth-token` con el
 *   valor `base64-` + base64url del JSON de la sesion, partida en trozos .0 .1 si
 *   no cabe. Aqui se inicia sesion con supabase-js y se arma esa cookie a mano.
 *
 * NO se crea ningun administrador de prueba: dar el rol admin a una cuenta, aunque
 * sea un minuto, es un privilegio real en produccion. Se prueban los dos roles que
 * se pueden dar y quitar sin riesgo, instructor y mentor.
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

const MARCA = 'qa-api-examen'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

/** La cookie que @supabase/ssr espera, partida en trozos como lo hace la libreria. */
function cookieDeSesion(sesion: unknown): string {
  const valor = 'base64-' + Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')
  const nombre = `sb-${REF}-auth-token`
  const TROZO = 3180
  if (valor.length <= TROZO) return `${nombre}=${valor}`
  const trozos: string[] = []
  for (let i = 0, n = 0; i < valor.length; i += TROZO, n++) {
    trozos.push(`${nombre}.${n}=${valor.slice(i, i + TROZO)}`)
  }
  return trozos.join('; ')
}

async function sesionDe(email: string): Promise<string> {
  const c = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password: CLAVE })
  if (error) throw new Error(`no se pudo iniciar sesion como ${email}: ${error.message}`)
  return cookieDeSesion(data.session)
}

async function llamar(cookie: string, ruta: string, opciones: RequestInit = {}) {
  const r = await fetch(`${SITIO}${ruta}`, {
    ...opciones,
    headers: { Cookie: cookie, 'Content-Type': 'application/json', ...(opciones.headers ?? {}) },
  })
  let cuerpo: Record<string, unknown> = {}
  try { cuerpo = await r.json() } catch { /* sin cuerpo */ }
  return { estado: r.status, cuerpo }
}

async function usuario(nombre: string, rol: string) {
  const { data, error } = await svc.auth.admin.createUser({
    email: `${MARCA}-${nombre}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(`${nombre}: ${error.message}`)
  creado.usuarios.push(data.user.id)
  const { error: er } = await svc.from('users').update({ role: rol }).eq('id', data.user.id)
  if (er) throw new Error(`${nombre}: no se pudo poner el rol ${rol}: ${er.message}`)
  return { id: data.user.id, email: data.user.email as string }
}

async function curso(instructorId: string, sufijo: string, publicado: boolean) {
  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: c, error } = await svc.from('courses').insert({
    slug: `${MARCA}-${sufijo}-${Date.now()}`, title: `${MARCA} ${sufijo}`, level: 'beginner',
    status: publicado ? 'published' : 'draft', is_free: true, is_certifiable: false,
    specialty_id: esp!.id, instructor_id: instructorId, owner_id: instructorId,
    ...(publicado ? { published_at: new Date().toISOString() } : {}),
  }).select('id').single()
  if (error) throw new Error(`curso ${sufijo}: ${error.message}`)
  creado.cursos.push(c!.id)
  const { data: m, error: em } = await svc.from('modules')
    .insert({ course_id: c!.id, title: `m ${sufijo}`, order_index: 1 }).select('id').single()
  if (em) throw new Error(`modulo ${sufijo}: ${em.message}`)
  return { cursoId: c!.id, moduloId: m!.id }
}

const cuerpoPregunta = (moduloId: string, texto: string) => JSON.stringify({
  module_id: moduloId, question: texto, options: ['a', 'b', 'c', 'd'],
  correct_answer: 0, order_index: 1, difficulty: 'medium', points: 1,
})

try {
  // El servidor, antes de nada
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)
  console.log(`   servidor en ${SITIO}, responde ${vivo} sin sesion`)
  di(vivo === 401, 'sin sesion la ruta responde 401', String(vivo))

  console.log('\n=== montaje ===')
  const mio = await usuario('mio', 'instructor')
  const otro = await usuario('otro', 'instructor')
  const elMentor = await usuario('mentor', 'mentor')
  const propioBorrador = await curso(mio.id, 'propio-borrador', false)
  const propioPublicado = await curso(mio.id, 'propio-publicado', true)
  const ajenoBorrador = await curso(otro.id, 'ajeno-borrador', false)
  console.log(`   2 instructores, 1 mentor, 3 cursos`)

  const comoMio = await sesionDe(mio.email)
  const comoMentor = await sesionDe(elMentor.email)

  // ── El instructor, en su propio borrador ────────────────────────────────
  console.log('\n=== el instructor en SU curso en borrador (debe poder) ===')
  const crear = await llamar(comoMio, '/api/admin/quiz', {
    method: 'POST', body: cuerpoPregunta(propioBorrador.moduloId, 'creada por su autor'),
  })
  di(crear.estado === 201, 'POST crea la pregunta', `${crear.estado} ${JSON.stringify(crear.cuerpo).slice(0, 80)}`)
  const idCreada = (crear.cuerpo as { data?: { id?: string } }).data?.id

  const listar = await llamar(comoMio, `/api/admin/quiz?courseId=${propioBorrador.cursoId}`)
  di(listar.estado === 200 && Array.isArray((listar.cuerpo as { questions?: unknown[] }).questions),
    'GET lista su examen', `${listar.estado}, ${((listar.cuerpo as { questions?: unknown[] }).questions ?? []).length} preguntas`)

  if (idCreada) {
    const editar = await llamar(comoMio, '/api/admin/quiz', {
      method: 'PUT', body: JSON.stringify({ id: idCreada, question: 'editada por su autor' }),
    })
    di(editar.estado === 200, 'PUT edita su pregunta', String(editar.estado))
  }

  // ── El instructor, en el curso de otro ──────────────────────────────────
  console.log('\n=== el instructor en el curso de OTRO (debe fallar con 403) ===')
  const enAjeno = await llamar(comoMio, '/api/admin/quiz', {
    method: 'POST', body: cuerpoPregunta(ajenoBorrador.moduloId, 'colada en el curso de otro'),
  })
  di(enAjeno.estado === 403, 'POST en el curso de otro instructor',
    `${enAjeno.estado} ${String((enAjeno.cuerpo as { error?: string }).error ?? '').slice(0, 70)}`)

  const listarAjeno = await llamar(comoMio, `/api/admin/quiz?courseId=${ajenoBorrador.cursoId}`)
  di(listarAjeno.estado === 403, 'GET del examen de otro instructor', String(listarAjeno.estado))

  // ── El instructor, en su propio curso publicado ─────────────────────────
  console.log('\n=== el instructor en SU curso YA PUBLICADO ===')
  const enPublicado = await llamar(comoMio, '/api/admin/quiz', {
    method: 'POST', body: cuerpoPregunta(propioPublicado.moduloId, 'colada en un publicado'),
  })
  di(enPublicado.estado === 403, 'POST en su curso publicado (debe fallar)',
    `${enPublicado.estado} ${String((enPublicado.cuerpo as { error?: string }).error ?? '').slice(0, 70)}`)

  const verPublicado = await llamar(comoMio, `/api/admin/quiz?courseId=${propioPublicado.cursoId}`)
  di(verPublicado.estado === 200, 'GET de su curso publicado SI se permite (leer no es cambiar)',
    String(verPublicado.estado))

  // ── Una pregunta de un curso publicado, por id ──────────────────────────
  const { data: pregPub } = await svc.from('quiz_questions').insert({
    module_id: propioPublicado.moduloId, question: 'ya estaba en el publicado',
    options: ['a', 'b'], correct_answer: 0, order_index: 1,
  }).select('id').single()

  const pisar = await llamar(comoMio, '/api/admin/quiz', {
    method: 'PUT', body: JSON.stringify({ id: pregPub!.id, correct_answer: 1 }),
  })
  di(pisar.estado === 403, 'PUT de la clave de un examen publicado', String(pisar.estado))

  const borrar = await llamar(comoMio, `/api/admin/quiz?id=${pregPub!.id}`, { method: 'DELETE' })
  di(borrar.estado === 403, 'DELETE de una pregunta de un examen publicado', String(borrar.estado))

  const { count: sigue } = await svc.from('quiz_questions')
    .select('id', { count: 'exact', head: true }).eq('id', pregPub!.id)
  di((sigue ?? 0) === 1, 'y la pregunta sigue ahi', `${sigue ?? 0} filas`)

  // ── El mentor ───────────────────────────────────────────────────────────
  console.log('\n=== el mentor: cualquier borrador si, un publicado no ===')
  const mentorEnAjeno = await llamar(comoMentor, '/api/admin/quiz', {
    method: 'POST', body: cuerpoPregunta(ajenoBorrador.moduloId, 'del mentor, en un borrador ajeno'),
  })
  di(mentorEnAjeno.estado === 201, 'POST del mentor en un borrador que no es suyo', String(mentorEnAjeno.estado))

  const mentorEnPublicado = await llamar(comoMentor, '/api/admin/quiz', {
    method: 'POST', body: cuerpoPregunta(propioPublicado.moduloId, 'del mentor, en un publicado'),
  })
  di(mentorEnPublicado.estado === 403, 'POST del mentor en un curso publicado', String(mentorEnPublicado.estado))

  // ── Un identificador que no existe ──────────────────────────────────────
  console.log('\n=== identificadores inventados ===')
  const { randomUUID } = await import('node:crypto')
  const inventado = await llamar(comoMio, '/api/admin/quiz', {
    method: 'PUT', body: JSON.stringify({ id: randomUUID(), question: 'x' }),
  })
  di(inventado.estado === 404, 'PUT de una pregunta que no existe da 404, no 500', String(inventado.estado))
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    const mods = ((await svc.from('modules').select('id').eq('course_id', id)).data ?? []).map((x) => x.id)
    if (mods.length) await svc.from('quiz_questions').delete().in('module_id', mods)
    await svc.from('lessons').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) await svc.auth.admin.deleteUser(id)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos con la marca: ${count ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
