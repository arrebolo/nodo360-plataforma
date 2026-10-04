/**
 * Los restos que dejan las pruebas si se interrumpen a mitad.
 *
 *   npx tsx scripts/limpiar-restos-de-pruebas.mts            ← SOLO MIRA, no borra
 *   npx tsx scripts/limpiar-restos-de-pruebas.mts --borrar   ← borra
 *
 * POR QUE EXISTE
 *   Las pruebas que sirven páginas reales crean en PRODUCCION lo que necesitan
 *   —instructores, cursos, módulos, lecciones, verificaciones— y lo borran en su
 *   bloque `finally`, así que una comprobación en rojo no deja nada. Lo que sí deja
 *   restos es que el proceso MUERA: Ctrl-C, un plazo agotado, el portátil que se
 *   suspende. Entonces quedan filas de prueba vivas en la base de la plataforma y no
 *   había forma de barrerlas salvo a mano.
 *
 * COMO SABE QUE UNA FILA ES DE PRUEBA, y por qué no se puede equivocar
 *   Por el correo: todas las cuentas de prueba se crean en `@nodo360-pruebas.invalid`,
 *   un dominio RESERVADO (RFC 2606) que no puede existir de verdad. Ninguna persona
 *   real puede tener una dirección ahí, así que no hay ambigüedad posible.
 *
 *   Los cursos, además, por `slug` que empieza por `qa-` o título que empieza por
 *   «PRUEBA » —el convenio de todos los scripts— o por colgar de una de esas cuentas.
 *
 * LA RED DE SEGURIDAD
 *   Si un curso de prueba tuviera una matrícula de alguien que NO es de prueba, no se
 *   toca y se dice en voz alta. Preferible un resto que borrarle algo a un alumno.
 *
 * LAS TABLAS NO SE RECUERDAN, SE ENUMERAN: las filas que cuelgan de una cuenta se
 * buscan preguntando al catálogo qué tablas tienen `user_id`, no con una lista escrita
 * aquí, que es lo que envejece.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const CLAVE = env.SUPABASE_SERVICE_ROLE_KEY as string
const svc = createClient(URL_BASE, CLAVE, { auth: { persistSession: false } })

const BORRAR = process.argv.includes('--borrar')
const DOMINIO = '@nodo360-pruebas.invalid'

const linea = (t: string) => console.log('\n' + t + '\n' + '─'.repeat(t.length))
const tapa = (c?: string | null) => (c ?? '').replace(/^(.{6}).*@/, '$1…@')

console.log(BORRAR ? '\nMODO BORRAR\n' : '\nSOLO MIRANDO (añade --borrar para borrar de verdad)\n')

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Las cuentas de prueba
// ═══════════════════════════════════════════════════════════════════════════════
linea('1. Cuentas de prueba')
const { data: cuentas, error: ec } = await svc.from('users')
  .select('id, email, full_name, role, created_at')
  .ilike('email', `%${DOMINIO}`)
if (ec) throw new Error('no se pudieron leer las cuentas: ' + ec.message)
const idsDePrueba = new Set((cuentas ?? []).map((u) => u.id as string))
console.log(`  ${cuentas?.length ?? 0}`)
for (const u of cuentas ?? []) {
  console.log(`    ${u.id}  ${String(u.role).padEnd(11)} ${tapa(u.email)}  (${String(u.created_at).slice(0, 16)})`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Los cursos de prueba
// ═══════════════════════════════════════════════════════════════════════════════
linea('2. Cursos de prueba')
const { data: todos, error: ecur } = await svc.from('courses')
  .select('id, title, slug, status, instructor_id, created_at')
if (ecur) throw new Error('no se pudieron leer los cursos: ' + ecur.message)

const esDePrueba = (c: { title: string; slug: string; instructor_id: string | null }) =>
  /^qa-/.test(c.slug ?? '') || /^PRUEBA /.test(c.title ?? '') ||
  (c.instructor_id ? idsDePrueba.has(c.instructor_id) : false)

const cursos = (todos ?? []).filter((c) => esDePrueba(c as never))
console.log(`  ${cursos.length}`)

const cursosABorrar: string[] = []
for (const c of cursos) {
  const { data: matriculas } = await svc.from('course_enrollments')
    .select('user_id').eq('course_id', c.id)
  const ajenas = (matriculas ?? []).filter((m) => !idsDePrueba.has(m.user_id as string))
  const marca = ajenas.length > 0 ? '  ⚠️ NO SE TOCA' : ''
  console.log(`    ${c.id}  ${String(c.status).padEnd(16)} «${c.title}»${marca}`)
  console.log(`        slug=${c.slug}  matriculas=${matriculas?.length ?? 0} (ajenas: ${ajenas.length})`)
  if (ajenas.length > 0) {
    console.log('        tiene matriculas de cuentas que NO son de prueba: se deja y se avisa')
    continue
  }
  cursosABorrar.push(c.id as string)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Verificaciones de prueba
// ═══════════════════════════════════════════════════════════════════════════════
linea('3. Verificaciones de prueba')
const { data: certs } = await svc.from('instructor_certifications')
  .select('id, user_id, certification_number, status')
const certsDePrueba = (certs ?? []).filter(
  (v) => idsDePrueba.has(v.user_id as string) || /^qa-/i.test(String(v.certification_number ?? ''))
)
console.log(`  ${certsDePrueba.length}`)
for (const v of certsDePrueba) console.log(`    ${v.certification_number}  ${v.status}`)

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Qué tablas cuelgan de una cuenta: se le pregunta al catálogo
// ═══════════════════════════════════════════════════════════════════════════════
linea('4. Tablas con user_id (enumeradas, no recordadas)')
const spec = await (await fetch(`${URL_BASE}/rest/v1/?apikey=${CLAVE}`)).json()
const conUserId = Object.entries(spec.definitions ?? {})
  .filter(([, def]) => Boolean((def as { properties?: Record<string, unknown> }).properties?.user_id))
  .map(([t]) => t)
  .filter((t) => t !== 'users')
  .sort()
console.log(`  ${conUserId.length}: ${conUserId.join(', ')}`)

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Lo que hay colgando, y el borrado
// ═══════════════════════════════════════════════════════════════════════════════
linea('5. Filas colgando de las cuentas de prueba')
const porTabla: Record<string, number> = {}
for (const t of conUserId) {
  if (idsDePrueba.size === 0) break
  const { count, error } = await svc.from(t).select('user_id', { count: 'exact', head: true })
    .in('user_id', [...idsDePrueba])
  if (error) { console.log(`    ${t}: no se pudo contar (${error.code})`); continue }
  if (count) { porTabla[t] = count; console.log(`    ${t}: ${count}`) }
}
if (Object.keys(porTabla).length === 0) console.log('    ninguna')

if (!BORRAR) {
  const nada = idsDePrueba.size === 0 && cursos.length === 0 && certsDePrueba.length === 0
  console.log(nada ? '\nNO HAY RESTOS.' : '\nHay restos. Para borrarlos: npx tsx scripts/limpiar-restos-de-pruebas.mts --borrar')
  process.exit(0)
}

linea('6. Borrando')
let errores = 0
const quita = async (que: string, fn: () => Promise<{ error: { message: string } | null }>) => {
  const { error } = await fn()
  if (error) { errores++; console.log(`    FALLA ${que}: ${error.message}`) }
  else console.log(`    ok    ${que}`)
}

// El contenido de los cursos primero: las lecciones cuelgan de los modulos.
for (const id of cursosABorrar) {
  await quita(`lecciones del curso ${id.slice(0, 8)}`, () => svc.from('lessons').delete().eq('course_id', id))
  await quita(`modulos del curso ${id.slice(0, 8)}`, () => svc.from('modules').delete().eq('course_id', id))
}
// Lo que cuelga de las cuentas, en orden inverso al de creacion.
const PRIMERO = ['user_progress', 'quiz_attempts', 'certificates', 'course_enrollments', 'beta_feedback']
const orden = [...PRIMERO.filter((t) => conUserId.includes(t)), ...conUserId.filter((t) => !PRIMERO.includes(t))]
for (const t of orden) {
  if (!porTabla[t]) continue
  await quita(`${t}`, () => svc.from(t).delete().in('user_id', [...idsDePrueba]))
}
for (const id of cursosABorrar) {
  await quita(`curso ${id.slice(0, 8)}`, () => svc.from('courses').delete().eq('id', id))
}
for (const v of certsDePrueba) {
  await quita(`verificacion ${v.certification_number}`, () => svc.from('instructor_certifications').delete().eq('id', v.id as string))
}
for (const id of idsDePrueba) {
  await quita(`users ${id.slice(0, 8)}`, () => svc.from('users').delete().eq('id', id))
  const { error } = await svc.auth.admin.deleteUser(id)
  if (error) { errores++; console.log(`    FALLA auth ${id.slice(0, 8)}: ${error.message}`) }
  else console.log(`    ok    auth ${id.slice(0, 8)}`)
}

// ═══════════════════════════════════════════════════════════════════════════════
linea('7. Lo que queda')
const { count: quedanCuentas } = await svc.from('users')
  .select('id', { count: 'exact', head: true }).ilike('email', `%${DOMINIO}`)
const { data: quedanCursos } = await svc.from('courses').select('id, title, slug, instructor_id')
const sueltos = (quedanCursos ?? []).filter((c) => esDePrueba(c as never))
console.log(`  cuentas de prueba: ${quedanCuentas}`)
console.log(`  cursos de prueba:  ${sueltos.length}${sueltos.length ? ' -> ' + sueltos.map((c) => c.slug).join(', ') : ''}`)
console.log(`\n${errores === 0 && quedanCuentas === 0 ? 'TODO CORRECTO' : `errores: ${errores}`}`)
process.exit(errores === 0 ? 0 : 1)
