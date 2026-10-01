/**
 * Qué se lleva por delante borrar un curso, un módulo o una lección.
 *
 *   npx tsx scripts/medir-las-cascadas-del-contenido.mts
 *
 * El censo encontró quién apunta a cada tabla de contenido, pero no QUE PASA al
 * borrar. Y la diferencia importa mucho: `certificates.module_id` apunta a modules,
 * y si esa clave ajena fuera ON DELETE CASCADE, borrar un módulo borraría
 * certificados ya emitidos.
 *
 * Se mide borrando de verdad, sobre un curso de usar y tirar con una fila en cada
 * tabla dependiente. Nada de esto toca contenido real.
 */
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-cascada'
const di = (t: string, veredicto: string) => console.log(`   ${t.padEnd(42)} ${veredicto}`)

const creado: { usuario: string | null; curso: string | null } = { usuario: null, curso: null }

async function existe(tabla: string, columna: string, valor: string) {
  const { count } = await svc.from(tabla).select('id', { count: 'exact', head: true }).eq(columna, valor)
  return count ?? 0
}

try {
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`,
    password: 'Medir-' + Math.random().toString(36).slice(2) + 'K3!', email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuario = u!.user.id

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
  }).select('id').single()
  if (ec) throw new Error(ec.message)
  creado.curso = c!.id

  const { data: m } = await svc.from('modules')
    .insert({ course_id: c!.id, title: 'm', order_index: 1 }).select('id').single()
  const { data: l } = await svc.from('lessons').insert({
    module_id: m!.id, course_id: c!.id, title: 'l',
    slug: `${MARCA}-l-${Date.now()}`, order_index: 1, content: '<p>x</p>',
  }).select('id').single()

  // Una fila en cada tabla dependiente que tenga filas en produccion
  const dependientes: { tabla: string; columna: string; id: string }[] = []

  const prog = await svc.from('user_progress')
    .insert({ user_id: u!.user.id, lesson_id: l!.id, is_completed: true, completed_at: new Date().toISOString() })
    .select('id').single()
  if (prog.data) dependientes.push({ tabla: 'user_progress', columna: 'lesson_id', id: l!.id })
  else console.log(`   (user_progress no se pudo crear: ${prog.error?.message.slice(0, 60)})`)

  const xp = await svc.from('xp_events')
    .insert({
      user_id: u!.user.id, course_id: c!.id, lesson_id: l!.id,
      event_type: 'lesson_completed', xp_earned: 1, metadata: {}, description: MARCA,
    })
    .select('id').single()
  if (xp.data) dependientes.push({ tabla: 'xp_events', columna: 'lesson_id', id: l!.id })
  else console.log(`   (xp_events no se pudo crear: ${xp.error?.message.slice(0, 70)})`)

  const intento = await svc.from('quiz_attempts')
    .insert({
      user_id: u!.user.id, module_id: m!.id, score: 100, total_questions: 1,
      correct_answers: 1, passed: true, answers: {}, completed_at: new Date().toISOString(),
    })
    .select('id').single()
  if (intento.data) dependientes.push({ tabla: 'quiz_attempts', columna: 'module_id', id: m!.id })
  else console.log(`   (quiz_attempts no se pudo crear: ${intento.error?.message.slice(0, 70)})`)

  const cert = await svc.from('certificates').insert({
    user_id: u!.user.id, course_id: c!.id, module_id: m!.id, type: 'module',
    certificate_number: `${MARCA}-${randomUUID().slice(0, 8)}`,
    title: `${MARCA} certificado`, issued_at: new Date().toISOString(),
  }).select('id').single()
  if (cert.data) dependientes.push({ tabla: 'certificates', columna: 'module_id', id: m!.id })
  else console.log(`   (certificates no se pudo crear: ${cert.error?.message.slice(0, 90)})`)

  const certCurso = await svc.from('certificates').insert({
    user_id: u!.user.id, course_id: c!.id, type: 'course',
    certificate_number: `${MARCA}-c-${randomUUID().slice(0, 8)}`,
    title: `${MARCA} certificado de curso`, issued_at: new Date().toISOString(),
  }).select('id').single()
  if (!certCurso.data) console.log(`   (certificado de curso no creado: ${certCurso.error?.message.slice(0, 80)})`)

  const preg = await svc.from('quiz_questions').insert({
    module_id: m!.id, question: 'p', options: ['a', 'b'], correct_answer: 0, order_index: 1,
  }).select('id').single()
  if (preg.data) dependientes.push({ tabla: 'quiz_questions', columna: 'module_id', id: m!.id })

  console.log(`\n=== montaje: ${dependientes.length} tablas dependientes con una fila cada una ===`)

  // ── Borrar la LECCION ────────────────────────────────────────────────────
  console.log('\n=== se borra la LECCION ===')
  const antesLeccion = Object.fromEntries(await Promise.all(
    dependientes.filter((d) => d.columna === 'lesson_id')
      .map(async (d) => [d.tabla, await existe(d.tabla, d.columna, d.id)] as const)
  ))
  const delL = await svc.from('lessons').delete().eq('id', l!.id)
  if (delL.error) {
    di('borrar la leccion', `IMPEDIDO (RESTRICT): ${delL.error.code} ${delL.error.message.slice(0, 50)}`)
  } else {
    for (const d of dependientes.filter((x) => x.columna === 'lesson_id')) {
      const despues = await existe(d.tabla, d.columna, d.id)
      di(`${d.tabla}.${d.columna}`,
        despues === 0 && antesLeccion[d.tabla] > 0
          ? `SE BORRA con la leccion (CASCADE): ${antesLeccion[d.tabla]} -> 0`
          : `sobrevive: ${antesLeccion[d.tabla]} -> ${despues}`)
    }
  }

  // ── Borrar el MODULO ─────────────────────────────────────────────────────
  console.log('\n=== se borra el MODULO ===')
  const antesModulo = Object.fromEntries(await Promise.all(
    dependientes.filter((d) => d.columna === 'module_id')
      .map(async (d) => [d.tabla, await existe(d.tabla, d.columna, d.id)] as const)
  ))
  const delM = await svc.from('modules').delete().eq('id', m!.id)
  if (delM.error) {
    di('borrar el modulo', `IMPEDIDO (RESTRICT): ${delM.error.code} ${delM.error.message.slice(0, 50)}`)
  } else {
    for (const d of dependientes.filter((x) => x.columna === 'module_id')) {
      const despues = await existe(d.tabla, d.columna, d.id)
      di(`${d.tabla}.${d.columna}`,
        despues === 0 && antesModulo[d.tabla] > 0
          ? `SE BORRA con el modulo (CASCADE): ${antesModulo[d.tabla]} -> 0`
          : `sobrevive: ${antesModulo[d.tabla]} -> ${despues}`)
    }
  }

  // ── Borrar el CURSO ──────────────────────────────────────────────────────
  console.log('\n=== se borra el CURSO ===')
  const antesCurso = {
    certificates: await existe('certificates', 'course_id', c!.id),
    xp_events: await existe('xp_events', 'course_id', c!.id),
  }
  const delC = await svc.from('courses').delete().eq('id', c!.id)
  if (delC.error) {
    di('borrar el curso', `IMPEDIDO (RESTRICT): ${delC.error.code} ${delC.error.message.slice(0, 60)}`)
  } else {
    creado.curso = null
    for (const [tabla, antes] of Object.entries(antesCurso)) {
      const despues = await existe(tabla, 'course_id', c!.id)
      di(`${tabla}.course_id`,
        despues === 0 && antes > 0
          ? `SE BORRA con el curso (CASCADE): ${antes} -> 0`
          : `sobrevive: ${antes} -> ${despues}`)
    }
  }
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  if (creado.usuario) {
    await svc.from('certificates').delete().eq('user_id', creado.usuario)
    await svc.from('xp_events').delete().eq('user_id', creado.usuario)
    await svc.from('quiz_attempts').delete().eq('user_id', creado.usuario)
    await svc.from('user_progress').delete().eq('user_id', creado.usuario)
  }
  if (creado.curso) {
    const mods = ((await svc.from('modules').select('id').eq('course_id', creado.curso)).data ?? []).map((x) => x.id)
    if (mods.length) await svc.from('quiz_questions').delete().in('module_id', mods)
    await svc.from('lessons').delete().eq('course_id', creado.curso)
    await svc.from('modules').delete().eq('course_id', creado.curso)
    await svc.from('courses').delete().eq('id', creado.curso)
  }
  if (creado.usuario) await svc.auth.admin.deleteUser(creado.usuario)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  const { count: certs } = await svc.from('certificates').select('id', { count: 'exact', head: true }).like('certificate_number', `${MARCA}%`)
  di('no queda nada', `cursos ${count ?? 0}, certificados ${certs ?? 0}`)
}
