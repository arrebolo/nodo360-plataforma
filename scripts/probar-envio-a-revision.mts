/**
 * El envío a revisión, de punta a punta.
 *
 *   npx tsx scripts/probar-envio-a-revision.mts [http://localhost:3132]
 *
 * EL FALLO BLOQUEANTE
 *   El formulario del instructor no tenía campo de especialidad, así que el curso se
 *   creaba sin `specialty_id` y al enviar a revisión el servidor respondía «Este curso
 *   no tiene especialidad asignada» — un error imposible de arreglar desde la
 *   interfaz, y que además solo se veía en la consola. El checklist decía 7/7.
 *
 * Se comprueban las tres cosas que importan:
 *   1. sin especialidad, el envío se rechaza y DICE por qué
 *   2. con la especialidad en la que está verificado, el envío funciona
 *   3. un instructor no puede publicar, aunque la vista previa le ofreciera un botón
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const REF = new URL(URL_BASE).hostname.split('.')[0]
const SITIO = process.argv[2] ?? 'http://localhost:3132'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-envio'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  // ── Montaje: instructor CON verificacion aprobada ─────────────────────────
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor', full_name: 'Instructor de prueba' }).eq('id', u!.user.id)

  const { data: esp } = await svc.from('instructor_specialties')
    .select('id, slug, nombre, requiere_acreditacion').eq('slug', 'ethereum-contratos').single()

  const { error: ecert } = await svc.from('instructor_certifications').insert({
    user_id: u!.user.id, specialty_id: esp!.id, status: 'aprobada',
    certification_number: `${MARCA}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })
  if (ecert) throw new Error(`verificacion: ${ecert.message}`)

  // ── Lo que ve el formulario ───────────────────────────────────────────────
  const { misEspecialidadesVerificadas } = await import('../lib/instructor/mis-especialidades.ts')
  const mias = await misEspecialidadesVerificadas(u!.user.id)
  di(mias.length === 1 && mias[0].slug === 'ethereum-contratos',
    'el formulario ofrece solo la especialidad verificada',
    mias.map((m) => m.slug).join(', ') || 'ninguna')
  di(mias[0]?.requiereJurisdiccion === false,
    'y sabe que esta no se verifica por pais (no pide jurisdiccion)')

  const sinNada = await misEspecialidadesVerificadas(creado.usuarios[0] === u!.user.id ? u!.user.id : u!.user.id)
  di(sinNada.length === 1, 'se lee igual al repetir la consulta')

  // Un curso completo, pero SIN especialidad
  const { data: c, error: ec } = await svc.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner', status: 'draft',
    is_free: true, is_certifiable: false,
    description: 'Una descripcion suficientemente larga para pasar el checklist.',
    instructor_id: u!.user.id, owner_id: u!.user.id,
  }).select('id').single()
  if (ec) throw new Error(ec.message)
  creado.cursos.push(c!.id)
  const { data: mod } = await svc.from('modules')
    .insert({ course_id: c!.id, title: 'Modulo 1', order_index: 1 }).select('id').single()
  const { error: el2 } = await svc.from('lessons').insert({
    module_id: mod!.id, course_id: c!.id, title: 'Leccion 1',
    slug: `${MARCA}-l-${Date.now()}`, order_index: 1, content: '<p>contenido</p>',
  })
  if (el2) throw new Error(`leccion: ${el2.message}`)

  const cliente = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: s, error: elog } = await cliente.auth.signInWithPassword({
    email: u!.user.email as string, password: CLAVE,
  })
  if (elog) throw new Error(elog.message)
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`

  // ── 1. Sin especialidad: rechazado, y con motivo ──────────────────────────
  console.log('\n=== sin especialidad ===')
  const sinEsp = await fetch(`${SITIO}/api/instructor/courses/${c!.id}/submit-review`, {
    method: 'POST', headers: { Cookie: cookie },
  })
  const cuerpoSinEsp = await sinEsp.json().catch(() => ({}))
  di(sinEsp.status === 400 || sinEsp.status === 422,
    'el envio se rechaza', `${sinEsp.status}`)
  di(String((cuerpoSinEsp as { error?: string }).error ?? '').includes('especialidad'),
    'y el motivo viene en la respuesta, no solo en la consola',
    String((cuerpoSinEsp as { error?: string }).error ?? '').slice(0, 70))

  // ── 2. Con la especialidad puesta: funciona ───────────────────────────────
  console.log('\n=== con la especialidad verificada ===')
  await svc.from('courses').update({ specialty_id: esp!.id }).eq('id', c!.id)
  const conEsp = await fetch(`${SITIO}/api/instructor/courses/${c!.id}/submit-review`, {
    method: 'POST', headers: { Cookie: cookie },
  })
  const cuerpoConEsp = await conEsp.json().catch(() => ({}))
  di(conEsp.status === 200, 'el envio funciona', `${conEsp.status} ${JSON.stringify(cuerpoConEsp).slice(0, 70)}`)

  const { data: tras } = await svc.from('courses').select('status').eq('id', c!.id).single()
  di(tras?.status === 'pending_review', 'y el curso queda pendiente de revision', String(tras?.status))

  // ── 3. Un instructor no publica ───────────────────────────────────────────
  console.log('\n=== publicar, que la vista previa ofrecia con un boton ===')
  const publicar = await fetch(`${SITIO}/api/instructor/courses/${c!.id}/status`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'published' }),
  })
  const cuerpoPub = await publicar.json().catch(() => ({}))
  di(publicar.status === 403, 'el servidor lo rechaza con 403',
    `${publicar.status} ${String((cuerpoPub as { error?: string }).error ?? '').slice(0, 60)}`)

  const { data: sigue } = await svc.from('courses').select('status').eq('id', c!.id).single()
  di(sigue?.status !== 'published', 'y el curso no se publico', String(sigue?.status))
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('course_reviews').delete().eq('course_id', id)
    await svc.from('lessons').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('lessons_publicadas').delete().eq('course_id', id)
    await svc.from('modules_publicados').delete().eq('course_id', id)
    await svc.from('courses_publicados').delete().eq('id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    await svc.auth.admin.deleteUser(id)
  }
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  di((count ?? 0) === 0, 'no queda nada', `cursos ${count ?? 0}`)
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
