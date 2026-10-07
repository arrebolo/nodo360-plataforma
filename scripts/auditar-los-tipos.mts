/**
 * ¿Dice `lib/supabase/types.ts` lo que la base tiene hoy?
 *
 * POR QUE HACE FALTA UN GUARDIAN Y NO BASTA REGENERAR
 *   Ese fichero se genera con `supabase gen types`, y entre regeneración y
 *   regeneración **miente en silencio**: afirma columnas que ya no existen y
 *   calla las que se han añadido. Y no lo caza `tsc`, porque un tipo que
 *   sobra solo rompe cuando alguien lo usa. La 123 dejó `perfiles_publicos.role`
 *   en el fichero después de quitarla de la vista, la 122 añadió
 *   `users.anunciar_logros` y la 121 `courses.firmado_por_la_plataforma`: tres
 *   desfases que nadie habría visto hasta tropezarse con ellos.
 *
 * COMO LO MIDE
 *   PostgREST publica su esquema en OpenAPI, y ahí están las tablas, las
 *   vistas, sus columnas y las funciones expuestas. Se compara con lo que el
 *   fichero afirma. No hace falta ni CLI de Supabase ni token de acceso ni la
 *   contraseña de la base: solo la clave de servicio, que ya está en .env.local.
 *
 * QUE PUEDE Y QUE NO PUEDE DECIR
 *   SI  columnas que sobran o faltan, en tablas y vistas; relaciones y
 *       funciones que el fichero no conoce.
 *   NO  los TIPOS de cada columna, solo los nombres. El OpenAPI los da en su
 *       propio vocabulario y traducirlos sería inventar precisión que no hay.
 *   NO  nada que la clave de servicio no alcance, ni las funciones que
 *       PostgREST no expone.
 *
 * LO PENDIENTE, DECLARADO
 *   Hay relaciones y funciones que el fichero no tiene y que NO se arreglan a
 *   mano: son cuatro tablas de ~30 columnas y ocho firmas de función, y
 *   escribirlas a mano es inventarse tipos. Eso pide una regeneración de
 *   verdad, con `supabase gen types`, que necesita la CLI y un token de
 *   acceso. Están declaradas abajo una por una: mientras sigan igual, esto
 *   pasa en verde y lo dice; si aparece UNA MAS, se pone en rojo.
 *
 *   npx tsx scripts/auditar-los-tipos.mts
 */
import fs from 'node:fs'

const FICHERO = 'lib/supabase/types.ts'

/**
 * Lo que el fichero no tiene y se arregla regenerándolo, no a mano.
 * Cada una con el motivo de por qué está aquí y no arreglada.
 */
const PENDIENTES_DECLARADAS = {
  relaciones: [
    ['courses_publicados', 'la copia publicada de la 117; ~30 columnas'],
    ['modules_publicados', 'idem'],
    ['lessons_publicadas', 'idem'],
    ['quiz_questions_publicadas', 'idem'],
  ],
  funciones: [
    ['publicar_curso', 'la 117; se llama desde las migraciones, no desde el cliente tipado'],
    ['publicar_curso_interno', 'la 117; interna'],
    ['retirar_curso_de_la_copia', 'la 119'],
    ['retirar_curso_de_la_copia_interno', 'la 119; interna'],
    ['columnas_a_copiar', 'la 117; interna'],
    ['es_funcion_publica', 'la 123; la usan la politica y la vista, no el cliente'],
    ['estoy_suspendido', 'SE LLAMA desde lib/auth/suspension.ts con un cliente sin tipar'],
    ['motivo_de_mi_suspension', 'SE LLAMA desde lib/auth/suspension.ts con un cliente sin tipar'],
  ],
} as const

const env: Record<string, string> = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

console.log(`\n=== ${FICHERO} contra el esquema de hoy ===\n`)

const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
})
if (!r.ok) {
  console.log(`   *** El OpenAPI no responde: ${r.status}. Parar: sin esquema no se mide nada.`)
  process.exit(2)
}
const spec = (await r.json()) as {
  definitions?: Record<string, { properties?: Record<string, unknown> }>
  paths?: Record<string, unknown>
}

const enLaBase = new Map<string, Set<string>>()
for (const [nombre, def] of Object.entries(spec.definitions ?? {})) {
  enLaBase.set(nombre, new Set(Object.keys(def.properties ?? {})))
}
const funcionesEnLaBase = new Set(
  Object.keys(spec.paths ?? {}).filter((p) => p.startsWith('/rpc/')).map((p) => p.slice(5)),
)

if (enLaBase.size === 0) {
  console.log('   *** El OpenAPI no trae ninguna relación. Parar: algo va mal en la lectura.')
  process.exit(2)
}

// ── El fichero, por la estructura que genera Supabase ──────────────────────
const lineas = fs.readFileSync(FICHERO, 'utf8').split(/\r?\n/)
const enElFichero = new Map<string, Set<string>>()
const funcionesEnElFichero = new Set<string>()
let zona: 'tabla' | 'vista' | 'funcion' | null = null
let relacion: string | null = null
let enRow = false

