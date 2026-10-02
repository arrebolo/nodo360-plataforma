/**
 * El estado de un curso, en las pantallas de verdad.
 *
 *   npx tsx scripts/probar-el-estado-de-los-cursos.mts [http://localhost:3151]
 *
 * POR QUE SE SIRVEN LAS PAGINAS Y NO SE MIRAN LOS COMPONENTES
 *   La corrección anterior de los siete estados se escribió en
 *   `components/admin/CoursesList`, que no lo usa ninguna página: /admin/cursos monta
 *   CoursesGrid → CourseAdminCard. Compilaba, pasaba el CI y no cambiaba nada en
 *   pantalla. Lo único que lo habría cantado es pedir la página por HTTP y leer el HTML.
 *
 * ARRANCA EL SERVIDOR SIN WEBHOOKS. Una de las comprobaciones publica un curso con «no
 * anunciar»; si la casilla estuviera rota, anunciaría en Discord y en Telegram de
 * verdad. Con las variables vacías no hay a dónde enviar:
 *
 *   DISCORD_WEBHOOK_ANNOUNCEMENTS= DISCORD_WEBHOOK_NEWS= TELEGRAM_BOT_TOKEN= \
 *     npx next dev -p 3151
 *
 * La sesión de admin sale de `generateLink` sobre un admin QUE YA EXISTE: no se crea
 * ninguna cuenta de admin para probar, y está medido que generateLink no envía correo.
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
const SITIO = process.argv[2] ?? 'http://localhost:3151'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = 'qa-estado'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}
const galleta = (sesion: unknown) =>
  `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')}`

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

try {
  const vivo = await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0)
  if (!vivo) throw new Error(`no hay nada escuchando en ${SITIO}`)

  // ═══ El traductor, a solas ═══════════════════════════════════════════════
  console.log('\n=== lib/cursos/estado-visible ===')
  const { estadoVisibleDelCurso } = await import('../lib/cursos/estado-visible.ts')

  di(estadoVisibleDelCurso({ status: 'pending_review' }).etiqueta === 'Pendiente de revisión',
    'pending_review sin fecha: «Pendiente de revisión»')
  const revision = estadoVisibleDelCurso({ status: 'pending_review', published_at: '2026-01-01T00:00:00Z' })
  di(revision.etiqueta === 'Cambios pendientes de revisión' && revision.sigueVisible && revision.esperaRevision,
    'pending_review CON fecha: «Cambios pendientes de revisión» y lo publicado sigue visible',
    revision.etiqueta)
  di(estadoVisibleDelCurso({ status: 'pending_review' }, { para: 'autor' }).etiqueta === 'En revisión',
    'para su autor, «En revisión»')
  // LA REGLA QUE IMPORTA: un estado desconocido se dice, no se disfraza de borrador.
  const raro = estadoVisibleDelCurso({ status: 'estado_que_no_existe' })
  di(raro.clave === 'desconocido' && raro.etiqueta.includes('estado_que_no_existe'),
    'un estado desconocido se enseña tal cual, no cae en «Borrador»', raro.etiqueta)
  for (const s of ['draft', 'changes_requested', 'rejected', 'published', 'coming_soon', 'archived']) {
    const e = estadoVisibleDelCurso({ status: s })
    di(e.clave === s && e.etiqueta !== 'Borrador' || s === 'draft', `${s} tiene su propia etiqueta`, e.etiqueta)
  }

  // ═══ Montaje ══════════════════════════════════════════════════════════════
  const correo = `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor', full_name: 'Instructora de prueba' }).eq('id', u!.user.id)

  const { data: esp } = await svc.from('instructor_specialties')
    .select('id, slug').eq('slug', 'ethereum-contratos').single()
  await svc.from('instructor_certifications').insert({
    user_id: u!.user.id, specialty_id: esp!.id, status: 'aprobada',
    certification_number: `${MARCA}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })

  const slug = `${MARCA}-${Date.now()}`
  const { data: c, error: ec } = await svc.from('courses').insert({
    title: 'PRUEBA estado de los cursos', slug, description: 'Curso de prueba del estado.',
    level: 'beginner', status: 'draft', is_free: true, instructor_id: u!.user.id,
    specialty_id: esp!.id,
  }).select('id, slug').single()
  if (ec) throw new Error(`curso: ${ec.message}`)
  creado.cursos.push(c!.id)

  const { data: m } = await svc.from('modules').insert({
    course_id: c!.id, title: 'Módulo de prueba', order_index: 1,
  }).select('id').single()
  await svc.from('lessons').insert({
    course_id: c!.id, module_id: m!.id, title: 'Lección de prueba',
    slug: `${slug}-l1`, order_index: 1, content: 'Contenido de prueba.',
  })

  // ═══ La zona del instructor, servida ══════════════════════════════════════
  const cliente = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { data: s, error: elog } = await cliente.auth.signInWithPassword({
    email: correo, password: CLAVE,
  })
  if (elog || !s.session) throw new Error(`sesion de instructor: ${elog?.message}`)
  const galletaInstructora = galleta(s.session)

  const pedir = async (ruta: string, cookie: string) => {
    const r = await fetch(`${SITIO}${ruta}`, { headers: { Cookie: cookie }, redirect: 'manual' })
    return { status: r.status, destino: r.headers.get('location'), html: r.status === 200 ? await r.text() : '' }
  }

  console.log('\n=== /dashboard/instructor/cursos (sesión de instructora) ===')
  let lista = await pedir('/dashboard/instructor/cursos', galletaInstructora)
  di(lista.status === 200, 'la lista responde 200', String(lista.status))
  di(lista.html.includes('PRUEBA estado de los cursos'), 'y trae el curso de prueba')
  di(lista.html.includes('Borrador'), 'en borrador dice «Borrador»')

  // Enviado a revision, sin haberse publicado nunca
  await svc.from('courses').update({ status: 'pending_review' }).eq('id', c!.id)
  lista = await pedir('/dashboard/instructor/cursos', galletaInstructora)
  di(lista.html.includes('En revisión'), 'enviado a revisión dice «En revisión»')
  di(!lista.html.includes('Cambios pendientes de revisión'),
    'y NO dice «Cambios pendientes de revisión», porque nunca se publicó')

  // EL CASO DEL FALLO: publicado y con cambios esperando revision
  await svc.from('courses').update({ published_at: new Date().toISOString() }).eq('id', c!.id)
  lista = await pedir('/dashboard/instructor/cursos', galletaInstructora)
  di(lista.html.includes('Cambios pendientes de revisión'),
    'publicado y reenviado: «Cambios pendientes de revisión»')
  di(lista.html.includes('Lo publicado sigue visible'),
    'y le dice a su autora que lo publicado sigue visible')

  const editor = await pedir(`/dashboard/instructor/cursos/${c!.id}`, galletaInstructora)
  di(editor.status === 200, 'el editor responde 200', String(editor.status))
  di(editor.html.includes('Cambios pendientes de revisión'),
    'el editor dice lo mismo que la lista')
  di(!editor.html.includes('Pendiente de aprobación'),
    'y ya no dice «Pendiente de aprobación», que escondía el caso')

  // ═══ La zona de administracion, servida ═══════════════════════════════════
  // Sobre un admin QUE YA EXISTE. No se crea ninguna cuenta de admin.
  const { data: admins } = await svc.from('users').select('id, email').eq('role', 'admin').limit(1)
  if (!admins?.length) throw new Error('no hay ningun admin en la base')
  const { data: enlace, error: eEnlace } = await svc.auth.admin.generateLink({
    type: 'magiclink', email: admins[0].email as string,
  })
  if (eEnlace) throw new Error(`enlace de admin: ${eEnlace.message}`)
  const { data: sa, error: eva } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.verifyOtp({ token_hash: enlace!.properties!.hashed_token, type: 'magiclink' })
  if (eva || !sa.session) throw new Error(`sesion de admin: ${eva?.message}`)
  const galletaAdmin = galleta(sa.session)

  console.log('\n=== /admin/cursos (sesión de admin) ===')
  const admin = await pedir('/admin/cursos', galletaAdmin)
  di(admin.status === 200, 'responde 200', String(admin.status))
  di(admin.html.includes('PRUEBA estado de los cursos'), 'trae el curso de prueba')
  di(admin.html.includes('Cambios pendientes de revisión'),
    'y lo pinta como «Cambios pendientes de revisión»')
  di(!/>\s*pending_review\s*</.test(admin.html),
    'ya no enseña el valor crudo «pending_review»')
  di(admin.html.includes(`/admin/cursos/pendientes/${c!.id}`),
    'y da acceso a revisarlo desde la propia tarjeta')

  console.log('\n=== /admin/cursos/pendientes ===')
  const pend = await pedir('/admin/cursos/pendientes', galletaAdmin)
  di(pend.status === 200, 'responde 200', String(pend.status))
  di(pend.html.includes('PRUEBA estado de los cursos'), 'el curso aparece en la lista de pendientes')
  di(pend.html.includes('Cambios pendientes de revisión'), 'con su estado real')
  di(pend.html.includes('la versión publicada sigue visible'),
    'y avisa de que la versión publicada sigue visible')

  console.log('\n=== /admin/cursos/pendientes/[id] ===')
  const rev = await pedir(`/admin/cursos/pendientes/${c!.id}`, galletaAdmin)
  di(rev.status === 200, 'responde 200', String(rev.status))
  di(rev.html.includes('name="no_anunciar"'), 'la casilla «No anunciar» está en el formulario de aprobar')
  di(rev.html.includes('No anunciar en Discord ni en Telegram'), 'y se lee')
  di(rev.html.includes('Este curso ya está publicado'),
    'avisa de que lo que se revisa son cambios de algo publicado')

  console.log('\n=== /admin/cursos/[id]: la otra pantalla que publica ===')
  const uno = await pedir(`/admin/cursos/${c!.id}`, galletaAdmin)
  di(uno.status === 200, 'responde 200', String(uno.status))
  di(uno.html.includes('Publicar curso') || uno.html.includes('Despublicar'),
    'tiene el botón de publicar')

  // Y que «no anunciar» llegue hasta el fondo. El servidor arranca sin webhooks, asi
  // que ni roto podria anunciar nada de verdad.
  await svc.from('courses').update({ status: 'draft', published_at: null }).eq('id', c!.id)
  const publicado = await fetch(`${SITIO}/api/admin/courses/${c!.id}/publish`, {
    method: 'POST',
    headers: { Cookie: galletaAdmin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: true, noAnunciar: true }),
  })
  const cuerpo = await publicado.json().catch(() => ({}))
  di(publicado.status === 200 && cuerpo.success === true,
    'publicar con noAnunciar funciona', `${publicado.status} ${JSON.stringify(cuerpo).slice(0, 90)}`)
  const { data: tras } = await svc.from('courses').select('status, published_at').eq('id', c!.id).maybeSingle()
  di(tras?.status === 'published' && Boolean(tras?.published_at),
    'el curso queda publicado y con fecha', `${tras?.status} / ${tras?.published_at ?? 'null'}`)

  // ═══ Y que negar una ruta no cierre la sesion ═════════════════════════════
  console.log('\n=== la instructora no entra en /admin/cursos ===')
  const negado = await pedir('/admin/cursos', galletaInstructora)
  di(negado.status === 307 || negado.status === 302,
    'se le niega con una redirección', `${negado.status} -> ${negado.destino ?? ''}`)
  const despues = await pedir('/dashboard/instructor/cursos', galletaInstructora)
  di(despues.status === 200, 'y su sesión sigue viva después', String(despues.status))
} catch (e) {
  fallos++
  console.log(`\n   EXPLOTO: ${e instanceof Error ? e.message : String(e)}`)
} finally {
  // ═══ Limpieza, y la cuenta de una fila ═══════════════════════════════════
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('learning_path_courses').delete().eq('course_id', id)
    await svc.from('courses').update({ status: 'draft', published_at: null }).eq('id', id)
    const { error } = await svc.from('courses').delete().eq('id', id)
    console.log(`   curso ${id.slice(0, 8)}: ${error ? error.message : 'borrado'}`)
    // El espejo de la 117 RETIRA, no borra: correcto para un curso de verdad, pero un
    // curso de prueba no puede quedarse en el registro. Se borra a mano.
    await svc.from('lessons_publicadas').delete().eq('course_id', id)
    await svc.from('modules_publicados').delete().eq('course_id', id)
    const { error: ee } = await svc.from('courses_publicados').delete().eq('id', id)
    console.log(`   espejo ${id.slice(0, 8)}: ${ee ? ee.message : 'sin rastro'}`)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    const { error } = await svc.auth.admin.deleteUser(id)
    console.log(`   usuario ${id.slice(0, 8)}: ${error ? error.message : 'borrado'}`)
  }

  const { count: cursosDePrueba } = await svc.from('courses')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA %').limit(0)
  const { count: enElEspejo } = await svc.from('courses_publicados')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA %').limit(0)
  const { count: cuentasDePrueba } = await svc.from('users')
    .select('id', { count: 'exact' }).ilike('email', `${MARCA}-%`).limit(0)

  console.log(
    `\nfallos ${fallos}, cursos_de_prueba ${cursosDePrueba ?? 0}, ` +
    `de_prueba_en_el_espejo ${enElEspejo ?? 0}, cuentas_de_prueba ${cuentasDePrueba ?? 0}`
  )
  console.log(
    fallos === 0 && (cursosDePrueba ?? 0) === 0 && (enElEspejo ?? 0) === 0 && (cuentasDePrueba ?? 0) === 0
      ? 'TODO CORRECTO\n' : 'REVISAR\n'
  )
  process.exit(fallos === 0 ? 0 : 1)
}
