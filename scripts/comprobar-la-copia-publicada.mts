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

  // ── 3. QUE VE anon DEL ESPEJO ────────────────────────────────────────────
  //
  // ESTE BLOQUE DECIA LO CONTRARIO, y llevaba en rojo desde la migracion 119.
  // Con la 117 el espejo estaba cerrado a `anon`; la 119 lo ABRIO a proposito
  // —GRANT SELECT sobre las tres tablas mas una politica `retirada_el IS NULL`—
  // porque es la condicion para que el bloque 3 mueva las lecturas publicas a la
  // copia. Un script que afirma lo contrario de la decision tomada no avisa de
  // nada: solo ensena tres fallos que hay que ignorar, y a un fallo que se
  // ignora deja de mirarlo nadie.
  //
  // Lo que de verdad hay que vigilar son las tres cosas de abajo.
  console.log('\n=== lo que ve anon del espejo (119: las vivas si, las retiradas no) ===')

  for (const t of ['courses_publicados', 'modules_publicados', 'lessons_publicadas']) {
    // PRECONDICION DE LA ASERCION NEGATIVA. «anon no lee las retiradas» pasa
    // solo si no hay ninguna retirada que leer, y entonces no ha medido nada.
    // El cliente de servicio dice cuantas hay de verdad.
    const { count: hayRetiradas } = await svc.from(t)
      .select('id', { count: 'exact', head: true }).not('retirada_el', 'is', null)
    di((hayRetiradas ?? 0) > 0, `hay filas retiradas en ${t} que anon podria leer si la politica fallara`,
      `${hayRetiradas ?? 0}`)

    const vivas = await anon.from(t).select('id').is('retirada_el', null).limit(1)
    di(!vivas.error && (vivas.data?.length ?? 0) === 1, `anon lee las filas vivas de ${t}`,
      vivas.error ? `${vivas.error.code}: ${vivas.error.message.slice(0, 50)}` : `${vivas.data?.length ?? 0} filas`)

    // La otra mitad, y es la que protege: lo retirado sale del catalogo. Si la
    // politica se cayera, un curso archivado seguiria leyendose desde fuera.
    const retiradas = await anon.from(t).select('id').not('retirada_el', 'is', null).limit(1)
    di(!retiradas.error && (retiradas.data?.length ?? 0) === 0, `y NO lee las retiradas de ${t}`,
      retiradas.error ? `${retiradas.error.code}` : `${retiradas.data?.length ?? 0} filas`)
  }

  // Las preguntas del examen siguen cerradas a anon, con sesion o sin ella: la
  // 119 solo se las concedio a `authenticated`, y por columnas.
  const preguntas = await anon.from('quiz_questions_publicadas').select('id').limit(1)
  di(Boolean(preguntas.error) || (preguntas.data?.length ?? 0) === 0,
    'anon NO lee quiz_questions_publicadas',
    preguntas.error ? `${preguntas.error.code}` : `${preguntas.data?.length ?? 0} filas`)

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

  // ── 6. Borrar un curso: DOS CERRADURAS, y cada una con su codigo ─────────
  //
  // Esta comprobacion decia «borrar un curso con matriculas esta impedido» y
  // miraba solo `Boolean(error)`. Desde la migracion 121 hay un trigger que
  // frena el borrado ANTES, por tener copia publicada viva, asi que habria
  // seguido en verde sin volver a medir las matriculas nunca. Un verde que mide
  // otra cosa es peor que un rojo: ahora cada mitad exige SU codigo.
  console.log('\n=== borrar un curso: las dos cerraduras ===')
  await svc.from('course_enrollments').insert({ user_id: creado.usuario, course_id: c!.id })

  const conCopiaViva = await svc.from('courses').delete().eq('id', c!.id)
  di(conCopiaViva.error?.code === '42501',
    'con la copia publicada viva, borrar da 42501 (trigger de la 121)',
    conCopiaViva.error ? conCopiaViva.error.code : '*** SE BORRO')

  // Archivar retira la copia (trigger de la 119). Y entonces lo que impide
  // borrar son las matriculas, con otro codigo y por otro motivo.
  const archivado = await svc.from('courses').update({ status: 'archived' }).eq('id', c!.id)
  di(!archivado.error, 'archivar el curso',
    archivado.error ? `${archivado.error.code}: ${archivado.error.message.slice(0, 60)}` : 'archivado')

  const { count: copiasVivas } = await svc.from('courses_publicados')
    .select('id', { count: 'exact', head: true }).eq('id', c!.id).is('retirada_el', null)
  di((copiasVivas ?? 0) === 0, 'archivar ha retirado la copia', `${copiasVivas ?? 0} vivas`)

  const conMatriculas = await svc.from('courses').delete().eq('id', c!.id)
  di(conMatriculas.error?.code === '23503',
    'retirada la copia, lo que impide borrar son las matriculas (23503)',
    conMatriculas.error ? conMatriculas.error.code : '*** SE BORRO')
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
