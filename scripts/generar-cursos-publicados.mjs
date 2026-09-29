/**
 * Regenera lib/enlazado/cursos-publicados.ts desde la base de datos.
 *
 *     node scripts/generar-cursos-publicados.mjs
 *
 * POR QUE HACE FALTA
 *   El enlazado interno del blog y del glosario apunta a cursos y lecciones que
 *   viven en la base, no en el repositorio. El fichero que genera esto es lo que
 *   permite que un slug mal escrito sea un error de `tsc` en lugar de un 404 que
 *   alguien descubre pinchando.
 *
 * CUANDO EJECUTARLO
 *   Cada vez que se publique, se archive o se renombre un curso o una leccion.
 *   Si el enlazado empieza a fallar sin motivo aparente, empezar por aqui.
 *
 * Lee .env.local y usa la clave de servicio: no modifica nada, solo consulta.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Solo los publicados: un curso archivado no se puede enlazar.
const { data: cursos, error: errorCursos } = await db
  .from('courses')
  .select('id, slug, title, level')
  .eq('status', 'published')
  .order('slug')

if (errorCursos) {
  console.error('Error leyendo los cursos:', errorCursos.message)
  process.exit(1)
}

const salida = []
for (const c of cursos) {
  // Ojo: la columna de orden es order_index, no position.
  const { data: modulos, error: errorModulos } = await db
    .from('modules')
    .select('id, order_index')
    .eq('course_id', c.id)
    .order('order_index')

  if (errorModulos) {
    console.error(`Error leyendo los modulos de ${c.slug}:`, errorModulos.message)
    process.exit(1)
  }

  const lecciones = []
  for (const m of modulos) {
    const { data: ls, error: errorLecciones } = await db
      .from('lessons')
      .select('slug, order_index')
      .eq('module_id', m.id)
      .order('order_index')

    if (errorLecciones) {
      console.error(`Error leyendo las lecciones de ${c.slug}:`, errorLecciones.message)
      process.exit(1)
    }
    for (const l of ls) {
      if (l.slug) lecciones.push(l.slug)
      else console.warn(`  aviso: una leccion de ${c.slug} no tiene slug y se omite`)
    }
  }
  salida.push({ slug: c.slug, titulo: c.title, nivel: c.level, lecciones })
}

const totalLecciones = salida.reduce((s, c) => s + c.lecciones.length, 0)

const cabecera = `/**
 * Los cursos publicados y sus lecciones, GENERADO desde la base.
 *
 * NO EDITAR A MANO. Se regenera con:
 *     node scripts/generar-cursos-publicados.mjs
 *
 * POR QUE EXISTE
 *   El enlazado interno del blog y del glosario apunta a cursos y lecciones que
 *   viven en la BASE DE DATOS, no en el repositorio. Sin una lista aqui, un slug
 *   mal escrito no se nota hasta que alguien pincha y se encuentra un 404.
 *
 *   Con esta lista, los tipos SlugCurso y SlugLeccion convierten un slug
 *   inexistente en un error de tsc, y scripts/validar-enlazado.ts comprueba
 *   ademas que la leccion pertenezca a su curso. Las dos cosas corren en el
 *   build, asi que un enlace roto no llega a produccion.
 *
 * LO QUE ESTA LISTA NO GARANTIZA
 *   Que siga al dia. Si se publica, se archiva o se renombra un curso en la
 *   base, hay que regenerarla. El dia que el enlazado falle sin motivo
 *   aparente, empezar por aqui.
 *
 * Generado el ${new Date().toISOString().slice(0, 10)} desde ${salida.length} cursos publicados y ${totalLecciones} lecciones.
 */

export const CURSOS_PUBLICADOS = {
`

const cuerpo = salida
  .map((c) => {
    const ls = c.lecciones.map((s) => `      '${s}',`).join('\n')
    return `  '${c.slug}': {
    titulo: ${JSON.stringify(c.titulo)},
    nivel: '${c.nivel}',
    lecciones: [
${ls}
    ],
  },`
  })
  .join('\n')

const pie = `
} as const

/** Slug de un curso publicado. Un valor que no este aqui es un error de tsc. */
export type SlugCurso = keyof typeof CURSOS_PUBLICADOS

/** Slug de cualquier leccion de un curso publicado. */
export type SlugLeccion =
  (typeof CURSOS_PUBLICADOS)[SlugCurso]['lecciones'][number]

/** Los niveles tal como los guarda la base, y como se dicen en espanol. */
export const NIVEL_EN_ESPANOL: Record<string, string> = {
  beginner: 'nivel basico',
  intermediate: 'nivel intermedio',
  advanced: 'nivel avanzado',
}
`

mkdirSync('lib/enlazado', { recursive: true })
writeFileSync('lib/enlazado/cursos-publicados.ts', cabecera + cuerpo + pie, 'utf8')

console.log(`lib/enlazado/cursos-publicados.ts regenerado`)
console.log(`  ${salida.length} cursos publicados, ${totalLecciones} lecciones`)
for (const c of salida) console.log(`  ${c.slug.padEnd(46)} ${String(c.lecciones.length).padStart(2)} lecciones`)
