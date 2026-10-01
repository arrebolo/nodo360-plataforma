/**
 * El bucle de «pedir cambios», de punta a punta salvo el botón del admin.
 *
 *   npx tsx scripts/probar-pedir-cambios.mts [http://localhost:3123]
 *
 * QUE SE PRUEBA Y QUE NO
 *   La acción del admin es un server action y necesita una sesión de admin. NO se
 *   crea un administrador de prueba: dar el rol admin a una cuenta, aunque sea un
 *   minuto, es un privilegio real en producción. Así que aquí se pone el estado con
 *   el cliente de servicio —igual que hace la acción— y se prueba todo lo demás:
 *   que la base acepta el estado, que el instructor puede reenviar desde él, y que
 *   su pantalla se sirve con el comentario a la vista.
 *
 *   Esa es justo la mitad que estaba rota: el estado existía en el enum y en las
 *   etiquetas, pero nada lo ponía y la pantalla de detalle no lo entendía.
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
const SITIO = process.argv[2] ?? 'http://localhost:3123'

const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-cambios'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
const COMENTARIO = 'La leccion 2 del modulo 1 esta vacia y el objetivo de aprendizaje no dice que se lleva quien lo termine.'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

function cookieDeSesion(sesion: unknown): string {
  const valor = 'base64-' + Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')
  const nombre = `sb-${REF}-auth-token`
  const TROZO = 3180
  if (valor.length <= TROZO) return `${nombre}=${valor}`
  const trozos: string[] = []
  for (let i = 0, n = 0; i < valor.length; i += TROZO, n++) trozos.push(`${nombre}.${n}=${valor.slice(i, i + TROZO)}`)
  return trozos.join('; ')
}

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  // ── Montaje: un instructor y un curso en revisión ────────────────────────
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor' }).eq('id', u!.user.id)

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()

  // Una verificacion aprobada: sin ella, enviar a revision da 403 y con razon
  // —lo comprobo esta misma prueba antes de tenerla en cuenta—. La condicion la
  // pone puede_ensenar() de la 109: status 'aprobada', sin revocar y sin caducar.
  const { error: ecert } = await svc.from('instructor_certifications').insert({
    user_id: u!.user.id, specialty_id: esp!.id, status: 'aprobada',
    certification_number: `${MARCA}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })
  if (ecert) throw new Error(`no se pudo crear la verificacion de prueba: ${ecert.message}`)
  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'pending_review',
    is_free: true, is_certifiable: false, specialty_id: esp!.id,
    instructor_id: u!.user.id, owner_id: u!.user.id,
  }).select('id, status').single()
  if (ec) throw new Error(ec.message)
  creado.cursos.push(c!.id)
  di(c!.status === 'pending_review', 'curso de prueba en revision', c!.status)

  // Un modulo con una leccion: enviar a revision los exige, y con razon.
  const { data: mod } = await svc.from('modules')
    .insert({ course_id: c!.id, title: 'Modulo de prueba', order_index: 1 }).select('id').single()
  const { error = null } = await svc.from('lessons').insert({
    module_id: mod!.id, course_id: c!.id, title: 'Leccion de prueba',
    slug: `${MARCA}-l-${Date.now()}`, order_index: 1, content: '<p>contenido de prueba</p>',
  })
  if (error) throw new Error(`no se pudo crear la leccion de prueba: ${error.message}`)

  // ── 1. ¿Acepta la base el estado? Ningun trigger lo reescribe ────────────
  const puesto = await svc.from('courses')
    .update({ status: 'changes_requested', rejection_reason: COMENTARIO, updated_at: new Date().toISOString() })
    .eq('id', c!.id).select('status, rejection_reason').single()
  di(!puesto.error && puesto.data?.status === 'changes_requested',
    'la base acepta status=changes_requested y no lo reescribe',
    puesto.error ? `${puesto.error.code}: ${puesto.error.message.slice(0, 60)}` : String(puesto.data?.status))
  di(puesto.data?.rejection_reason === COMENTARIO, 'y guarda el comentario tal cual',
    `${(puesto.data?.rejection_reason ?? '').length} caracteres`)

  // ── 2. La pantalla del instructor, servida de verdad ─────────────────────
  const cookie = cookieDeSesion(
    (await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
      .auth.signInWithPassword({ email: u!.user.email as string, password: CLAVE })).data.session
  )
  const pantalla = await fetch(`${SITIO}/dashboard/instructor/cursos/${c!.id}`, { headers: { Cookie: cookie } })
  const html = await pantalla.text()
  di(pantalla.status === 200, 'la pantalla del curso se sirve', String(pantalla.status))
  di(html.includes('Cambios solicitados'), 'el badge dice «Cambios solicitados»')
  di(html.includes(COMENTARIO.slice(0, 40)), 'el comentario aparece en la pantalla')
  di(html.includes('Reenviar a revisi'), 'y hay boton para reenviar')

  // ── 3. El instructor reenvia, y vuelve a revisión ────────────────────────
  const reenvio = await fetch(`${SITIO}/api/instructor/courses/${c!.id}/submit-review`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
  })
  const cuerpo = await reenvio.json().catch(() => ({}))
  di(reenvio.status === 200, 'el instructor puede reenviar desde changes_requested',
    `${reenvio.status} ${JSON.stringify(cuerpo).slice(0, 90)}`)

  const { data: tras } = await svc.from('courses').select('status').eq('id', c!.id).single()
  di(tras?.status === 'pending_review', 'y el curso vuelve a pending_review', String(tras?.status))

  // ── 4. El correo escapa lo que escribe una persona ───────────────────────
  const { escapar } = await import('../lib/email/escapar.ts')
  di(escapar('<b>x</b> & "y"') === '&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;',
    'escapar() cierra las etiquetas del comentario', escapar('<b>x</b>'))
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('course_reviews').delete().eq('course_id', id)
    await svc.from('lessons').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    await svc.from('notifications').delete().eq('user_id', id)
    await svc.auth.admin.deleteUser(id)
  }
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos con la marca: ${count ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
