/**
 * ¿Puede un instructor borrar published_at de su propio curso?
 *
 *   npx tsx scripts/medir-si-se-puede-borrar-la-fecha-de-publicacion.mts
 *
 * published_at es la condición de los triggers de la 114 y la 115: miran
 * `published_at IS NOT NULL` para saber si un curso estuvo publicado alguna vez. Si
 * su autor puede ponerla a NULL, las dos protecciones se apagan con un UPDATE.
 *
 * Importa medirlo por PostgREST y no solo leer la ruta: la ruta se puede arreglar,
 * pero PostgREST es alcanzable directamente con la clave anon, que es pública.
 *
 * Todo con datos de usar y tirar, y se borra al terminar.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-fecha'
const CLAVE = 'Medir-' + Math.random().toString(36).slice(2) + 'K3!'
const di = (ok: boolean | null, t: string, extra = '') =>
  console.log(`   ${ok === null ? '·   ' : ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

try {
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', u!.user.id)

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: otraEsp } = await svc.from('instructor_specialties').select('id').eq('slug', 'fiscalidad').single()

  const fecha = new Date().toISOString()
  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'published',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
    instructor_id: u!.user.id, owner_id: u!.user.id, published_at: fecha,
  }).select('id, published_at').single()
  if (ec) throw new Error(ec.message)
  creado.cursos.push(c!.id)
  di(c!.published_at !== null, 'curso publicado de prueba, con fecha', String(c!.published_at).slice(0, 19))

  const comoAutor = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { error: el } = await comoAutor.auth.signInWithPassword({ email: u!.user.email as string, password: CLAVE })
  if (el) throw new Error(el.message)

  // ── 1. La protección de la 114, con la fecha puesta ──────────────────────
  const recalificar = await comoAutor.from('courses')
    .update({ specialty_id: otraEsp!.id }).eq('id', c!.id).select('id')
  di(Boolean(recalificar.error), 'con published_at puesta, la 114 bloquea recalificar',
    recalificar.error ? `${recalificar.error.code}: bloqueado` : '*** PASO')

  // ── 2. ¿Puede borrar la fecha? ───────────────────────────────────────────
  const borrar = await comoAutor.from('courses')
    .update({ published_at: null }).eq('id', c!.id).select('id, published_at')
  const seBorro = !borrar.error && (borrar.data?.length ?? 0) === 1
  di(!seBorro, 'el autor NO puede borrar published_at por PostgREST',
    borrar.error ? `${borrar.error.code}: ${borrar.error.message.slice(0, 55)}`
      : seBorro ? '*** BORRADA: las dos protecciones se apagan con esto' : '0 filas')

  // ── 3. Si la borró, ¿queda libre para recalificar? ───────────────────────
  if (seBorro) {
    const despues = await comoAutor.from('courses')
      .update({ specialty_id: otraEsp!.id }).eq('id', c!.id).select('id')
    di(Boolean(despues.error), 'y despues de borrarla, la 114 sigue bloqueando',
      despues.error ? `${despues.error.code}: bloqueado` : '*** PASO: el atajo funciona de punta a punta')
  }

  // ── 4. ¿Y poner el curso en draft? ───────────────────────────────────────
  const aBorrador = await comoAutor.from('courses')
    .update({ status: 'draft' }).eq('id', c!.id).select('id, status')
  di(null, 'el autor pone su curso publicado en draft',
    aBorrador.error ? `${aBorrador.error.code}: no puede` : `${aBorrador.data?.length ?? 0} filas: si puede`)
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) await svc.from('courses').delete().eq('id', id)
  for (const id of creado.usuarios) await svc.auth.admin.deleteUser(id)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos con la marca: ${count ?? 0}`)
}
