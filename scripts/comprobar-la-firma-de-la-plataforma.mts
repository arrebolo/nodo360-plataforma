/**
 * La firma de la plataforma, en el HTML que de verdad se sirve a un anónimo.
 *
 *   npx tsx scripts/comprobar-la-firma-de-la-plataforma.mts [http://localhost:3157]
 *
 * QUÉ VIGILA, Y POR QUÉ NO BASTA CON MIRAR EL COMPONENTE
 *   Hasta la migración 121 la ficha decidía si poner «Creado por Nodo360» o
 *   «Por <persona>» preguntando por el ROL del autor:
 *
 *       const isNodo360 = !course.instructor_id || course.instructor?.role === 'admin'
 *
 *   Eso obligaba a que `users.role` fuera legible por la clave anónima, que es
 *   pública, y mientras siguiera así no se podía cerrar la enumeración de
 *   cuentas. Ahora la firma es una columna del curso.
 *
 *   Pero quitar la lectura del rol no basta. Si el servidor sigue enviando el
 *   objeto del autor, SU NOMBRE Y APELLIDO VIAJAN EN EL HTML aunque la tarjeta
 *   pinte «Creado por Nodo360»: está en el código fuente de la página, al
 *   alcance de cualquiera que mire. Por eso esto se comprueba pidiendo la página
 *   por HTTP sin ninguna cookie y buscando el nombre en el texto que llega.
 *
 * EL NOMBRE NO ESTÁ ESCRITO AQUÍ. Se lee de la base con el cliente de servicio,
 * en tiempo de ejecución: un nombre real en un repositorio público es justo lo
 * que este trabajo viene a quitar.
 *
 * SOLO LEE. No crea ni borra nada, ni en la base ni en el sitio.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v

const SITIO = process.argv[2] ?? 'http://localhost:3157'
const svc = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL as string,
  env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
)

let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

/** Pide una página SIN cookies, como cualquiera que llegue de fuera. */
async function comoAnonimo(ruta: string) {
  const r = await fetch(`${SITIO}${ruta}`, {
    headers: { 'cache-control': 'no-cache' },
    redirect: 'manual',
  })
  return { estado: r.status, html: await r.text() }
}

console.log(`\n=== la firma de la plataforma, en ${SITIO} ===\n`)

// ── PRIMERO: ¿ESTE SERVIDOR ES EL DEL BUILD QUE QUIERO MEDIR? ──────────────
//
// Un 200 en el puerto no prueba nada. Dos veces ya he medido un `next start`
// viejo creyendo que era el nuevo: `pkill` se llevó el envoltorio de npx y no el
// servidor, el arranque siguiente murió con EADDRINUSE en su propio log, y las
// comprobaciones salieron VERDES CONTRA EL CÓDIGO DE ANTES. Un verde así es peor
// que un rojo, porque parece una respuesta.
//
// Next pone el identificador del build en las rutas de sus propios chunks, así
// que comparar el HTML con .next/BUILD_ID identifica al servidor sin ambigüedad.
const BUILD_ID = fs.existsSync('.next/BUILD_ID')
  ? fs.readFileSync('.next/BUILD_ID', 'utf8').trim()
  : null
if (!BUILD_ID) {
  console.log('   *** No hay .next/BUILD_ID: hace falta `npm run build` antes. Parar.')
  process.exit(1)
}
const portada = await fetch(`${SITIO}/cursos`, { headers: { 'cache-control': 'no-cache' } })
const portadaHtml = await portada.text()
if (!portadaHtml.includes(BUILD_ID)) {
  console.log(`   *** El servidor de ${SITIO} NO es este build.`)
  console.log(`       .next/BUILD_ID dice «${BUILD_ID}» y el HTML servido no lo menciona.`)
  console.log('       Lo más probable es que siga vivo un `next start` anterior: mira quién')
  console.log('       escucha en el puerto, mátalo POR PID y repite.')
  process.exit(1)
}
console.log(`   OK   el servidor es este build (${BUILD_ID})`)

// ── Los datos de verdad, de la base ────────────────────────────────────────
const { data: cursos, error: eCursos } = await svc
  .from('courses')
  .select('id, slug, title, status, instructor_id, firmado_por_la_plataforma')
  .in('status', ['published', 'coming_soon'])
if (eCursos) throw new Error(`no se pudieron leer los cursos: ${eCursos.message}`)

const { data: autores, error: eAutores } = await svc
  .from('users')
  .select('id, full_name')
  .in('id', [...new Set((cursos ?? []).map((c) => c.instructor_id).filter((x): x is string => !!x))])
if (eAutores) throw new Error(`no se pudieron leer los autores: ${eAutores.message}`)

const nombreDe = new Map((autores ?? []).map((u) => [u.id, (u.full_name ?? '').trim()]))
const deLaPlataforma = (cursos ?? []).filter((c) => c.firmado_por_la_plataforma)
const dePersona = (cursos ?? []).filter((c) => !c.firmado_por_la_plataforma)

