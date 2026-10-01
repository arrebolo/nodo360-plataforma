/**
 * ¿Qué puede hacer hoy un instructor con el examen final de un curso?
 *
 *   npx tsx scripts/medir-permisos-del-examen-final.mts
 *
 * El examen final de un curso son las preguntas de `quiz_questions` colgadas de
 * los módulos del curso (así lo lee el alumno en /cursos/[slug]/quiz-final y así
 * lo corrige lib/quiz/checkCourseQuiz.ts). `course_quizzes` está PARADA desde la
 * 078 y no aparece en ninguna línea de código.
 *
 * Se mide con dos instructores de usar y tirar y dos cursos: el propio y el ajeno.
 * Todo se borra al terminar.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-examen'
const CLAVE = 'Medir-' + Math.random().toString(36).slice(2) + 'K3!'
const di = (ok: boolean | null, t: string, extra = '') =>
  console.log(`   ${ok === null ? '·   ' : ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)

const creado: { usuarios: string[]; cursos: string[]; preguntas: string[] } = { usuarios: [], cursos: [], preguntas: [] }

async function nuevoInstructor(nombre: string) {
  const { data, error } = await svc.auth.admin.createUser({
    email: `${MARCA}-${nombre}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(`no se pudo crear ${nombre}: ${error.message}`)
  creado.usuarios.push(data.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', data.user.id)
  return { id: data.user.id, email: data.user.email as string }
}

async function cursoDe(instructorId: string, sufijo: string, estado: string) {
  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: c, error } = await svc.from('courses').insert({
    slug: `${MARCA}-${sufijo}-${Date.now()}`, title: `${MARCA} ${sufijo}`, level: 'beginner',
    status: estado, is_free: true, is_certifiable: false, specialty_id: esp!.id, instructor_id: instructorId,
    ...(estado === 'published' ? { published_at: new Date().toISOString() } : {}),
  }).select('id').single()
  if (error) throw new Error(`no se pudo crear el curso ${sufijo}: ${error.message}`)
  creado.cursos.push(c!.id)
  const { data: m, error: em } = await svc.from('modules')
    .insert({ course_id: c!.id, title: `m ${sufijo}`, order_index: 1 }).select('id').single()
  if (em) throw new Error(`no se pudo crear el modulo de ${sufijo}: ${em.message}`)
  return { cursoId: c!.id, moduloId: m!.id }
}

function pregunta(moduloId: string, texto: string) {
  return {
    module_id: moduloId, question: texto, options: ['a', 'b', 'c', 'd'],
    correct_answer: 0, order_index: 1, difficulty: 'medium', points: 1,
  }
}

try {
  // ── 0. El esquema, antes de escribir nada ────────────────────────────────
  const openapi = await fetch(`${URL_BASE}/rest/v1/`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY as string, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/openapi+json' },
  }).then((r) => r.json())
  const d = openapi.definitions?.quiz_questions
  console.log('\n=== esquema de quiz_questions ===')
  console.log(`   NOT NULL sin defecto: ${(d?.required ?? []).join(', ')}`)
  for (const [c, p] of Object.entries<Record<string, unknown>>(d?.properties ?? {})) {
    console.log(`   ${c.padEnd(18)} ${String(p.format ?? p.type)}`)
  }

  // ── 1. Dos instructores y tres cursos ────────────────────────────────────
  console.log('\n=== montaje ===')
  const mio = await nuevoInstructor('mio')
  const otro = await nuevoInstructor('otro')
  const propioBorrador = await cursoDe(mio.id, 'propio-borrador', 'draft')
  const propioPublicado = await cursoDe(mio.id, 'propio-publicado', 'published')
  const ajenoBorrador = await cursoDe(otro.id, 'ajeno-borrador', 'draft')
  di(true, 'dos instructores y tres cursos creados', `${creado.cursos.length} cursos`)

  // ── 2. La sesión del instructor "mío" ────────────────────────────────────
  const comoMio = createClient(URL_BASE, env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, { auth: { persistSession: false } })
  const { error: eLogin } = await comoMio.auth.signInWithPassword({ email: mio.email, password: CLAVE })
  if (eLogin) throw new Error(`no se pudo iniciar sesion: ${eLogin.message}`)
  di(true, 'sesion de instructor abierta')

  // ── 3. PostgREST directo: lo que la RLS y los GRANT permiten de verdad ───
  console.log('\n=== PostgREST directo, con el token del instructor (sin pasar por la API) ===')

  const leer = await comoMio.from('quiz_questions').select('id, question, correct_answer').limit(1)
  di(null, 'SELECT sobre quiz_questions', leer.error ? `${leer.error.code}: ${leer.error.message.slice(0, 60)}` : `${leer.data?.length ?? 0} filas; correct_answer ${leer.data?.[0] && 'correct_answer' in leer.data[0] ? 'VISIBLE' : 'no'}`)

  const enPropio = await comoMio.from('quiz_questions').insert(pregunta(propioBorrador.moduloId, 'propio borrador')).select('id')
  if (enPropio.data?.[0]) creado.preguntas.push(enPropio.data[0].id)
  di(!enPropio.error, 'INSERT en su PROPIO curso en borrador (deberia poder)',
    enPropio.error ? `${enPropio.error.code}: ${enPropio.error.message.slice(0, 60)}` : 'creada')

  const enAjeno = await comoMio.from('quiz_questions').insert(pregunta(ajenoBorrador.moduloId, 'ajeno')).select('id')
  if (enAjeno.data?.[0]) creado.preguntas.push(enAjeno.data[0].id)
  di(!!enAjeno.error, 'INSERT en el curso de OTRO instructor (debe fallar)',
    enAjeno.error ? `${enAjeno.error.code}: rechazado` : '*** ACEPTADO: puede escribir en el examen de otro')

  const enPublicado = await comoMio.from('quiz_questions').insert(pregunta(propioPublicado.moduloId, 'propio publicado')).select('id')
  if (enPublicado.data?.[0]) creado.preguntas.push(enPublicado.data[0].id)
  di(!!enPublicado.error, 'INSERT en su propio curso YA PUBLICADO (debe fallar)',
    enPublicado.error ? `${enPublicado.error.code}: rechazado` : '*** ACEPTADO: cambia el examen de un curso publicado')

  // Una pregunta ajena creada con el servicio, para probar UPDATE y DELETE
  const { data: ajena } = await svc.from('quiz_questions').insert(pregunta(ajenoBorrador.moduloId, 'de otro, creada por el servicio')).select('id').single()
  if (ajena) creado.preguntas.push(ajena.id)

  const upd = await comoMio.from('quiz_questions').update({ question: 'pisada' }).eq('id', ajena!.id).select('id')
  di((upd.data?.length ?? 0) === 0, 'UPDATE de una pregunta AJENA (debe no tocar nada)',
    upd.error ? `${upd.error.code}: rechazado` : (upd.data?.length ?? 0) === 0 ? 'no afecto a ninguna fila' : '*** PISADA')

  const del = await comoMio.from('quiz_questions').delete().eq('id', ajena!.id).select('id')
  di((del.data?.length ?? 0) === 0, 'DELETE de una pregunta AJENA (debe no borrar nada)',
    del.error ? `${del.error.code}: rechazado` : (del.data?.length ?? 0) === 0 ? 'no borro ninguna fila' : '*** BORRADA')

  // ── 4. ¿Y el alumno? correct_answer no puede verse ───────────────────────
  console.log('\n=== lo que ve un alumno matriculado (el mismo token sirve: es authenticated) ===')
  const anon = createClient(URL_BASE, env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, { auth: { persistSession: false } })
  const comoAnon = await anon.from('quiz_questions').select('id, correct_answer').limit(1)
  di(!!comoAnon.error || (comoAnon.data?.length ?? 0) === 0, 'anon NO puede leer quiz_questions',
    comoAnon.error ? `${comoAnon.error.code}: rechazado` : `${comoAnon.data?.length ?? 0} filas`)
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.preguntas) await svc.from('quiz_questions').delete().eq('id', id)
  for (const id of creado.cursos) {
    await svc.from('quiz_questions').delete().in('module_id',
      ((await svc.from('modules').select('id').eq('course_id', id)).data ?? []).map((m) => m.id))
    await svc.from('lessons').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) await svc.auth.admin.deleteUser(id)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos con la marca: ${count ?? 0}`)
}
