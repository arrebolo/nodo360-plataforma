/**
 * EL GUARDIAN: ninguna superficie pública lee las tablas de trabajo.
 *
 *   npx tsx scripts/comprobar-lecturas-publicas.mts            # corta si hay hallazgos
 *   npx tsx scripts/comprobar-lecturas-publicas.mts --informe  # solo los enumera
 *
 * POR QUE EXISTE
 *   Lo que leen los alumnos tiene que salir de la copia publicada (`*_publicados`), no
 *   de las tablas donde el instructor escribe. Si no, cualquier cambio suyo —guardado a
 *   medias, una lección borrada, un título a medio escribir— sale al aire en el
 *   siguiente render. Eso es lo que la copia publicada viene a arreglar, y este script
 *   es lo que impide que vuelva a colarse después.
 *
 * CORTA, NO INFORMA: `process.exit(1)` en cuanto hay un hallazgo sin declarar. Un
 * guardián que solo avisa no ha servido ninguna de las veces que ha hecho falta.
 *
 * DOS MITADES, porque una sola no basta:
 *
 *   1. PROHIBIR EL NOMBRE, EN LAS TRES SINTAXIS. `from('lessons')` es la fácil. Las
 *      que importan son los embeds:
 *
 *        a) por el nombre de la tabla:   `modules(lessons(...))`
 *        b) por el nombre de la CLAVE:   `course:course_id!inner (*)`
 *
 *      La (b) la encontró este guardián en `lib/db/learning-paths.ts` mientras lo
 *      escribía, y es la peor de las tres: ahí la palabra `courses` NO APARECE —se
 *      embebe por `course_id`, que es la columna—, así que ningún grep del nombre de la
 *      tabla la ve. El inventario del diseño daba ese fichero por «lee por el helper»,
 *      y lo que hace es llegar a `courses` sin nombrarla. Mismo punto ciego que la
 *      lista de nueve columnas de la 030.
 *
 *   2. DESCUBRIR LA LISTA, NO RECORDARLA. Las superficies se enumeran del árbol de
 *      ficheros; si aparece un fichero público nuevo que lee contenido de cursos y no
 *      está en el inventario revisado, también corta. Una lista escrita a mano envejece
 *      en silencio; un censo del catálogo, no.
 *
 * LAS EXCEPCIONES SON TEMPORALES Y NUMERADAS. Hoy TODAS las lecturas públicas van a las
 * tablas de trabajo: cambiarlas es la PR 3. Hasta entonces están declaradas una por una
 * aquí abajo, y el guardián corta también si una excepción deja de hacer falta —así la
 * PR 3 no puede olvidarse de quitarlas, porque el CI se lo dirá—.
 */
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..'
)
const SOLO_INFORME = process.argv.includes('--informe')

/** Las tablas donde escribe el instructor. Lo público no las toca. */
const TABLAS_DE_TRABAJO = ['courses', 'modules', 'lessons', 'quiz_questions'] as const

/**
 * Superficies públicas, DESCUBIERTAS del árbol: todo lo que cuelgue de aquí se mira.
 * Añadir una página pública nueva no requiere tocar esta lista.
 */
const ZONAS_PUBLICAS = [
  'app/cursos',
  'app/rutas',
  'app/(public)',
  'app/sitemap.ts',
  'app/llms.txt',
  'app/r',
  'app/verificar',
  'app/certificados',
  'components/home',
  'components/course',
  'components/cursos',
]

/**
 * Y los ayudantes que usan esas páginas.
 *
 * Esta lista SI es declarada, y no descubierta, porque `lib/` no está separado por
 * público y administración: el mismo fichero sirve a las dos cosas. Es la parte frágil
 * del guardián y conviene saberlo; la PR 3 separa lo que haga falta separar.
 */
const AYUDANTES_DE_ALUMNO = [
  'lib/db/courses-queries.ts',
  'lib/db/queries.ts',
  'lib/db/learning-paths.ts',
  'lib/cache/queries.ts',
  'lib/progress/getCourseProgress.ts',
  'lib/progress/getPathProgress.ts',
  'lib/quiz/checkCourseQuiz.ts',
  'lib/certificates/createCertificate.ts',
]

