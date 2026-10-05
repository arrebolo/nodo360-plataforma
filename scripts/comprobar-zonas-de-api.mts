/**
 * Ninguna pantalla de instructor llama a `/api/admin`.
 *
 *   npx tsx scripts/comprobar-zonas-de-api.mts
 *
 * POR QUE ESTO NO ES UN `grep`
 *   Después de los endpoints de instructor (#307), un `grep /api/admin` sobre
 *   `app/(private)/dashboard/instructor` daba **cero**. Y la regla estaba incumplida:
 *   `/dashboard/instructor/cursos/nuevo` llamaba a `/api/admin/learning-paths`, tres
 *   niveles más abajo —la página usa `CourseFormCore`, que usa `LearningPathDropdown`,
 *   que tenía la URL escrita dentro—.
 *
 *   Un grep mira ficheros; la regla habla de PANTALLAS. Así que esto parte de las
 *   páginas de la zona y sigue cada import, igual que el guardián de las lecturas
 *   públicas pero en busca de otra cosa.
 *
 * QUE CUENTA COMO INCUMPLIMIENTO
 *   Un `/api/admin` escrito DENTRO de un `fetch(...)`, que es lo que no se puede
 *   cambiar desde fuera. Un valor por omisión como `api = '/api/admin'` NO cuenta: es
 *   el convenio de `DeleteModuleButton` y compañía, donde la zona del instructor pasa
 *   `/api/instructor` y el panel se queda con el suyo. Lo que importa no es que la
 *   cadena aparezca, es que no haya forma de evitarla.
 *
 * LO QUE NO VE, dicho para que nadie lo dé por cubierto: una URL construida en dos
 * pasos (`const u = '/api/admin/x'; fetch(u)`) se le escapa. Si algún día hace falta,
 * el arreglo es mirar el valor de las constantes, no quitar el guardián.
 */
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = process.cwd()
const EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs']

/** Las zonas cuyas pantallas no deben llamar a /api/admin. */
const ZONAS = [
  'app/(private)/dashboard/instructor',
  'app/(private)/dashboard/mentor',
]

/**
 * Excepciones, con su motivo. Vacío a propósito: si hace falta añadir una, que cueste
 * escribir por qué.
 */
const EXCEPCIONES: { fichero: string; porque: string }[] = []

function recorrer(dir: string): string[] {
  const abs = path.join(RAIZ, dir)
  if (!fs.existsSync(abs)) return []
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`
    if (e.isDirectory()) return recorrer(rel)
    return EXT.some((x) => e.name.endsWith(x)) ? [rel] : []
  })
}

/** Resuelve un especificador a un fichero del proyecto, o null si es externo. */
function resolver(desde: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(RAIZ, spec.slice(2))
  else if (spec.startsWith('./') || spec.startsWith('../')) {
    base = path.resolve(path.dirname(path.join(RAIZ, desde)), spec)
  } else return null

  for (const e of ['', ...EXT]) {
    const abs = base + e
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      return path.relative(RAIZ, abs).split(path.sep).join('/')
    }
  }
  for (const e of EXT) {
    const abs = path.join(base, 'index' + e)
    if (fs.existsSync(abs)) return path.relative(RAIZ, abs).split(path.sep).join('/')
  }
  return null
}

const RE_IMPORT = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g

/** Todo lo que se alcanza desde estas raíces siguiendo imports. */
function alcanzableDesde(raices: string[]): string[] {
  const vistos = new Set<string>()
  const pila = [...raices]
  while (pila.length) {
    const f = pila.pop()!
    if (vistos.has(f)) continue
    const abs = path.join(RAIZ, f)
    if (!fs.existsSync(abs)) continue
    vistos.add(f)
    for (const m of fs.readFileSync(abs, 'utf8').matchAll(RE_IMPORT)) {
      const hijo = resolver(f, m[1])
      if (hijo && !vistos.has(hijo)) pila.push(hijo)
    }
  }
  return [...vistos]
}

/** Fuera los comentarios: ahí la cadena aparece explicando el convenio. */
function sinComentarios(texto: string): string {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
    .replace(/(?<!:)\/\/[^\n]*/g, '')
}

// Un /api/admin dentro de un fetch(), con comillas de cualquier tipo.
const RE_FETCH_ADMIN = /fetch\(\s*[`'"][^`'"]*\/api\/admin/g

const superficies = ZONAS.flatMap((z) => recorrer(z))
const ficheros = alcanzableDesde(superficies).filter((f) => !f.startsWith('node_modules/'))

console.log(`pantallas de las zonas vigiladas: ${superficies.length}`)
console.log(`ficheros que alcanzan (ellas y todo lo que importan): ${ficheros.length}`)

type Hallazgo = { fichero: string; linea: number; texto: string }
const hallazgos: Hallazgo[] = []

for (const f of ficheros) {
  if (EXCEPCIONES.some((e) => e.fichero === f)) continue
  const texto = fs.readFileSync(path.join(RAIZ, f), 'utf8')
  const limpio = sinComentarios(texto)
  for (const m of limpio.matchAll(RE_FETCH_ADMIN)) {
    const linea = limpio.slice(0, m.index).split('\n').length
    hallazgos.push({ fichero: f, linea, texto: texto.split('\n')[linea - 1]?.trim() ?? '' })
  }
}

if (hallazgos.length > 0) {
  console.log(`\nLLAMADAS A /api/admin DESDE UNA PANTALLA QUE NO ES DEL PANEL: ${hallazgos.length}\n`)
  for (const h of hallazgos) {
    console.log(`  ${h.fichero}:${h.linea}`)
    console.log(`      ${h.texto.slice(0, 120)}`)
  }
  console.log(`
Qué hacer: o la ruta equivalente de /api/instructor, o un prefijo que la pantalla pase
(el convenio de DeleteModuleButton: \`api = '/api/instructor'\`). Si de verdad tiene que
llamar al panel, añádelo a EXCEPCIONES con su motivo escrito.
`)
  process.exit(1)
}

console.log(`\nexcepciones declaradas: ${EXCEPCIONES.length}`)
console.log('\nTODO CORRECTO')