console.log(`   ${cursos?.length ?? 0} cursos en el catálogo: ${deLaPlataforma.length} de la plataforma, ${dePersona.length} de una persona`)

// PRECONDICIÓN. Sin cursos firmados por la plataforma y con autor, esta prueba
// no mide nada: hay que decirlo, no pasar en verde.
const firmadosConAutor = deLaPlataforma.filter((c) => {
  const n = c.instructor_id ? nombreDe.get(c.instructor_id) : ''
  return !!n && n.length > 3
})
di(firmadosConAutor.length > 0,
  'hay al menos un curso firmado por la plataforma cuyo autor tiene nombre',
  `${firmadosConAutor.length}`)
if (firmadosConAutor.length === 0) {
  console.log('\n   *** Sin eso no se puede comprobar que el nombre no viaja. Parar.')
  process.exit(1)
}

const nombresQueNoDebenSalir = [
  ...new Set(firmadosConAutor.map((c) => nombreDe.get(c.instructor_id as string) as string)),
]

// ── 1. El catálogo ─────────────────────────────────────────────────────────
console.log('\n=== /cursos ===')
const catalogo = await comoAnonimo('/cursos')
di(catalogo.estado === 200, 'la página responde 200', `${catalogo.estado}`)
// PRECONDICIÓN DE CARGA: una aserción negativa sobre una página vacía pasa sola.
di(catalogo.html.includes('Creado por'),
  'la página ha cargado de verdad (dice «Creado por»)',
  `${catalogo.html.length} bytes`)

for (const c of firmadosConAutor) {
  di(catalogo.html.includes(c.title), `el curso «${c.title.slice(0, 40)}» está en el catálogo`)
}
for (const n of nombresQueNoDebenSalir) {
  di(!catalogo.html.includes(n),
    `el nombre del autor NO aparece en el HTML de /cursos (${n.length} caracteres)`,
    catalogo.html.includes(n) ? '*** ESTÁ EN EL CÓDIGO FUENTE' : 'no está')
}

// ── 2. Las fichas ──────────────────────────────────────────────────────────
console.log('\n=== las fichas de los cursos firmados por la plataforma ===')
for (const c of firmadosConAutor) {
  const ficha = await comoAnonimo(`/cursos/${c.slug}`)
  const nombre = nombreDe.get(c.instructor_id as string) as string
  di(ficha.estado === 200, `${c.slug}: responde 200`, `${ficha.estado}`)
  di(ficha.html.includes(c.title), `${c.slug}: la ficha ha cargado`, `${ficha.html.length} bytes`)
  di(ficha.html.includes('Nodo360</span>') || ficha.html.includes('>Nodo360<'),
    `${c.slug}: firma «Creado por Nodo360»`)
  di(!ficha.html.includes(nombre),
    `${c.slug}: el nombre del autor NO está en el HTML`,
    ficha.html.includes(nombre) ? '*** ESTÁ EN EL CÓDIGO FUENTE' : 'no está')
}

// ── 3. Y el rol tampoco se pide ────────────────────────────────────────────
// La otra mitad del trabajo: que ninguna de estas páginas necesite leer
// `users.role` con la clave anónima. Se comprueba contra la base, que es donde
// se va a revocar (122), y no contra el HTML.
console.log('\n=== lo que la clave anónima necesita leer ===')
const anon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL as string,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: false } }
)
// Lo que el modal del autor necesita de verdad: la biografia y si esa persona es
// instructor o mentor. NO `role`: medido, por la vista tambien se puede filtrar,
// y `role=eq.admin` devuelve fila, asi que la 122 se lo quitara tambien a la
// vista. Estas tres columnas son las que tienen que seguir ahi.
const { data: dVista, error: eVista } = await anon
  .from('perfiles_publicos')
  .select('id, bio, es_instructor, es_mentor')
  .limit(1)
di(!eVista, 'anon lee de perfiles_publicos lo que el modal del autor necesita',
  eVista ? `${eVista.code}: ${eVista.message.slice(0, 60)}` : 'bio, es_instructor, es_mentor')
di((dVista?.length ?? 0) === 1, 'y la vista le da fila (no esta vacia para anon)',
  `${dVista?.length ?? 0} filas`)

// Y la otra mitad: que el titulo no necesite preguntar quien administra. Mientras
// `role` siga en la vista esto sigue en verde a proposito —lo cierra la 122—,
// pero el numero tiene que estar a la vista para saber que queda pendiente.
const { data: dAdmins } = await anon.from('perfiles_publicos').select('id').eq('role', 'admin')
console.log(`   ...  por la vista, role=eq.admin devuelve ${dAdmins?.length ?? 0} fila(s). La 122 quita «role» de la vista y esto pasara a 0.`)

console.log(
  fallos === 0
    ? '\nTODO CORRECTO: el nombre de quien firma como plataforma no sale del servidor.\n'
    : `\nREVISAR: ${fallos} comprobaciones falladas.\n`
)
process.exit(fallos === 0 ? 0 : 1)