for (const linea of lineas) {
  if (/^    Tables: \{/.test(linea)) { zona = 'tabla'; continue }
  if (/^    Views: \{/.test(linea)) { zona = 'vista'; continue }
  if (/^    Functions: \{/.test(linea)) { zona = 'funcion'; continue }
  if (/^    (Enums|CompositeTypes): \{/.test(linea)) { zona = null; continue }

  if (zona === 'funcion') {
    const f = linea.match(/^      ([a-z_][\w]*): \{/)
    if (f) funcionesEnElFichero.add(f[1])
    continue
  }
  if (zona !== 'tabla' && zona !== 'vista') continue

  const rel = linea.match(/^      ([a-z_][\w]*): \{/)
  if (rel) { relacion = rel[1]; enElFichero.set(relacion, new Set()); enRow = false; continue }
  if (/^        Row: \{/.test(linea)) { enRow = true; continue }
  if (/^        \}/.test(linea)) { enRow = false; continue }
  if (enRow && relacion) {
    const col = linea.match(/^          ([a-z_][\w]*)\??: /)
    if (col) enElFichero.get(relacion)!.add(col[1])
  }
}

// PRECONDICION: si el fichero cambiara de forma, el análisis leería cero y todo
// pasaría en verde sin medir nada.
if (enElFichero.size < 50 || funcionesEnElFichero.size < 50) {
  console.log(`   *** Solo he sabido leer ${enElFichero.size} relaciones y ${funcionesEnElFichero.size} funciones`)
  console.log('       del fichero. El generador habrá cambiado de forma: este guardián')
  console.log('       no sirve hasta arreglar el análisis. Parar, no dar verde.')
  process.exit(2)
}

// ── La comparación ────────────────────────────────────────────────────────
const relPendientes = new Map(PENDIENTES_DECLARADAS.relaciones)
const funPendientes = new Map(PENDIENTES_DECLARADAS.funciones)
const hallazgos: string[] = []

console.log('--- columnas ---')
let conDesfase = 0
for (const [rel, cols] of enLaBase) {
  if (!enElFichero.has(rel)) continue   // las relaciones, más abajo
  const enF = enElFichero.get(rel)!
  const faltan = [...cols].filter((c) => !enF.has(c))
  const sobran = [...enF].filter((c) => !cols.has(c))
  if (!faltan.length && !sobran.length) continue
  conDesfase++
  if (faltan.length) hallazgos.push(`${rel}: la base tiene ${faltan.join(', ')} y el fichero no`)
  if (sobran.length) hallazgos.push(`${rel}: el fichero afirma ${sobran.join(', ')} y la base no`)
}
console.log(conDesfase === 0
  ? `   OK   las ${enElFichero.size} relaciones del fichero tienen las columnas que dicen`
  : `   FALLA ${conDesfase} relación(es) con columnas desfasadas`)

console.log('\n--- relaciones y funciones que el fichero no conoce ---')
for (const rel of enLaBase.keys()) {
  if (enElFichero.has(rel)) continue
  const motivo = relPendientes.get(rel)
  if (motivo) { console.log(`   pdte ${rel.padEnd(28)} ${motivo}`); relPendientes.delete(rel) }
  else hallazgos.push(`la base tiene la relación ${rel} y el fichero no la conoce, y no está declarada`)
}
for (const fn of funcionesEnLaBase) {
  if (funcionesEnElFichero.has(fn)) continue
  const motivo = funPendientes.get(fn)
  if (motivo) { console.log(`   pdte ${fn.padEnd(28)} ${motivo}`); funPendientes.delete(fn) }
  else hallazgos.push(`la base expone ${fn}() y el fichero no la conoce, y no está declarada`)
}

// Y al revés: una pendiente que ya está arreglada se saca de la lista, para que
// la lista no se convierta en una excusa permanente.
for (const [rel] of relPendientes) hallazgos.push(`${rel} está declarada pendiente y ya no falta: quítala de la lista`)
for (const [fn] of funPendientes) hallazgos.push(`${fn}() está declarada pendiente y ya no falta: quítala de la lista`)

console.log('\n--- lo que el fichero afirma y la base no tiene ---')
const fantasmas = [...enElFichero.keys()].filter((r) => !enLaBase.has(r))
console.log(fantasmas.length === 0
  ? '   OK   ninguna relación inventada'
  : `   FALLA el fichero afirma ${fantasmas.join(', ')}`)
for (const f of fantasmas) hallazgos.push(`el fichero afirma la relación ${f} y la base no la tiene`)

console.log()
if (hallazgos.length === 0) {
  console.log('TODO CORRECTO: el fichero de tipos no afirma nada que la base no tenga,')
  console.log('y lo que le falta está declarado arriba. Eso pide `supabase gen types`,')
  console.log('que necesita la CLI y un token de acceso: no se arregla a mano.')
  process.exit(0)
}
console.log(`REVISAR: ${hallazgos.length} hallazgo(s).`)
for (const h of hallazgos) console.log(`  · ${h}`)
process.exit(1)
