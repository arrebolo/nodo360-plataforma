/**
 * Segunda pasada: separar la negativa de COLUMNA de la de TABLA, y medir lo que
 * un instructor puede hacer con las preguntas de SU PROPIO curso.
 *
 *   npx tsx scripts/medir-permisos-del-examen-final-2.mts
 *
 * La primera pasada pidió `correct_answer` en el SELECT y recibió 42501. Un SELECT
 * que nombra una columna que el rol no puede leer da 42501 igual que si la tabla
 * estuviera cerrada: es la lección de `users.bio`. Hay que preguntar columna a
 * columna para saber cuál de las dos cosas es.
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

const MARCA = 'qa-examen2'
const CLAVE = 'Medir-' + Math.random().toString(36).slice(2) + 'K3!'
const di = (ok: boolean | null, t: string, extra = '') =>
  console.log(`   ${ok === null ? '·   ' : ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

try {
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', u!.user.id)

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false, specialty_id: esp!.id, instructor_id: u!.user.id,
  }).select('id').single()
  if (ec) throw new Error(ec.message)
  creado.cursos.push(c!.id)
  const { data: m } = await svc.from('modules').insert({ course_id: c!.id, title: 'm', order_index: 1 }).select('id').single()

  const { data: preg } = await svc.from('quiz_questions').insert({
    module_id: m!.id, question: 'pregunta propia', options: ['a', 'b'], correct_answer: 0, order_index: 1,
  }).select('id').single()

  const comoInstructor = createClient(URL_BASE, env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, { auth: { persistSession: false } })
  const { error: el } = await comoInstructor.auth.signInWithPassword({ email: u!.user.email as string, password: CLAVE })
  if (el) throw new Error(el.message)

  // ── 1. Columna a columna: ¿tabla cerrada o columna cerrada? ──────────────
  console.log('\n=== SELECT columna a columna, con el token del instructor ===')
  const columnas = ['id', 'module_id', 'question', 'options', 'correct_answer', 'explanation', 'order_index', 'difficulty', 'points']
  for (const col of columnas) {
    const r = await comoInstructor.from('quiz_questions').select(col).eq('id', preg!.id)
    di(!r.error, `SELECT ${col}`, r.error ? `${r.error.code}: ${r.error.message.slice(0, 55)}` : `${r.data?.length ?? 0} filas`)
  }

  // ── 2. Lo propio: ¿puede editar y borrar sus preguntas? ──────────────────
  console.log('\n=== sobre SU PROPIA pregunta, en su curso en BORRADOR ===')
  const upd = await comoInstructor.from('quiz_questions').update({ question: 'corregida por su autor' }).eq('id', preg!.id).select('id')
  di((upd.data?.length ?? 0) === 1, 'UPDATE de su propia pregunta',
    upd.error ? `${upd.error.code}: ${upd.error.message.slice(0, 55)}` : `${upd.data?.length ?? 0} filas afectadas`)

  const del = await comoInstructor.from('quiz_questions').delete().eq('id', preg!.id).select('id')
  di((del.data?.length ?? 0) === 1, 'DELETE de su propia pregunta',
    del.error ? `${del.error.code}: ${del.error.message.slice(0, 55)}` : `${del.data?.length ?? 0} filas borradas`)

  // ── 3. El alumno: ¿ve la respuesta correcta? ─────────────────────────────
  console.log('\n=== un alumno (authenticated, sin ser autor) ===')
  const { data: a, error: ea } = await svc.auth.admin.createUser({
    email: `${MARCA}-alumno-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (ea) throw new Error(ea.message)
  creado.usuarios.push(a!.user.id)
  const { data: preg2 } = await svc.from('quiz_questions').insert({
    module_id: m!.id, question: 'para el alumno', options: ['a', 'b'], correct_answer: 1, order_index: 2,
  }).select('id').single()

  const comoAlumno = createClient(URL_BASE, env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, { auth: { persistSession: false } })
  await comoAlumno.auth.signInWithPassword({ email: a!.user.email as string, password: CLAVE })
  for (const col of ['question', 'options', 'correct_answer']) {
    const r = await comoAlumno.from('quiz_questions').select(col).eq('id', preg2!.id)
    di(col === 'correct_answer' ? !!r.error || (r.data?.length ?? 0) === 0 : true, `alumno: SELECT ${col}`,
      r.error ? `${r.error.code}: rechazado` : `${r.data?.length ?? 0} filas`)
  }
} catch (e) {
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
}
