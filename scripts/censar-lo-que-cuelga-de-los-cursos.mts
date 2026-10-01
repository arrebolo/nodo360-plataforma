/**
 * Qué cuelga de courses, modules y lessons, y cuánto hay de cada cosa.
 *
 *   npx tsx scripts/censar-lo-que-cuelga-de-los-cursos.mts
 *
 * Es el censo que tiene que estar hecho ANTES de escribir la migración de la copia
 * publicada: cada tabla que apunta a una lección o a un módulo es una decisión
 * —repuntar, dejar como está, o mirar—, y el volumen decide si el relleno cabe en
 * una transacción.
 *
 * Se enumera el CATALOGO (el documento OpenAPI de PostgREST), no una lista de
 * nombres recordados: una tabla que no me suene es justo la que se queda fuera.
 *
 * Solo lectura. No escribe nada.
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

const doc = await fetch(`${URL_BASE}/rest/v1/`, {
  headers: { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, Accept: 'application/openapi+json' },
}).then((r) => r.json())

const definiciones: Record<string, { properties?: Record<string, { description?: string }> }> =
  doc.definitions ?? {}

// ── 1. Quién apunta a courses, modules y lessons ─────────────────────────────
const DESTINOS = ['courses', 'modules', 'lessons', 'course_quizzes', 'quiz_questions']
const apuntan: Record<string, { tabla: string; columna: string }[]> = {}
for (const d of DESTINOS) apuntan[d] = []

for (const [tabla, def] of Object.entries(definiciones)) {
  for (const [columna, prop] of Object.entries(def.properties ?? {})) {
    const m = /<fk table='([^']+)' column='([^']+)'\/>/.exec(prop.description ?? '')
    if (m && DESTINOS.includes(m[1])) apuntan[m[1]].push({ tabla, columna })
  }
}

console.log('=== QUIEN APUNTA A CADA TABLA DE CONTENIDO ===')
for (const d of DESTINOS) {
  const l = apuntan[d]
  console.log(`\n   ${d}  <-  ${l.length} columna(s)`)
  for (const { tabla, columna } of l) {
    const { count } = await svc.from(tabla).select('*', { count: 'exact', head: true })
    console.log(`      ${`${tabla}.${columna}`.padEnd(44)} ${count ?? '?'} filas en la tabla`)
  }
}

// ── 2. Volumen de lo que habría que copiar ───────────────────────────────────
console.log('\n=== VOLUMEN: LO QUE COPIARIA EL RELLENO ===')
const { data: cursos } = await svc.from('courses').select('id, slug, status, published_at')
const publicados = (cursos ?? []).filter((c) => c.status === 'published')
const conFecha = (cursos ?? []).filter((c) => c.published_at !== null)

console.log(`   cursos en total:                 ${(cursos ?? []).length}`)
console.log(`   con status = published:           ${publicados.length}`)
console.log(`   con published_at puesta:          ${conFecha.length}`)

// EL DATO QUE IMPORTA: publicados sin fecha. Son los que los triggers de la 114 y
// la 115 no protegen, porque preguntan por published_at.
const publicadosSinFecha = publicados.filter((c) => c.published_at === null)
console.log(`   *** publicados SIN published_at:  ${publicadosSinFecha.length}`)
for (const c of publicadosSinFecha) console.log(`        ${c.slug}`)

const idsPublicados = publicados.map((c) => c.id)
for (const [tabla, columna] of [['modules', 'course_id'], ['lessons', 'course_id'], ['course_quizzes', 'course_id']] as const) {
  const { count: total } = await svc.from(tabla).select('*', { count: 'exact', head: true })
  const { count: dePublicados } = await svc.from(tabla)
    .select('*', { count: 'exact', head: true }).in(columna, idsPublicados)
  console.log(`   ${tabla.padEnd(16)} ${String(dePublicados ?? 0).padStart(5)} de ${total ?? 0} son de cursos publicados`)
}

const { data: modsPublicados } = await svc.from('modules').select('id').in('course_id', idsPublicados)
const idsMods = (modsPublicados ?? []).map((m) => m.id)
const { count: preguntasTotal } = await svc.from('quiz_questions').select('*', { count: 'exact', head: true })
let preguntasDePublicados = 0
for (let i = 0; i < idsMods.length; i += 50) {
  const { count } = await svc.from('quiz_questions')
    .select('*', { count: 'exact', head: true }).in('module_id', idsMods.slice(i, i + 50))
  preguntasDePublicados += count ?? 0
}
console.log(`   quiz_questions   ${String(preguntasDePublicados).padStart(5)} de ${preguntasTotal ?? 0} son de cursos publicados`)

// ── 3. El progreso: cuánto hay en juego con la clave ajena ───────────────────
console.log('\n=== EL PROGRESO, QUE ES LO QUE SE PUEDE PERDER ===')
const { count: progreso } = await svc.from('user_progress').select('*', { count: 'exact', head: true })
const { count: completadas } = await svc.from('user_progress')
  .select('*', { count: 'exact', head: true }).eq('is_completed', true)
const { count: matriculas } = await svc.from('course_enrollments').select('*', { count: 'exact', head: true })
const { count: certificados } = await svc.from('certificates').select('*', { count: 'exact', head: true })
console.log(`   filas de user_progress:          ${progreso ?? 0}`)
console.log(`   de ellas, completadas:           ${completadas ?? 0}`)
console.log(`   matriculas:                      ${matriculas ?? 0}`)
console.log(`   certificados emitidos:           ${certificados ?? 0}`)

// ¿Cuántas lecciones tienen progreso? Son las que hoy un borrado se llevaría.
const { data: conProgreso } = await svc.from('user_progress').select('lesson_id')
const leccionesConProgreso = new Set((conProgreso ?? []).map((p) => p.lesson_id))
console.log(`   lecciones distintas con progreso: ${leccionesConProgreso.size}`)
console.log(`   (borrar una de ellas hoy se lleva su progreso, por ON DELETE CASCADE)`)

// ── 4. ¿Hay progreso apuntando a lecciones de cursos NO publicados? ──────────
const { data: todasLasLecciones } = await svc.from('lessons').select('id, course_id')
const cursoDeLaLeccion = new Map((todasLasLecciones ?? []).map((l) => [l.id, l.course_id]))
const setPublicados = new Set(idsPublicados)
let progresoEnNoPublicados = 0
let progresoHuerfano = 0
for (const id of leccionesConProgreso) {
  const curso = cursoDeLaLeccion.get(id)
  if (curso === undefined) progresoHuerfano++
  else if (!setPublicados.has(curso)) progresoEnNoPublicados++
}
console.log(`\n   lecciones con progreso que NO son de un curso publicado: ${progresoEnNoPublicados}`)
console.log(`   lecciones con progreso que ya no existen:                ${progresoHuerfano}`)
console.log('   (el segundo numero tiene que ser 0: la clave ajena no deja huerfanos)')
