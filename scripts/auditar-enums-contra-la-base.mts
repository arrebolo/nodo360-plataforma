/**
 * ¿Declara TypeScript valores de enum que la base no tiene?
 *
 *   npx tsx scripts/auditar-enums-contra-la-base.mts
 *
 * Un valor declarado en un union de TypeScript que no existe en el enum de Postgres
 * no falla al compilar: falla EN EJECUCION con «22P02 invalid input value for enum»,
 * y si quien escribe se come el error, la operación se pierde en silencio. Paso con
 * `course_changes_requested` y `lesson_comment_new`: las notificaciones de «el mentor
 * pide cambios» y «alguien comentó tu lección» no llegaban nunca.
 *
 * CÓMO SE LEEN LOS ENUMS DE VERDAD. PostgREST publica las etiquetas de cada enum en
 * su documento OpenAPI, y ahí no hay que adivinar nada:
 *
 *   GET /rest/v1/  con la clave de servicio y Accept: application/openapi+json
 *
 * (Con la clave anónima y sin ese Accept, el documento llega sin `definitions`. Me
 * costó un intento.)
 *
 * Solo lee. No escribe nada en ninguna parte.
 */
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const CLAVE = env.SUPABASE_SERVICE_ROLE_KEY

// ── 1. Los enums que la base tiene de verdad ────────────────────────────────
const doc = await (
  await fetch(`${URL_}/rest/v1/`, {
    headers: {
      apikey: CLAVE,
      Authorization: `Bearer ${CLAVE}`,
      Accept: 'application/openapi+json',
    },
  })
).json()

/** conjunto de etiquetas -> dónde aparece */
const enumsDeLaBase = new Map<string, string[]>()
for (const [tabla, def] of Object.entries(doc.definitions ?? {})) {
  for (const [col, prop] of Object.entries((def as { properties?: Record<string, { enum?: string[] }> }).properties ?? {})) {
    if (prop.enum && prop.enum.length > 0) {
      const clave = [...prop.enum].sort().join('|')
      enumsDeLaBase.set(clave, [...(enumsDeLaBase.get(clave) ?? []), `${tabla}.${col}`])
    }
  }
}

console.log(`=== ENUMS EN LA BASE (${enumsDeLaBase.size} distintos, en 19 columnas) ===`)
for (const [clave, donde] of enumsDeLaBase) {
  const valores = clave.split('|')
  console.log(`   ${valores.length} valores  ${donde[0]}${donde.length > 1 ? ` (+${donde.length - 1} más)` : ''}`)
  console.log(`      ${valores.join(', ')}`)
}

// ── 2. Los unions declarados en TypeScript ──────────────────────────────────
const FICHEROS = ['types/database.ts', 'lib/supabase/types.ts']
type Declarado = { fichero: string; nombre: string; valores: string[] }
const declarados: Declarado[] = []

for (const f of FICHEROS) {
  if (!fs.existsSync(f)) continue
  const texto = fs.readFileSync(f, 'utf8')

  // CUALQUIER union de literales, no solo los `export type`.
  //
  // La primera version de este script solo cazaba «export type X = 'a' | 'b';» y
  // encontro UN union en todo el proyecto. Los enums de la base se describen casi
  // siempre como propiedad de una interfaz —«status: 'draft' | 'published'»— o como
  // tipo sin exportar, asi que auditar solo los exportados no es auditar.
  //
  // Dos formas:
  //   type X = 'a' | 'b'        (con o sin export)
  //   nombre: 'a' | 'b'         (propiedad de interfaz o de un tipo inline)
  const reTipo = /(?:export\s+)?type\s+(\w+)\s*=\s*((?:\s*\|?\s*'[^']+')+)\s*(?:;|$)/gm
  const rePropiedad = /^\s*(\w+)\??\s*:\s*((?:\s*\|?\s*'[^']+'\s*)+)(?:\||;|$)/gm

  for (const re of [reTipo, rePropiedad]) {
    let m: RegExpExecArray | null
    while ((m = re.exec(texto)) !== null) {
      const valores = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])
      if (valores.length >= 2) declarados.push({ fichero: f, nombre: m[1], valores })
    }
  }
}

console.log(`\n=== UNIONS DECLARADOS EN TYPESCRIPT (${declarados.length}) ===`)
console.log(
  '   Los emparejamientos son HEURÍSTICOS: se elige el enum de la base con más\n' +
  '   valores en común. Un union que no describa ninguna columna enum puede\n' +
  '   emparejarse por casualidad — a CourseCategory le pasó con projects.category\n' +
  '   por compartir «bitcoin» y «defi», y resultó que topic_category es text y ese\n' +
  '   tipo no se usa en ningún sitio. Antes de tocar nada, comprobar que la columna\n' +
  '   es de verdad un enum y que ese union la describe.\n'
)

let sospechosos = 0
for (const d of declarados) {
  // Se busca el enum de la base con el que más solapa: es el que pretende describir.
  let mejor: { donde: string; valores: string[]; comunes: number } | null = null
  for (const [clave, donde] of enumsDeLaBase) {
    const valores = clave.split('|')
    const comunes = d.valores.filter((v) => valores.includes(v)).length
    // 2 o mas valores en comun: por debajo de eso es casualidad, no descripcion.
    if (comunes >= 2 && (!mejor || comunes > mejor.comunes)) {
      mejor = { donde: donde[0], valores, comunes }
    }
  }

  if (!mejor) continue   // no describe ningun enum de la base

  const faltan = d.valores.filter((v) => !mejor!.valores.includes(v))
  const sobran = mejor.valores.filter((v) => !d.valores.includes(v))

  if (faltan.length === 0 && sobran.length === 0) {
    console.log(`   ${d.nombre.padEnd(26)} coincide con ${mejor.donde}`)
  } else {
    sospechosos += faltan.length
    console.log(`   ${d.nombre.padEnd(26)} frente a ${mejor.donde}`)
    if (faltan.length) console.log(`      *** TS declara y la base NO tiene: ${faltan.join(', ')}`)
    if (sobran.length) console.log(`      (la base tiene y TS no declara: ${sobran.join(', ')})`)
  }
}

console.log(
  `\n${sospechosos === 0
    ? 'TODO CORRECTO: ningún valor declarado en TypeScript falta en la base.'
    : `REVISAR: ${sospechosos} valor(es) declarados en TypeScript que la base no tiene. Usarlos devuelve 22P02 en ejecución.`}`
)
