// Que se lleva alguien con la clave anonima, que va en el HTML de cualquier
// pagina del sitio. Solo lectura.
//
//   node scripts/auditar-clave-anonima.mjs
//
// Compara, tabla por tabla, lo que ve `anon` con lo que hay de verdad, y
// comprueba que las puertas publicas siguen abiertas. Pensado para ejecutarlo
// ANTES y DESPUES de cada migracion de RLS y comparar las dos salidas.
//
// Sale con codigo 1 si alguna comprobacion marcada como esperada falla, para
// poder engancharlo a CI el dia que lo haya.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

let fallos = 0
const ok = (b, txt) => { if (!b) fallos++; console.log(`  ${b ? 'OK   ' : 'FALLA'} ${txt}`) }

// ---------------------------------------------------------------- cuantas filas

console.log('=== filas que ve la clave anonima ===\n')
console.log('  tabla                     anon   total   esperado')
const TABLAS = [
  ['users', 'solo las de rol publico'],
  ['courses', 'solo publicados'],
  ['modules', 'solo de cursos publicados'],
  ['lessons', 'solo de cursos publicados'],
  ['quiz_questions', 'ninguna: denegada'],
  ['certificates', 'ninguna: denegada'],
  ['user_progress', 'ninguna'],
  ['course_enrollments', 'ninguna'],
  ['quiz_attempts', 'ninguna'],
  ['learning_paths', 'todas: catalogo'],
  ['learning_path_courses', 'todas: catalogo'],
]
for (const [t, esperado] of TABLAS) {
  const a = await anon.from(t).select('*', { count: 'exact', head: true })
  const s = await svc.from(t).select('*', { count: 'exact', head: true })
  const vista = a.error ? `denegada(${a.error.code})` : String(a.count)
  console.log(`  ${t.padEnd(24)} ${vista.padStart(6)}  ${String(s.count).padStart(5)}   ${esperado}`)
}

// ---------------------------------------------------------------- columnas

console.log('\n=== columnas que NO deberia poder leer ===')
// Se comprueban con clave anonima; con sesion de alumno importan aun mas:
// hasta la 049, users_read_all_authenticated (USING true) servia las 23
// filas enteras a cualquiera que hubiera iniciado sesion.
const PROHIBIDAS = [
  ['users', 'email'],
  ['users', 'is_suspended'],
  ['users', 'suspended_reason'],
  ['users', 'active_path_id'],
  ['certificates', 'user_id'],
]
for (const [t, col] of PROHIBIDAS) {
  const { error } = await anon.from(t).select(col).limit(1)
  ok(!!error, `${t}.${col} -> ${error ? 'denegada (' + error.code + ')' : 'LEGIBLE'}`)
}

console.log('\n=== columnas que SI necesitan las paginas publicas ===')
const PUBLICAS = [
  ['users', 'id, full_name, avatar_url, role', '/mentores'],
  ['users', 'id, full_name, avatar_url, bio, created_at', '/mentores/[id]'],
  ['courses', 'id, slug, title, description', '/cursos'],
  ['learning_paths', 'slug, name, subtitle', '/rutas'],
]
for (const [t, cols, quien] of PUBLICAS) {
  const { data, error } = await anon.from(t).select(cols).limit(1)
  ok(!error && !!data?.length, `${quien}: ${t}(${cols}) -> ${error ? error.code : data?.length + ' fila'}`)
}

// ---------------------------------------------------------------- contenido

console.log('\n=== contenido de cursos no publicados ===')
const { data: cursos } = await svc.from('courses').select('id, slug, status')
const noPub = cursos.filter((c) => c.status !== 'published')
const { data: modsTodos } = await svc.from('modules').select('id, course_id')
const idsNoPub = new Set(noPub.map((c) => c.id))
const modsNoPub = modsTodos.filter((m) => idsNoPub.has(m.course_id)).map((m) => m.id)

const { data: lecAnon } = await anon.from('lessons').select('id, course_id')
const filtradas = (lecAnon || []).filter((l) => idsNoPub.has(l.course_id))
ok(filtradas.length === 0, `lecciones de cursos no publicados visibles: ${filtradas.length} (deben ser 0)`)

const { data: modAnon } = await anon.from('modules').select('id')
const modFiltrados = (modAnon || []).filter((m) => modsNoPub.includes(m.id))
ok(modFiltrados.length === 0, `modulos de cursos no publicados visibles: ${modFiltrados.length} (deben ser 0)`)

console.log(`  (${noPub.length} cursos no publicados: ${noPub.map((c) => c.slug).join(', ')})`)

// ---------------------------------------------------------------- puertas publicas

console.log('\n=== puertas publicas: deben seguir abiertas ===')
const { data: certs } = await svc.from('certificates').select('certificate_number').limit(3)
for (const c of certs) {
  const { data, error } = await anon.rpc('verificar_certificado', { p_codigo: c.certificate_number })
  const fila = Array.isArray(data) ? data[0] : data
  ok(!error && !!fila, `verificar_certificado('${c.certificate_number}') -> ${error ? error.code : fila ? 'una fila' : 'vacio'}`)
  if (fila) ok(!('user_id' in fila), '    y no trae user_id')
}
{
  const { data, error } = await anon.rpc('verificar_certificado', { p_codigo: 'NODO360-0000-00000000' })
  ok(!error && (Array.isArray(data) ? data.length === 0 : !data), 'un numero inventado devuelve vacio, no error')
}
{
  const { data, error } = await anon.rpc('curso_visible', { p_course_id: cursos.find((c) => c.status === 'published').id })
  ok(!error && data === true, `curso_visible(publicado) -> ${error ? error.code : data}`)
}
if (noPub.length) {
  const { data, error } = await anon.rpc('curso_visible', { p_course_id: noPub[0].id })
  ok(!error && data === false, `curso_visible(${noPub[0].status}) sin sesion -> ${error ? error.code : data}`)
}

// ---------------------------------------------------------------- fila propia

console.log('')
console.log('=== la fila propia: mi_perfil() ===')
{
  // La 049 concede EXECUTE solo a authenticated y service_role, asi que a
  // anon le corresponde 42501, no una lista vacia. La expectativa anterior
  // (0 filas sin error) estaba mal escrita y marcaba en rojo el buen estado.
  const { error } = await anon.rpc('mi_perfil')
  ok(error?.code === '42501' || error?.code === 'PGRST202',
    `mi_perfil() sin sesion -> ${error ? 'denegada (' + error.code + ')' : 'RESPONDE, y no deberia'}`)
}
console.log('  (con sesion se prueba desde la aplicacion: /dashboard/perfil)')

console.log(`\n${fallos === 0 ? '=== TODO CORRECTO ===' : `=== ${fallos} COMPROBACIONES FALLIDAS ===`}`)
process.exit(fallos === 0 ? 0 : 1)
