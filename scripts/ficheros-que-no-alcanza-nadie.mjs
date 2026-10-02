/**
 * Los ficheros que no alcanza ninguna ruta.
 *
 * POR QUE NO SIRVE GREP POR NOMBRE
 *   `grep CoursesList` encuentra el barril que lo reexporta y parece usado; y dos
 *   componentes distintos con el mismo nombre de fichero (hay dos CourseAdminCard y dos
 *   CourseForm) se confunden entre si. Lo unico que decide es el grafo: se parte de lo
 *   que Next ejecuta —page, layout, route, middleware…— y se sigue cada import.
 *
 * Caso real: la correccion de los siete estados de un curso se escribio en
 * components/admin/CoursesList.tsx, que no alcanza ninguna pagina. La pantalla seguia
 * igual y la PR parecia hecha.
 *
 *   node scripts/ficheros-que-no-alcanza-nadie.mjs            # el informe
 *   node scripts/ficheros-que-no-alcanza-nadie.mjs --solo components/course
 */
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const CARPETAS = ['app', 'components', 'lib', 'hooks', 'types', 'contexts', 'providers', 'utils', 'middleware.ts']
const EXT = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs']

// Lo que Next ejecuta por si mismo: son las raices del grafo.
const ESPECIALES = new Set([
  'page', 'layout', 'route', 'template', 'default', 'error', 'global-error',
  'not-found', 'loading', 'middleware', 'instrumentation', 'sitemap', 'robots',
  'manifest', 'icon', 'apple-icon', 'opengraph-image', 'twitter-image',
])

function recorrer(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      recorrer(p, acc)
    } else if (EXT.includes(path.extname(e.name))) acc.push(p)
  }
  return acc
}

const todos = []
for (const c of CARPETAS) {
  const p = path.join(RAIZ, c)
  if (fs.existsSync(p) && fs.statSync(p).isFile()) todos.push(p)
  else recorrer(p, todos)
}

const rel = (p) => path.relative(RAIZ, p).split(path.sep).join('/')

/** Resuelve un especificador a un fichero del proyecto, o null si es externo. */
function resolver(desde, spec) {
  let base
  if (spec.startsWith('@/')) base = path.join(RAIZ, spec.slice(2))
  else if (spec.startsWith('./') || spec.startsWith('../')) base = path.resolve(path.dirname(desde), spec)
  else return null // paquete de node_modules

  for (const e of ['', ...EXT]) {
    const p = base + e
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
  }
  for (const e of EXT) {
    const p = path.join(base, 'index' + e)
    if (fs.existsSync(p)) return p
  }
  return null
}

// Todo lo que parezca un especificador: import, export from, import(), require().
const RE = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g

const grafo = new Map()
for (const f of todos) {
  const texto = fs.readFileSync(f, 'utf8')
  const hijos = new Set()
  for (const m of texto.matchAll(RE)) {
    const dest = resolver(f, m[1])
    if (dest) hijos.add(dest)
  }
  grafo.set(f, hijos)
}

const raices = todos.filter((f) => {
  const r = rel(f)
  if (!r.startsWith('app/') && r !== 'middleware.ts') return false
  return ESPECIALES.has(path.basename(f, path.extname(f)))
})

const vivos = new Set()
const pila = [...raices]
while (pila.length) {
  const f = pila.pop()
  if (vivos.has(f)) continue
  vivos.add(f)
  for (const h of grafo.get(f) ?? []) if (!vivos.has(h)) pila.push(h)
}

const filtro = process.argv.includes('--solo') ? process.argv[process.argv.indexOf('--solo') + 1] : null
const muertos = todos.filter((f) => !vivos.has(f)).map(rel)
  .filter((r) => !filtro || r.startsWith(filtro))
  .sort()

console.log(`\nficheros mirados ${todos.length}   raices ${raices.length}   alcanzables ${vivos.size}`)
console.log(`\n=== no los alcanza ninguna ruta (${muertos.length}) ===`)
for (const m of muertos) console.log(`   ${m}`)
console.log('')
