/**
 * Los embeds de PostgREST que siguen claves ajenas repuntadas por la 117.
 *
 *   npx tsx scripts/auditar-embeds-del-espejo.mts
 *
 * POR QUE
 *   La 117 repuntó cinco claves ajenas a la copia publicada. Un embed de PostgREST
 *   —`select('…, course:courses(…)')`— no se escribe con la tabla: SE RESUELVE POR LA
 *   CLAVE AJENA. Al moverla, el embed deja de existir y la consulta **entera** falla con
 *   PGRST200, así que la pantalla se queda vacía o contesta 404 sin decir por qué.
 *   Encontrado así en /dashboard/certificados y en /certificados/[id].
 *
 *   Esto lo busca en todo el código y además lo prueba contra la base, porque una
 *   relación puede existir o no y lo único que lo dice es preguntar.
 *
 * LAS CINCO CLAVES REPUNTADAS (del bloque $claves$ de la 117):
 *   user_progress.lesson_id -> lessons_publicadas
 *   xp_events.lesson_id     -> lessons_publicadas
 *   xp_events.course_id     -> courses_publicados
 *   certificates.course_id  -> courses_publicados
 *   certificates.module_id  -> modules_publicados
 *
 *   `course_enrollments.course_id` NO se repuntó: sigue a `courses` (solo cambió a
 *   RESTRICT), así que sus embeds son correctos.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')

/** Tablas cuyas claves se movieron, y a dónde apunta cada columna ahora. */
const REPUNTADAS: Record<string, Record<string, string>> = {
  user_progress: { lesson_id: 'lessons_publicadas' },
  xp_events: { lesson_id: 'lessons_publicadas', course_id: 'courses_publicados' },
  certificates: { course_id: 'courses_publicados', module_id: 'modules_publicados' },
}

/** Lo que un embed intentaría alcanzar por cada clave vieja. */
const DESTINOS_VIEJOS = ['lessons', 'courses', 'modules']

const EXT = ['.ts', '.tsx']
function ficheros(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      ficheros(p, acc)
    } else if (EXT.includes(path.extname(e.name))) acc.push(p)
  }
  return acc
}

const fuentes = ['app', 'lib', 'components'].flatMap((d) => ficheros(path.join(RAIZ, d)))

type Hallazgo = { fichero: string; linea: number; tabla: string; embed: string }
const hallazgos: Hallazgo[] = []

for (const f of fuentes) {
  const texto = fs.readFileSync(f, 'utf8')
  for (const tabla of Object.keys(REPUNTADAS)) {
    // Cada .from('<tabla>') y el .select(...) que venga detrás, hasta 2000 caracteres.
    const re = new RegExp(`from\\(['"]${tabla}['"]\\)`, 'g')
    for (const m of texto.matchAll(re)) {
      const trozo = texto.slice(m.index!, m.index! + 2000)
      const sel = trozo.match(/\.select\(\s*([`'"])([\s\S]*?)\1/)
      if (!sel) continue
      const contenido = sel[2]
      // Un embed es `algo(...)`: nombre de tabla o alias:tabla con parentesis.
      for (const emb of contenido.matchAll(/([a-zA-Z_]+)\s*:?\s*([a-zA-Z_]*)\s*\(/g)) {
        const destino = emb[2] || emb[1]
        if (!DESTINOS_VIEJOS.includes(destino)) continue
        // ¿La columna por la que iría está repuntada?
        hallazgos.push({
          fichero: path.relative(RAIZ, f).split(path.sep).join('/'),
          linea: texto.slice(0, m.index! + sel.index! + emb.index!).split('\n').length,
          tabla,
          embed: emb[0].replace(/\s*\($/, ''),
        })
      }
    }
  }
}

console.log(`\n=== embeds desde tablas con claves repuntadas: ${hallazgos.length} ===`)
if (hallazgos.length === 0) console.log('   (ninguno)')
for (const h of hallazgos) {
  console.log(`   ${h.tabla.padEnd(15)} -> ${h.embed.padEnd(22)} ${h.fichero}:${h.linea}`)
}

// ── Y qué dice la base ───────────────────────────────────────────────────────
const env = Object.fromEntries(
  fs.readFileSync(path.join(RAIZ, '.env.local'), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

console.log('\n=== qué relaciones resuelve PostgREST hoy ===')
const relaciones: [string, string][] = [
  ['certificates', 'courses'],
  ['certificates', 'courses_publicados'],
  ['certificates', 'modules'],
  ['certificates', 'modules_publicados'],
  ['user_progress', 'lessons'],
  ['user_progress', 'lessons_publicadas'],
  ['xp_events', 'lessons'],
  ['xp_events', 'courses'],
  ['xp_events', 'courses_publicados'],
  ['course_enrollments', 'courses'],
]

let rotos = 0
for (const [tabla, destino] of relaciones) {
  const { error } = await svc.from(tabla).select(`id, ${destino}(id)`).limit(1)
  const estado = !error
    ? 'resuelve'
    : error.code === 'PGRST200'
      ? 'NO EXISTE la relación'
      : `${error.code}: ${error.message.slice(0, 45)}`
  if (error?.code === 'PGRST200') rotos++
  console.log(`   ${tabla.padEnd(19)} -> ${destino.padEnd(20)} ${estado}`)
}

console.log(
  `\nembeds encontrados en el código ${hallazgos.length}, ` +
  `relaciones que no existen ${rotos}`
)
console.log(
  hallazgos.length === 0
    ? 'TODO CORRECTO: ningún embed sigue una clave repuntada\n'
    : 'REVISAR: hay embeds que siguen claves repuntadas\n'
)
process.exit(hallazgos.length === 0 ? 0 : 1)