type Excepcion = {
  numero: number
  fichero: string
  tablas: string[]
  porque: string
}

/**
 * LO QUE TODAVIA LEE DE TRABAJO, a 2 de octubre de 2026. Cada línea se va con la PR 3.
 *
 * ESTA LISTA SALE DE EJECUTAR EL GUARDIAN, no del documento de diseño. La escribí
 * primero a partir del inventario del diseño y no cuadraba: sobraban cuatro entradas
 * —ficheros que leen por su ayudante y no directamente— y faltaban tres lecturas que el
 * inventario no recogía. Un inventario escrito a mano envejece; el que vale es el que
 * se mide.
 */
const EXCEPCIONES: Excepcion[] = [
  { numero: 1, fichero: 'app/cursos/[slug]/page.tsx', tablas: ['courses', 'modules', 'lessons'], porque: 'ficha del curso: PR 3' },
  { numero: 2, fichero: 'app/cursos/[slug]/[lessonSlug]/page.tsx', tablas: ['courses', 'modules', 'lessons'], porque: 'leccion: PR 3' },
  { numero: 3, fichero: 'app/cursos/[slug]/quiz-final/page.tsx', tablas: ['courses', 'modules', 'quiz_questions'], porque: 'examen final: PR 3 (punto 4 del diseno)' },
  { numero: 4, fichero: 'app/cursos/[slug]/opengraph-image.tsx', tablas: ['courses'], porque: 'imagen OG del curso: PR 3' },
  { numero: 5, fichero: 'app/cursos/[slug]/[lessonSlug]/opengraph-image.tsx', tablas: ['courses', 'lessons'], porque: 'imagen OG de la leccion: PR 3' },
  { numero: 6, fichero: 'app/rutas/page.tsx', tablas: ['courses', 'modules', 'lessons'], porque: 'rutas: embed desde learning_path_courses, PR 3' },
  { numero: 7, fichero: 'app/sitemap.ts', tablas: ['courses', 'modules', 'lessons'], porque: 'sitemap: PR 3' },
  { numero: 8, fichero: 'app/llms.txt/route.ts', tablas: ['courses'], porque: 'llms.txt: PR 3' },
  { numero: 9, fichero: 'app/r/[code]/route.ts', tablas: ['courses'], porque: 'enlaces de referido: PR 3' },
  { numero: 10, fichero: 'app/(public)/instructores/[id]/page.tsx', tablas: ['courses'], porque: 'ficha publica del instructor: PR 3' },
  { numero: 11, fichero: 'app/certificados/[certificateId]/page.tsx', tablas: ['courses', 'modules'], porque: 'titulo del curso y del modulo del certificado: hoy no puede leer el espejo, que esta cerrado; PR 3' },
  { numero: 12, fichero: 'components/home/HomeFeaturedCourses.tsx', tablas: ['courses'], porque: 'portada: PR 3' },
  { numero: 13, fichero: 'lib/db/courses-queries.ts', tablas: ['courses', 'modules', 'lessons'], porque: 'ayudantes del catalogo y la ficha: PR 3' },
  { numero: 14, fichero: 'lib/db/queries.ts', tablas: ['courses', 'modules', 'lessons'], porque: 'ayudantes antiguos: PR 3' },
  { numero: 15, fichero: 'lib/db/learning-paths.ts', tablas: ['courses'], porque: 'embed por la clave ajena (course:course_id!inner): PR 3' },
  { numero: 16, fichero: 'lib/cache/queries.ts', tablas: ['courses', 'modules', 'lessons'], porque: 'cache del catalogo: PR 3' },
  { numero: 17, fichero: 'lib/progress/getCourseProgress.ts', tablas: ['modules', 'lessons'], porque: 'el denominador del progreso es lo publicado: PR 3 (punto 2)' },
  { numero: 18, fichero: 'lib/progress/getPathProgress.ts', tablas: ['courses', 'modules', 'lessons'], porque: 'progreso de una ruta: PR 3' },
  { numero: 19, fichero: 'lib/quiz/checkCourseQuiz.ts', tablas: ['modules', 'quiz_questions'], porque: 'correccion del examen: PR 3 (punto 4)' },
  { numero: 20, fichero: 'lib/certificates/createCertificate.ts', tablas: ['courses'], porque: 'titulo del certificado: PR 3' },
]

