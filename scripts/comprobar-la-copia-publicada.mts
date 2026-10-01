/**
 * La 117, comprobada contra la base de verdad después de aplicarla.
 *
 *   npx tsx scripts/comprobar-la-copia-publicada.mts
 *
 * La fila de verificación de la migración dice que sus propias cuentas cuadran. Esto
 * es distinto: comprueba desde fuera lo que la migración PROMETE, y sobre todo las
 * dos cosas que no se pueden ver contando filas:
 *
 *   · que borrar una lección de trabajo ya NO borra el progreso de nadie
 *   · que las tablas espejo están cerradas a anon y a authenticated
 *
 * Es la condición para que la PR 3 —la que mueve las lecturas al espejo— se pueda
 * mergear. Todo con datos de usar y tirar, y se borra al terminar.
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
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })
const anon = createClient(URL_BASE, ANON, { auth: { persistSession: false } })

const MARCA = 'qa-espejo'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado = { usuario: null as string | null, curso: null as string | null, modulo: null as string | null, leccion: null as string | null }

try {
  // ── 1. El espejo cuadra con el trabajo, curso a curso ────────────────────
  console.log('\n=== el espejo frente a las tablas de trabajo ===')
  const { data: publicados } = await svc.from('courses').select('id, slug').eq('status', 'published')
  let descuadres = 0
  for (const c of publicados ?? []) {
    const { count: mt } = await svc.from('modules').select('id', { count: 'exact', head: true }).eq('course_id', c.id)
    const { count: me } = await svc.from('modules_publicados').select('id', { count: 'exact', head: true })
      .eq('course_id', c.id).is('retirada_el', null)
    const { count: lt } = await svc.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', c.id)
    const { count: le } = await svc.from('lessons_publicadas').select('id', { count: 'exact', head: true })
      .eq('course_id', c.id).is('retirada_el', null)
    if (mt !== me || lt !== le) {
      descuadres++
      console.log(`   *** ${c.slug}: modulos ${mt}/${me}, lecciones ${lt}/${le}`)
    }
  }
  di(descuadres === 0, `los ${(publicados ?? []).length} cursos publicados cuadran`, `descuadres: ${descuadres}`)

  // ── 2. Nada de lo retirado es de un curso publicado ──────────────────────
  const { data: retirados } = await svc.from('courses_publicados')
    .select('id, slug').not('retirada_el', 'is', null)
  const idsPub = new Set((publicados ?? []).map((c) => c.id))
  const malRetirados = (retirados ?? []).filter((c) => idsPub.has(c.id))
  di(malRetirados.length === 0, 'ningun curso publicado esta marcado como retirado',
    `${(retirados ?? []).length} retirados, ${malRetirados.length} mal`)

  // ── 3. LAS TABLAS ESPEJO ESTAN CERRADAS ──────────────────────────────────
  console.log('\n=== lo que ve anon (no debe ver nada del espejo) ===')
  for (const t of ['courses_publicados', 'modules_publicados', 'lessons_publicadas', 'quiz_questions_publicadas']) {
    const r = await anon.from(t).select('id').limit(1)
    di(Boolean(r.error) || (r.data?.length ?? 0) === 0, `anon no lee ${t}`,
      r.error ? `${r.error.code}` : `${r.data?.length ?? 0} filas`)
  }

  // ── 4. LO QUE IMPORTA: borrar una leccion ya no borra el progreso ─────────
  console.log('\n=== borrar una leccion de trabajo con progreso encima ===')
  const { data: u } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  creado.usuario = u!.user.id

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: c } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
  }).select('id').single()
  creado.curso = c!.id
  const { data: m } = await svc.from('modules')
    .insert({ course_id: c!.id, title: 'm', order_index: 1 }).select('id').single()
  creado.modulo = m!.id
  const { data: l } = await svc.from('lessons').insert({
    module_id: m!.id, course_id: c!.id, title: 'l',
    slug: `${MARCA}-l-${Date.now()}`, order_index: 1, content: '<p>x</p>',
  }).select('id').single()
  creado.leccion = l!.id

  // Se publica: el trigger refresca la copia
  await svc.from('courses').update({ status: 'published' }).eq('id', c!.id)
  const { count: enEspejo } = await svc.from('lessons_publicadas')
    .select('id', { count: 'exact', head: true }).eq('id', l!.id).is('retirada_el', null)
  di((enEspejo ?? 0) === 1, 'el trigger publico la copia al pasar a published', `${enEspejo ?? 0} lecciones`)

  const p = await svc.from('user_progress').insert({
    user_id: creado.usuario, lesson_id: l!.id, is_completed: true, completed_at: new Date().toISOString(),
  }).select('id')
  di(!p.error, 'se registra progreso sobre la leccion publicada',
    p.error ? `${p.error.code}: ${p.error.message.slice(0, 60)}` : 'si')

  const borrada = await svc.from('lessons').delete().eq('id', l!.id)
  di(!borrada.error, 'se borra la leccion de TRABAJO', borrada.error ? `${borrada.error.code}` : 'borrada')
  if (!borrada.error) creado.leccion = null

  const { count: sigue } = await svc.from('user_progress')
    .select('id', { count: 'exact', head: true }).eq('lesson_id', l!.id)
  di((sigue ?? 0) === 1, '*** y el progreso SIGUE AHI (antes se lo llevaba la cascada)',
    `${sigue ?? 0} filas`)

  // ── 5. Y al republicar, la fila publicada se retira ──────────────────────
  const { data: cuentas, error: ePub } = await svc.rpc('publicar_curso', { p_course_id: c!.id })
  di(!ePub, 'publicar_curso por RPC con el cliente de servicio',
    ePub ? `${ePub.code}: ${ePub.message.slice(0, 60)}` : JSON.stringify(cuentas?.[0] ?? cuentas))

  const { count: retirada } = await svc.from('lessons_publicadas')
    .select('id', { count: 'exact', head: true }).eq('id', l!.id).not('retirada_el', 'is', null)
  di((retirada ?? 0) === 1, 'la leccion que ya no existe queda retirada, no borrada', `${retirada ?? 0}`)

  // ── 6. Borrar un curso con matricula esta impedido ───────────────────────
  console.log('\n=== las matriculas ===')
  await svc.from('course_enrollments').insert({ user_id: creado.usuario, course_id: c!.id })
  const delCurso = await svc.from('courses').delete().eq('id', c!.id)
  di(Boolean(delCurso.error), 'borrar un curso con matriculas esta impedido',
    delCurso.error ? `${delCurso.error.code}` : '*** SE BORRO')
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  // El orden lo manda el espejo: primero lo de la gente, luego el registro.
  if (creado.usuario) {
    await svc.from('user_progress').delete().eq('user_id', creado.usuario)
    await svc.from('course_enrollments').delete().eq('user_id', creado.usuario)
  }
  if (creado.curso) {
    const mods = ((await svc.from('modules_publicados').select('id').eq('course_id', creado.curso)).data ?? []).map((x) => x.id)
    if (mods.length) await svc.from('quiz_questions_publicadas').delete().in('module_id', mods)
    await svc.from('lessons_publicadas').delete().eq('course_id', creado.curso)
    await svc.from('modules_publicados').delete().eq('course_id', creado.curso)
    await svc.from('courses_publicados').delete().eq('id', creado.curso)
    await svc.from('lessons').delete().eq('course_id', creado.curso)
    await svc.from('modules').delete().eq('course_id', creado.curso)
    await svc.from('courses').delete().eq('id', creado.curso)
  }
  if (creado.usuario) await svc.auth.admin.deleteUser(creado.usuario)
  const { count: cT } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  const { count: cE } = await svc.from('courses_publicados').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((cT ?? 0) === 0 && (cE ?? 0) === 0, 'no queda nada', `trabajo ${cT ?? 0}, registro ${cE ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
