/**
 * Segunda pasada de la auditoría: las dos cosas que la primera dejó imprecisas.
 *
 *   A) El examen final del curso. `quiz_questions` va por MÓDULO y `course_quizzes`
 *      por CURSO: la primera pasada usó la forma equivocada.
 *   B) Qué pasa exactamente al editar un curso publicado. La primera pasada devolvió
 *      «pending_review» donde el paso anterior había dejado «published», y eso hay
 *      que medirlo leyendo antes y después, no deducirlo.
 *
 * Mismo método: sesión real de instructor con la clave anónima. Borra todo al final.
 */
import fs from 'node:fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const svc = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })
const anon = createClient(URL_, ANON, { auth: { persistSession: false } })

const MARCA = 'qa-auditoria2'
const di = (ok: boolean | null, texto: string, extra = '') =>
  console.log(`   ${ok === null ? '--  ' : ok ? 'OK  ' : 'FALLA'} ${texto}${extra ? '  -> ' + extra : ''}`)

const creados = { usuario: null as string | null, cert: null as string | null, curso: null as string | null, modulo: null as string | null }
let sesion: SupabaseClient = anon

try {
  const correo = `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`
  const clave = 'Auditoria-' + Math.random().toString(36).slice(2) + 'Y8!'
  const { data: creada } = await svc.auth.admin.createUser({ email: correo, password: clave, email_confirm: true })
  creados.usuario = creada!.user.id
  await svc.from('users').update({ role: 'instructor' }).eq('id', creados.usuario)

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: cert } = await svc.from('instructor_certifications').insert({
    user_id: creados.usuario, specialty_id: esp!.id,
    certification_number: `QA-AUD2-${Date.now().toString().slice(-7)}`,
    status: 'aprobada', oral_result: 'apto', practical_result: 'apto', issued_at: new Date().toISOString(),
  }).select('id').single()
  creados.cert = cert!.id

  const { data: ses } = await anon.auth.signInWithPassword({ email: correo, password: clave })
  sesion = createClient(URL_, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${ses!.session!.access_token}` } },
  })

  const { data: curso } = await sesion.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner',
    status: 'draft', is_free: true, is_certifiable: false,
    instructor_id: creados.usuario, owner_id: creados.usuario, specialty_id: esp!.id,
  }).select('id').single()
  creados.curso = curso!.id

  const { data: mod } = await sesion.from('modules').insert({
    course_id: creados.curso, title: `${MARCA} módulo`, order_index: 1,
  }).select('id').single()
  creados.modulo = mod!.id

  // ════════ A) EL EXAMEN ════════
  console.log('\n═══ A) EXAMEN: las dos tablas ═══')

  const q1 = await sesion.from('quiz_questions').insert({
    module_id: creados.modulo, question: '¿Gas de una transferencia?',
    options: ['21000', '50000'], correct_answer: 0, order_index: 1,
  }).select('id').single()
  di(!q1.error, 'quiz_questions (examen DE MÓDULO) por el instructor',
    q1.error ? `${q1.error.code}: ${q1.error.message.slice(0, 80)}` : 'creada')
  if (!q1.error) await svc.from('quiz_questions').delete().eq('id', q1.data.id)

  const q2 = await sesion.from('course_quizzes').insert({
    course_id: creados.curso, question: '¿Qué es el gas?',
    options: ['Una unidad de coste', 'Un token'], correct_option: 0, order_index: 1,
  }).select('id').single()
  di(!q2.error, 'course_quizzes (examen FINAL DEL CURSO) por el instructor',
    q2.error ? `${q2.error.code}: ${q2.error.message.slice(0, 100)}` : 'creada')
  if (!q2.error) await svc.from('course_quizzes').delete().eq('id', q2.data.id)

  // ¿Y con la clave de servicio, para distinguir «no puede» de «no existe»?
  const q3 = await svc.from('course_quizzes').insert({
    course_id: creados.curso, question: 'sonda', options: ['a', 'b'], correct_option: 0, order_index: 99,
  }).select('id').single()
  di(!q3.error, 'course_quizzes con clave de servicio (para distinguir permiso de esquema)',
    q3.error ? `${q3.error.code}: ${q3.error.message.slice(0, 80)}` : 'creada')
  if (!q3.error) await svc.from('course_quizzes').delete().eq('id', q3.data.id)

  // ¿Quién lee course_quizzes en el código? Se responde fuera; aquí, si anon la ve.
  const q4 = await anon.from('course_quizzes').select('id').limit(1)
  di(!q4.error, 'anon puede leer course_quizzes', q4.error ? q4.error.code : 'sí')

  // ════════ B) EDITAR UN CURSO PUBLICADO ════════
  console.log('\n═══ B) EDITAR UN CURSO PUBLICADO ═══')

  // Se publica con la clave de servicio, como hace la ruta de admin.
  await svc.from('courses').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', creados.curso)
  const { data: antes } = await svc.from('courses').select('status').eq('id', creados.curso).single()
  di(antes!.status === 'published', 'el curso queda publicado antes de editar', `status=${antes!.status}`)

  // El instructor edita SOLO la descripción.
  const ed = await sesion.from('courses').update({ description: 'editada en la auditoría' }).eq('id', creados.curso)
  di(!ed.error, 'el instructor puede editar la descripción de un curso publicado',
    ed.error ? `${ed.error.code}: ${ed.error.message.slice(0, 80)}` : 'sí')

  const { data: despues } = await svc.from('courses').select('status, description').eq('id', creados.curso).single()
  console.log(`   status ANTES: published   status DESPUES: ${despues!.status}`)
  di(despues!.status !== 'published', '¿el curso vuelve a revisión al editarlo?',
    despues!.status === 'published' ? 'NO: el cambio queda publicado sin revisar' : `sí, pasa a ${despues!.status}`)

  // ¿Y el alumno? ¿Sigue viendo el curso mientras tanto?
  const vis = await anon.from('courses').select('id, status, description').eq('id', creados.curso).maybeSingle()
  di(!!vis.data, 'el alumno sigue viendo el curso después de la edición',
    vis.data ? `lo ve en «${vis.data.status}» con la descripción ${vis.data.description === 'editada en la auditoría' ? 'YA CAMBIADA' : 'anterior'}` : 'no lo ve')

  // Y el contenido de una lección publicada
  const { data: lec } = await sesion.from('lessons').insert({
    module_id: creados.modulo, course_id: creados.curso, title: `${MARCA} lec`,
    slug: `${MARCA}-lec-${Date.now()}`, order_index: 1, content: '<p>original</p>',
  }).select('id').single()

  if (lec) {
    const le = await sesion.from('lessons').update({ content: '<p>CAMBIADO sin revisión</p>' }).eq('id', lec.id)
    di(!le.error, 'el instructor cambia el contenido de una lección de un curso publicado',
      le.error ? le.error.code : 'sí, y sin pasar por revisión')

    const lv = await anon.from('lessons').select('content').eq('id', lec.id).maybeSingle()
    di(!!lv.data, 'el alumno ve el contenido nuevo inmediatamente',
      lv.data ? (String(lv.data.content).includes('CAMBIADO') ? 'sí, el cambio ya está visible' : 've el anterior') : 'no lo ve')

    await svc.from('lessons').delete().eq('id', lec.id)
  }
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n═══ LIMPIEZA ═══')
  if (creados.curso) {
    await svc.from('course_quizzes').delete().eq('course_id', creados.curso)
    await svc.from('lessons').delete().eq('course_id', creados.curso)
    if (creados.modulo) await svc.from('quiz_questions').delete().eq('module_id', creados.modulo)
    await svc.from('modules').delete().eq('course_id', creados.curso)
    await svc.from('courses').delete().eq('id', creados.curso)
  }
  if (creados.cert) await svc.from('instructor_certifications').delete().eq('id', creados.cert)
  if (creados.usuario) await svc.auth.admin.deleteUser(creados.usuario)

  const { count: c } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  const { count: v } = await svc.from('instructor_certifications').select('id', { count: 'exact', head: true }).like('certification_number', 'QA-AUD2-%')
  di((c ?? 0) === 0 && (v ?? 0) === 0, 'no queda nada de esta pasada', `cursos ${c ?? 0}, verificaciones ${v ?? 0}`)
}
