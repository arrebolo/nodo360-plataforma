/**
 * Qué puede hacer un instructor por /api/admin, y con los cursos de otros.
 *
 *   npx tsx scripts/medir-api-admin-con-instructor.mts [http://localhost:3130]
 *
 * Tres cosas:
 *   1. las rutas que admiten rol instructor: ¿comprueban de quién es el curso?
 *   2. los GET de esas rutas: ¿comprueban algo?
 *   3. requireAdmin en una ruta de API: ¿devuelve 403 o REDIRIGE?
 *
 * Se escribe de verdad sobre el curso de OTRO instructor para que la respuesta no
 * dependa de leer el código. Todo se deshace al terminar.
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
const REF = new URL(URL_BASE).hostname.split('.')[0]
const SITIO = process.argv[2] ?? 'http://localhost:3130'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-apiadmin'
const CLAVE = 'Medir-' + Math.random().toString(36).slice(2) + 'K3!'
const di = (t: string, v: string) => console.log(`   ${t.padEnd(58)} ${v}`)

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

async function instructor(nombre: string) {
  const { data, error } = await svc.auth.admin.createUser({
    email: `${MARCA}-${nombre}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(error.message)
  creado.usuarios.push(data.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', data.user.id)
  const c = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: s, error: el } = await c.auth.signInWithPassword({ email: data.user.email as string, password: CLAVE })
  if (el) throw new Error(el.message)
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`
  return { id: data.user.id, cookie }
}

async function pedir(ruta: string, cookie: string | null, opciones: RequestInit = {}) {
  const r = await fetch(`${SITIO}${ruta}`, {
    ...opciones,
    redirect: 'manual',
    headers: { ...(cookie ? { Cookie: cookie } : {}), 'Content-Type': 'application/json', ...(opciones.headers ?? {}) },
  })
  let cuerpo = ''
  try { cuerpo = JSON.stringify(await r.json()).slice(0, 70) } catch { /* sin json */ }
  return { estado: r.status, destino: r.headers.get('location'), cuerpo }
}

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  const mio = await instructor('mio')
  const otro = await instructor('otro')

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  const { data: ajeno } = await svc.from('courses').insert({
    slug: `${MARCA}-ajeno-${Date.now()}`, title: `${MARCA} ajeno`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
    instructor_id: otro.id, owner_id: otro.id,
  }).select('id, slug').single()
  creado.cursos.push(ajeno!.id)
  const { data: mod } = await svc.from('modules')
    .insert({ course_id: ajeno!.id, title: 'modulo ajeno', order_index: 1 }).select('id').single()

  // Una ruta de aprendizaje real, para que el POST no se rechace por el id
  const { data: ruta } = await svc.from('learning_paths').select('id, slug').limit(1).maybeSingle()
  console.log(`\n   curso ajeno: ${ajeno!.slug} (de otro instructor)`)
  console.log(`   ruta de aprendizaje real: ${ruta?.slug ?? '(ninguna)'}`)

  // ── 1. Los GET, sin comprobacion de rol en el codigo ─────────────────────
  console.log('\n=== los GET ===')
  di('GET /api/admin/learning-paths  (instructor)', JSON.stringify(await pedir('/api/admin/learning-paths', mio.cookie)))
  di('GET /api/admin/learning-paths  (SIN sesion)', JSON.stringify(await pedir('/api/admin/learning-paths', null)))
  di('GET .../courses/<ajeno>/paths  (instructor)', JSON.stringify(await pedir(`/api/admin/courses/${ajeno!.id}/paths`, mio.cookie)))
  di('GET .../courses/<ajeno>/paths  (SIN sesion)', JSON.stringify(await pedir(`/api/admin/courses/${ajeno!.id}/paths`, null)))

  // ── 2. ESCRIBIR en el curso de otro ──────────────────────────────────────
  console.log('\n=== escribir en la ruta del curso de OTRO instructor ===')
  if (ruta) {
    const puesto = await pedir(`/api/admin/courses/${ajeno!.id}/paths`, mio.cookie, {
      method: 'POST', body: JSON.stringify({ pathId: ruta.id, learning_path_id: ruta.id }),
    })
    di('POST .../paths del curso ajeno', JSON.stringify(puesto))

    const { count: asignadas } = await svc.from('learning_path_courses')
      .select('course_id', { count: 'exact', head: true }).eq('course_id', ajeno!.id)
    di('¿quedo asignado de verdad?', `${asignadas ?? 0} filas en learning_path_courses`)

    const quitado = await pedir(`/api/admin/courses/${ajeno!.id}/paths?pathId=${ruta.id}`, mio.cookie, { method: 'DELETE' })
    di('DELETE .../paths del curso ajeno', JSON.stringify(quitado))
  }

  const contados = await pedir(`/api/admin/courses/${ajeno!.id}/refresh-counts`, mio.cookie, { method: 'POST' })
  di('POST .../refresh-counts del curso ajeno', JSON.stringify(contados))

  // ── 3. Crear una ruta de aprendizaje siendo instructor ───────────────────
  console.log('\n=== crear una ruta de aprendizaje (estructura de la plataforma) ===')
  const creada = await pedir('/api/admin/learning-paths', mio.cookie, {
    method: 'POST',
    body: JSON.stringify({ name: `${MARCA} ruta`, slug: `${MARCA}-ruta-${Date.now()}`, description: 'prueba' }),
  })
  di('POST /api/admin/learning-paths (instructor)', JSON.stringify(creada))
  const { count: rutas } = await svc.from('learning_paths')
    .select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di('¿se creo?', `${rutas ?? 0} rutas con la marca`)
  if (rutas) await svc.from('learning_paths').delete().like('slug', `${MARCA}%`)

  // ── 4. requireAdmin en una ruta de API: 403 o redireccion ────────────────
  console.log('\n=== requireAdmin en rutas de API ===')
  di('DELETE /api/admin/modules/<id> (instructor)',
    JSON.stringify(await pedir(`/api/admin/modules/${mod!.id}`, mio.cookie, { method: 'DELETE' })))
  di('DELETE /api/admin/courses/<ajeno> (instructor)',
    JSON.stringify(await pedir(`/api/admin/courses/${ajeno!.id}`, mio.cookie, { method: 'DELETE' })))
  di('POST /api/admin/modules/reorder (instructor)',
    JSON.stringify(await pedir('/api/admin/modules/reorder', mio.cookie, {
      method: 'POST', body: JSON.stringify({ courseId: ajeno!.id, moduleIds: [mod!.id] }),
    })))
  di('GET /api/admin/metrics (instructor)', JSON.stringify(await pedir('/api/admin/metrics', mio.cookie)))
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('learning_path_courses').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  await svc.from('learning_paths').delete().like('slug', `${MARCA}%`)
  for (const id of creado.usuarios) await svc.auth.admin.deleteUser(id)
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di('no queda nada', `cursos ${count ?? 0}`)
}
