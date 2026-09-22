/**
 * Comprueba que los umbrales de nivel de TypeScript coinciden con los de la
 * base de datos.
 *
 * POR QUE NO CONSULTA LA BASE DE DATOS
 * Seria lo primero que uno piensa, y es mala idea en CI:
 *
 *   1. Haria falta SUPABASE_SERVICE_ROLE_KEY en los secretos de GitHub. Esa
 *      clave se salta RLS y da acceso completo. Un workflow de pull request
 *      ejecuta codigo de la rama propuesta: quien abra una PR podria leerla.
 *   2. Las PRs desde un fork no reciben secretos, asi que el paso fallaria
 *      siempre para colaboradores externos.
 *   3. La comprobacion dependeria del estado de produccion. Una PR que no toca
 *      niveles fallaria porque alguien edito la tabla a mano. Un CI que falla
 *      por motivos ajenos a la PR se acaba ignorando, y entonces no sirve.
 *
 * En su lugar se compara el array de TypeScript con los INSERT de la migracion
 * 039, que es lo que sembro la tabla. Es estatico, no necesita red ni secretos,
 * y atrapa el fallo que de verdad importa: que alguien cambie uno y no el otro.
 *
 * Lo que NO atrapa: que alguien edite level_thresholds a mano en Supabase sin
 * pasar por una migracion. Eso lo cubre la comprobacion 10 de
 * 039-comprobar.sql, que hay que ejecutar en el editor.
 */
import { readFileSync } from 'node:fs'

const TS = 'lib/gamification/levels.ts'
const SQL = 'supabase/migrations/039_niveles_por_umbrales.sql'

function umbralesDeTypeScript() {
  const src = readFileSync(TS, 'utf8')
  const bloque = src.match(/LEVEL_THRESHOLDS\s*=\s*\[([\s\S]*?)\]\s*as const/)
  if (!bloque) throw new Error(`No encuentro LEVEL_THRESHOLDS en ${TS}`)
  const filas = [...bloque[1].matchAll(
    /\{\s*level:\s*(\d+)\s*,\s*xp:\s*(\d+)\s*,\s*name:\s*'([^']+)'\s*\}/g
  )]
  return filas.map(m => ({ level: +m[1], xp: +m[2], name: m[3] }))
}

function umbralesDeSql() {
  const src = readFileSync(SQL, 'utf8')
  const bloque = src.match(
    /INSERT INTO public\.level_thresholds[^;]*?VALUES([\s\S]*?)ON CONFLICT/
  )
  if (!bloque) throw new Error(`No encuentro el INSERT de level_thresholds en ${SQL}`)
  const filas = [...bloque[1].matchAll(/\(\s*(\d+)\s*,\s*'([^']+)'\s*,\s*(\d+)\s*\)/g)]
  return filas.map(m => ({ level: +m[1], name: m[2], xp: +m[3] }))
}

const ts = umbralesDeTypeScript()
const sql = umbralesDeSql()
const fallos = []

if (ts.length !== sql.length) {
  fallos.push(`Distinto numero de niveles: ${ts.length} en TypeScript, ${sql.length} en SQL`)
}

const porNivel = new Map(sql.map(f => [f.level, f]))
for (const t of ts) {
  const s = porNivel.get(t.level)
  if (!s) {
    fallos.push(`Nivel ${t.level} (${t.name}) esta en TypeScript y no en SQL`)
    continue
  }
  if (s.name !== t.name) {
    fallos.push(`Nivel ${t.level}: nombre '${t.name}' en TypeScript y '${s.name}' en SQL`)
  }
  if (s.xp !== t.xp) {
    fallos.push(`Nivel ${t.level} (${t.name}): ${t.xp} XP en TypeScript y ${s.xp} en SQL`)
  }
  porNivel.delete(t.level)
}
for (const s of porNivel.values()) {
  fallos.push(`Nivel ${s.level} (${s.name}) esta en SQL y no en TypeScript`)
}

if (fallos.length) {
  console.error('Los umbrales de nivel no coinciden:\n')
  for (const f of fallos) console.error(`  - ${f}`)
  console.error(`\n  TypeScript: ${TS}`)
  console.error(`  SQL:        ${SQL}`)
  console.error('\nSi el cambio es deliberado, hay que tocar los dos y anadir una')
  console.error('migracion que actualice la tabla level_thresholds.')
  process.exit(1)
}

console.log(`Umbrales de nivel: ${ts.length} niveles, TypeScript y SQL coinciden.`)