// ─────────────────────────────────────────────────────────────────────────────
const EXT = ['.ts', '.tsx']

function recorrer(p: string, acc: string[] = []): string[] {
  const abs = path.join(RAIZ, p)
  if (!fs.existsSync(abs)) return acc
  if (fs.statSync(abs).isFile()) {
    if (EXT.includes(path.extname(abs))) acc.push(p)
    return acc
  }
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const hijo = `${p}/${e.name}`
    if (e.isDirectory()) recorrer(hijo, acc)
    else if (EXT.includes(path.extname(e.name))) acc.push(hijo)
  }
  return acc
}

type Hallazgo = {
  fichero: string
  tabla: string
  /** `clave` es el embed por el nombre de la columna: `course:course_id!inner(*)`. */
  como: 'from' | 'embed' | 'clave'
  linea: number
}

/** La columna de la clave ajena, y la tabla de trabajo a la que llega. */
const CLAVES_A_TABLA: Record<string, string> = {
  course_id: 'courses',
  module_id: 'modules',
  lesson_id: 'lessons',
}

/** Los `.select(...)` de un fichero, con su posición. */
function selects(texto: string): { contenido: string; desde: number }[] {
  const fuera: { contenido: string; desde: number }[] = []
  for (const m of texto.matchAll(/\.select\(\s*([`'"])([\s\S]*?)\1/g)) {
    fuera.push({ contenido: m[2], desde: m.index! })
  }
  return fuera
}

function hallazgosDe(fichero: string): Hallazgo[] {
  const texto = fs.readFileSync(path.join(RAIZ, fichero), 'utf8')
  const linea = (i: number) => texto.slice(0, i).split('\n').length
  const fuera: Hallazgo[] = []

  for (const tabla of TABLAS_DE_TRABAJO) {
    // 1) from('tabla')
    for (const m of texto.matchAll(new RegExp(`from\\(\\s*['"\`]${tabla}['"\`]`, 'g'))) {
      fuera.push({ fichero, tabla, como: 'from', linea: linea(m.index!) })
    }
    // 2) el embed por el nombre de la tabla: `tabla (`, con o sin alias y con o sin !hint
    for (const sel of selects(texto)) {
      for (const m of sel.contenido.matchAll(new RegExp(`(?:^|[\\s,:(!])${tabla}\\s*(?:!\\w+)?\\s*\\(`, 'g'))) {
        fuera.push({ fichero, tabla, como: 'embed', linea: linea(sel.desde + m.index!) })
      }
    }
  }

  // 3) el embed por el nombre de la CLAVE AJENA: `course:course_id!inner (*)`.
  //    Aquí la tabla no se nombra, así que buscarla por su nombre no sirve. Se exige el
  //    paréntesis detrás para no confundirlo con la columna a secas en un select.
  for (const [clave, tabla] of Object.entries(CLAVES_A_TABLA)) {
    for (const sel of selects(texto)) {
      for (const m of sel.contenido.matchAll(new RegExp(`(?:^|[\\s,:(!])${clave}\\s*(?:!\\w+)?\\s*\\(`, 'g'))) {
        fuera.push({ fichero, tabla, como: 'clave', linea: linea(sel.desde + m.index!) })
      }
    }
  }

  return fuera
}

const ficheros = [
  ...new Set([...ZONAS_PUBLICAS.flatMap((z) => recorrer(z)), ...AYUDANTES_DE_ALUMNO]),
].filter((f) => fs.existsSync(path.join(RAIZ, f)))

const hallazgos = ficheros.flatMap(hallazgosDe)

const porFichero = new Map<string, Set<string>>()
for (const h of hallazgos) {
  if (!porFichero.has(h.fichero)) porFichero.set(h.fichero, new Set())
  porFichero.get(h.fichero)!.add(h.tabla)
}

const declaradas = new Map(EXCEPCIONES.map((e) => [e.fichero, e]))

// ── 1. Hallazgos sin declarar ────────────────────────────────────────────────
const sinDeclarar: Hallazgo[] = []
for (const h of hallazgos) {
  const e = declaradas.get(h.fichero)
  if (!e || !e.tablas.includes(h.tabla)) sinDeclarar.push(h)
}

// ── 2. Excepciones que ya no hacen falta ─────────────────────────────────────
const sobrantes: { excepcion: Excepcion; tablas: string[] }[] = []
for (const e of EXCEPCIONES) {
  const encontradas = porFichero.get(e.fichero) ?? new Set<string>()
  const yaNo = e.tablas.filter((t) => !encontradas.has(t))
  if (yaNo.length) sobrantes.push({ excepcion: e, tablas: yaNo })
}

console.log(`\nficheros públicos mirados: ${ficheros.length}`)
console.log(`lecturas de tablas de trabajo encontradas: ${hallazgos.length}`)
console.log(`declaradas como excepción temporal: ${EXCEPCIONES.length} ficheros`)

if (SOLO_INFORME) {
  console.log('\n=== todas las lecturas, por fichero ===')
  for (const [f, tablas] of [...porFichero.entries()].sort()) {
    const e = declaradas.get(f)
    console.log(`   ${e ? `#${String(e.numero).padStart(2)}` : ' SIN'}  ${f}  ->  ${[...tablas].sort().join(', ')}`)
  }
}

if (sinDeclarar.length > 0) {
  console.log(`\n=== LECTURAS PUBLICAS SIN DECLARAR: ${sinDeclarar.length} ===`)
  for (const h of sinDeclarar.slice(0, 30)) {
    const comoLoHace =
      h.como === 'embed' ? 'por embed' : h.como === 'clave' ? 'por embed de la clave ajena' : 'directamente'
    console.log(`   ${h.fichero}:${h.linea}  lee «${h.tabla}» ${comoLoHace}`)
  }
  console.log(
    '\nLo que leen los alumnos sale de la copia publicada (*_publicados). Si esta\n' +
    'lectura tiene que existir por ahora, declárala en EXCEPCIONES de este script\n' +
    'con su motivo; si no, cámbiala al espejo.'
  )
}

if (sobrantes.length > 0) {
  console.log(`\n=== EXCEPCIONES QUE YA NO HACEN FALTA: ${sobrantes.length} ===`)
  for (const s of sobrantes) {
    console.log(`   #${s.excepcion.numero} ${s.excepcion.fichero} ya no lee: ${s.tablas.join(', ')}`)
  }
  console.log('\nQuítalas de EXCEPCIONES: una excepción que sobra es una puerta abierta.')
}

const mal = sinDeclarar.length + sobrantes.length
console.log(
  `\nsin_declarar ${sinDeclarar.length}, excepciones_sobrantes ${sobrantes.length}  ` +
  (mal === 0 ? 'TODO CORRECTO' : 'REVISAR') + '\n'
)

// LO QUE ESTE GUARDIAN NO VE, para que nadie lo dé por cubierto:
//
//   - una función de la base (`rpc`) que lea por dentro las tablas de trabajo;
//   - una vista sobre ellas (el nombre de la vista no delata la tabla);
//   - una lectura escrita en un fichero que no esté en las zonas de arriba.
//
// Las dos primeras se tapan en la PR 3 quitándole a `anon` el SELECT sobre las tablas
// de trabajo: entonces lo que no esté en el espejo no se puede leer, lo diga el código
// como lo diga. Esto es lo que impide que vuelva a entrar por el camino conocido.

if (!SOLO_INFORME && mal > 0) process.exit(1)
