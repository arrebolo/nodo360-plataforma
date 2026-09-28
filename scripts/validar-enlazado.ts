/**
 * Valida todo el enlazado interno del blog y del glosario. Corre en el build.
 *
 *     npm run build          -> lo ejecuta el hook prebuild
 *     npx tsx scripts/validar-enlazado.ts
 *
 * QUE COMPRUEBA, Y POR QUE NO BASTA CON LOS TIPOS
 *   Los tipos SlugCurso y SlugLeccion ya convierten un slug inexistente en un
 *   error de tsc. Lo que NO pueden ver es nada de esto:
 *
 *     · el EMPAREJAMIENTO: `relatedLesson` acepta cualquier leccion de
 *       cualquier curso, asi que una leccion correcta colgada del curso
 *       equivocado pasa el tipo y da un 404;
 *     · los enlaces markdown escritos DENTRO del texto de los articulos, que
 *       para TypeScript son cadenas cualesquiera;
 *     · relatedArticle y relatedTerms, que ya existian y nadie validaba.
 *
 * SALE CON CODIGO 1 si algo esta roto, para que el build se pare. Un enlace
 * roto que llega a produccion lo encuentra un lector, y eso es tarde.
 */
import { blogPosts } from '../lib/blog-data'
import { glossaryTerms } from '../lib/glossary-data'
import { CURSOS_PUBLICADOS } from '../lib/enlazado/cursos-publicados'

const errores: string[] = []

const cursos = CURSOS_PUBLICADOS as Record<string, { lecciones: readonly string[] }>
const slugsArticulos = new Set(blogPosts.map((p) => p.slug))
const slugsTerminos = new Set(glossaryTerms.map((t) => t.slug))

/** Comprueba un par curso/leccion y describe el fallo si lo hay. */
function fallaElPar(curso: string, leccion?: string): string | null {
  const c = cursos[curso]
  if (!c) return `el curso "${curso}" no esta publicado`
  if (leccion && !c.lecciones.includes(leccion)) {
    return `la leccion "${leccion}" NO pertenece al curso "${curso}"`
  }
  return null
}

// ── 1. Articulos: curso, leccion y articulos relacionados ───────────────────
for (const p of blogPosts) {
  const fallo = fallaElPar(p.relatedCourse, p.relatedLesson)
  if (fallo) errores.push(`articulo "${p.slug}": ${fallo}`)

  for (const rel of p.relatedSlugs ?? []) {
    if (!slugsArticulos.has(rel)) {
      errores.push(`articulo "${p.slug}": relatedSlugs apunta a "${rel}", que no existe`)
    }
  }
}

// ── 2. Terminos: curso, leccion, articulo y terminos relacionados ───────────
for (const t of glossaryTerms) {
  const fallo = fallaElPar(t.relatedCourse, t.relatedLesson)
  if (fallo) errores.push(`termino "${t.slug}": ${fallo}`)

  if (t.relatedArticle && !slugsArticulos.has(t.relatedArticle)) {
    errores.push(`termino "${t.slug}": relatedArticle apunta a "${t.relatedArticle}", que no existe`)
  }
  for (const rel of t.relatedTerms ?? []) {
    if (!slugsTerminos.has(rel)) {
      errores.push(`termino "${t.slug}": relatedTerms apunta a "${rel}", que no existe`)
    }
  }
}

// ── 3. Los enlaces escritos DENTRO del texto ────────────────────────────────
// Esto es lo que ningun tipo puede comprobar: markdown dentro de una cadena.
const enlacesEnTexto = new Map<string, Set<string>>() // slug de termino -> de donde le llega

function revisarTexto(quien: string, texto: string) {
  for (const m of texto.matchAll(/\]\(\/glosario\/([a-z0-9-]+)\)/g)) {
    const slug = m[1]
    if (!slugsTerminos.has(slug)) {
      errores.push(`${quien}: enlaza a /glosario/${slug}, que no existe`)
      continue
    }
    if (!enlacesEnTexto.has(slug)) enlacesEnTexto.set(slug, new Set())
    enlacesEnTexto.get(slug)!.add(quien)
  }
  for (const m of texto.matchAll(/\]\(\/cursos\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\)/g)) {
    const fallo = fallaElPar(m[1], m[2])
    if (fallo) errores.push(`${quien}: enlaza a /cursos/${m[1]}${m[2] ? '/' + m[2] : ''} y ${fallo}`)
  }
  for (const m of texto.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
    if (!slugsArticulos.has(m[1])) {
      errores.push(`${quien}: enlaza a /blog/${m[1]}, que no existe`)
    }
  }
}

for (const p of blogPosts) revisarTexto(`articulo "${p.slug}"`, p.content)
for (const t of glossaryTerms) revisarTexto(`termino "${t.slug}"`, `${t.definition}\n${t.explanation}`)

// ── 4. El recuento, que es lo que se mira cuando todo va bien ───────────────
const conLeccion = {
  articulos: blogPosts.filter((p) => p.relatedLesson).length,
  terminos: glossaryTerms.filter((t) => t.relatedLesson).length,
}

/**
 * Huerfano = no llega a el ningun enlace. Se cuentan las tres vias: el articulo
 * relacionado, los terminos relacionados de otros, y los enlaces escritos en el
 * texto de los articulos.
 */
const huerfanos = glossaryTerms.filter(
  (t) =>
    !t.relatedArticle &&
    !enlacesEnTexto.has(t.slug) &&
    !glossaryTerms.some((o) => o.slug !== t.slug && (o.relatedTerms ?? []).includes(t.slug))
)

const enlacesDeTexto = [...enlacesEnTexto.values()].reduce((s, v) => s + v.size, 0)

console.log('Enlazado interno:')
console.log(`  articulos con curso    ${blogPosts.length} de ${blogPosts.length}, ${conLeccion.articulos} con leccion concreta`)
console.log(`  terminos con curso     ${glossaryTerms.length} de ${glossaryTerms.length}, ${conLeccion.terminos} con leccion concreta`)
console.log(`  terminos sin leccion   ${glossaryTerms.length - conLeccion.terminos} (ninguna leccion del catalogo los explica)`)
console.log(`  enlaces en el texto    ${enlacesDeTexto} a ${enlacesEnTexto.size} terminos distintos`)
console.log(`  terminos huerfanos     ${huerfanos.length}${huerfanos.length ? ': ' + huerfanos.map((t) => t.slug).join(', ') : ''}`)

if (errores.length > 0) {
  console.error(`\n${errores.length} ENLACE(S) ROTO(S):`)
  for (const e of errores) console.error(`  - ${e}`)
  console.error('\nSi has cambiado cursos o lecciones en la base:')
  console.error('  node scripts/generar-cursos-publicados.mjs')
  process.exit(1)
}

console.log('\nTodos los enlaces internos apuntan a algo que existe.')
