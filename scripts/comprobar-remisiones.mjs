// Busca remisiones muertas en el TEXTO de las lecciones publicadas: titulos de
// cursos archivados o renombrados, slugs de curso, slugs de leccion que ya no
// existen y slugs de ruta eliminados.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Comprueba que ninguna leccion PUBLICADA remite a un curso archivado, a un
// titulo antiguo, a un slug que ya no existe o a una ruta eliminada.
//
//   node scripts/comprobar-remisiones.mjs
//
// Ejecutarlo SIEMPRE despues de fusionar, archivar o renombrar un curso: las
// redirecciones 301 arreglan los enlaces, no las menciones dentro del texto.
// Sale con codigo 1 si encuentra alguna, para poder engancharlo a CI.

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const q = async (t, s = '*') => (await db.from(t).select(s)).data
const cursos = await q('courses')
const mods = await q('modules')
const lecs = await q('lessons')
const rutas = await q('learning_paths')

const pub = cursos.filter((c) => c.status === 'published')
const idsPub = new Set(pub.map((c) => c.id))
const modsPub = mods.filter((m) => idsPub.has(m.course_id))
const vivas = lecs.filter((l) => modsPub.some((m) => m.id === l.module_id))

// --- lo que ya no existe ---
const slugsCursoVivos = new Set(pub.map((c) => c.slug))
const slugsCursoMuertos = cursos.filter((c) => c.status !== 'published').map((c) => c.slug)
const slugsLeccionVivos = new Set(vivas.map((l) => l.slug))
const slugsLeccionMuertos = [...new Set(lecs.filter((l) => !slugsLeccionVivos.has(l.slug)).map((l) => l.slug))]
const slugsRutaVivos = new Set(rutas.map((r) => r.slug))

// titulos antiguos de cursos que siguen vivos pero cambiaron de nombre
const TITULOS_ANTIGUOS = {
  'Introducción a Web3': 'Qué es Web3 y qué no',
  'Introducción al trading de criptomonedas': 'Trading: qué es y por qué casi nadie gana',
  'Introducción al Trading': 'Trading: qué es y por qué casi nadie gana',
}
const titulosArchivados = cursos.filter((c) => c.status !== 'published').map((c) => c.title)
const RUTAS_MUERTAS = ['seguridad-avanzada', 'Seguridad Avanzada']

const txt = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const hallazgos = []

for (const l of vivas) {
  const t = txt(l.content)
  const crudo = l.content || ''
  const add = (tipo, que, sugerido) => hallazgos.push({ leccion: l.slug, tipo, que, sugerido })

  for (const x of titulosArchivados) if (t.includes(x)) add('titulo de curso ARCHIVADO', x, '(el curso que lo absorbio)')
  for (const [viejo, nuevo] of Object.entries(TITULOS_ANTIGUOS)) if (t.includes(viejo)) add('titulo ANTIGUO de curso vivo', viejo, nuevo)
  for (const x of slugsCursoMuertos) if (crudo.includes(x)) add('slug de curso ARCHIVADO', x, '(redirige, pero el texto miente)')
  for (const x of slugsLeccionMuertos) if (crudo.includes(x)) add('slug de leccion QUE NO EXISTE', x, '')
  for (const x of RUTAS_MUERTAS) if (t.includes(x) || crudo.includes(x)) add('ruta ELIMINADA', x, 'seguridad-cripto')
  // enlaces absolutos a cursos
  for (const m of crudo.matchAll(/\/cursos\/([a-z0-9-]+)/g)) {
    if (!slugsCursoVivos.has(m[1])) add('enlace a curso inexistente', m[1], '')
  }
  for (const m of crudo.matchAll(/\/rutas\/([a-z0-9-]+)/g)) {
    if (!slugsRutaVivos.has(m[1])) add('enlace a ruta inexistente', m[1], '')
  }
}

console.log(`lecciones publicadas analizadas: ${vivas.length}`)
console.log(`slugs de curso archivados: ${slugsCursoMuertos.length} · slugs de leccion desaparecidos: ${slugsLeccionMuertos.length}`)
console.log(`\n=== ${hallazgos.length} REMISIONES MUERTAS ===\n`)
const porLeccion = {}
for (const h of hallazgos) (porLeccion[h.leccion] ??= []).push(h)
for (const [lec, hs] of Object.entries(porLeccion)) {
  const curso = pub.find((c) => c.id === modsPub.find((m) => m.id === vivas.find((l) => l.slug === lec).module_id).course_id)
  console.log(`  ${lec}   [${curso.slug}]`)
  for (const h of hs) console.log(`      ${h.tipo}: "${h.que}"${h.sugerido ? '  ->  ' + h.sugerido : ''}`)
}
if (!hallazgos.length) console.log('  ninguna')

process.exit(hallazgos.length ? 1 : 0)
