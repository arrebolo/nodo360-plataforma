/**
 * ¿Qué le pasa al progreso y a los certificados si se borra una lección?
 *
 *   npx tsx scripts/medir-que-pasa-al-borrar-una-leccion.mts
 *
 * Decide el diseño de la copia publicada: si el borrado de una lección arrastra el
 * progreso (ON DELETE CASCADE), el identificador de la lección NO puede ser la
 * referencia del progreso, y hace falta un registro estable.
 *
 * Todo con datos de usar y tirar, y se borra al terminar.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-fk'
const di = (ok: boolean | null, t: string, extra = '') =>
  console.log(`   ${ok === null ? '--  ' : ok ? 'OK  ' : 'DATO '} ${t}${extra ? '  -> ' + extra : ''}`)

const creados = { usuario: null as string | null, curso: null as string | null, modulo: null as string | null, leccion: null as string | null }

try {
  const { data: u } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: 'Medir-' + Math.random().toString(36).slice(2) + 'K3!', email_confirm: true,
  })
  creados.usuario = u!.user.id

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: c } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner',
    status: 'draft', is_free: true, is_certifiable: false, specialty_id: esp!.id,
  }).select('id').single()
  creados.curso = c!.id

  const { data: m } = await svc.from('modules').insert({ course_id: creados.curso, title: 'm', order_index: 1 }).select('id').single()
  creados.modulo = m!.id

  const { data: l } = await svc.from('lessons').insert({
    module_id: creados.modulo, course_id: creados.curso, title: 'l',
    slug: `${MARCA}-l-${Date.now()}`, order_index: 1, content: '<p>x</p>',
  }).select('id').single()
  creados.leccion = l!.id

  // Progreso y matrícula
  await svc.from('course_enrollments').insert({ user_id: creados.usuario, course_id: creados.curso })
  const p = await svc.from('user_progress').insert({
    user_id: creados.usuario, lesson_id: creados.leccion,
    is_completed: true, completed_at: new Date().toISOString(),
  }).select('id')
  di(!p.error, 'se puede crear progreso sobre la lección', p.error ? `${p.error.code}: ${p.error.message.slice(0, 70)}` : 'sí')

  // ¿Hay clave ajena? Se prueba con un id que no existe.
  const { randomUUID } = await import('node:crypto')
  const fk = await svc.from('user_progress').insert({
    user_id: creados.usuario, lesson_id: randomUUID(), is_completed: false,
  }).select('id')
  di(!!fk.error, 'user_progress.lesson_id tiene clave ajena a lessons',
    fk.error ? `${fk.error.code} (${fk.error.code === '23503' ? 'sí' : 'otro error'})` : 'NO: acepta un id inexistente')
  if (!fk.error) await svc.from('user_progress').delete().eq('id', fk.data[0].id)

  // LA PREGUNTA: al borrar la lección, ¿qué pasa con el progreso?
  console.log('\n   --- se borra la lección y se mira el progreso ---')
  const antes = await svc.from('user_progress').select('id, lesson_id', { count: 'exact' }).eq('lesson_id', creados.leccion)
  const del = await svc.from('lessons').delete().eq('id', creados.leccion)

  if (del.error) {
    di(true, 'la base IMPIDE borrar una lección con progreso (RESTRICT)', `${del.error.code}: ${del.error.message.slice(0, 70)}`)
    creados.leccion = creados.leccion // sigue existiendo
  } else {
    const despues = await svc.from('user_progress').select('id, lesson_id', { count: 'exact' }).eq('lesson_id', creados.leccion)
    if ((despues.count ?? 0) === 0) {
      const huerfano = await svc.from('user_progress').select('id, lesson_id').eq('user_id', creados.usuario)
      const quedan = (huerfano.data ?? []).length
      di(false, 'borrar la lección SE LLEVA el progreso (ON DELETE CASCADE)',
        `antes ${antes.count}, después ${despues.count}; filas de progreso de esa persona: ${quedan}`)
    } else {
      di(false, 'el progreso SOBREVIVE apuntando a una lección que ya no existe',
        `antes ${antes.count}, después ${despues.count}`)
    }
    creados.leccion = null
  }

  // ¿Y los certificados? ¿A qué apuntan?
  const cert = await svc.from('certificates').select('*').limit(1)
  if (!cert.error && cert.data?.[0]) {
    const cols = Object.keys(cert.data[0])
    di(null, 'columnas de certificates', cols.join(', '))
    di(cols.includes('course_id'), 'el certificado apunta al CURSO, no a lecciones',
      cols.includes('lesson_id') ? 'también tiene lesson_id' : 'solo course_id/module_id')
  }
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n   --- limpieza ---')
  if (creados.usuario) await svc.from('user_progress').delete().eq('user_id', creados.usuario)
  if (creados.curso) {
    await svc.from('course_enrollments').delete().eq('course_id', creados.curso)
    await svc.from('lessons').delete().eq('course_id', creados.curso)
    await svc.from('modules').delete().eq('course_id', creados.curso)
    await svc.from('courses').delete().eq('id', creados.curso)
  }
  if (creados.usuario) await svc.auth.admin.deleteUser(creados.usuario)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos ${count ?? 0}`)
}
