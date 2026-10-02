/**
 * El certificado de quien llega al 100 % por un borrado.
 *
 *   npx tsx scripts/probar-el-certificado-tras-un-borrado.mts [http://localhost:3151]
 *
 * EL HUECO
 *   El certificado se emitía en dos momentos: al marcar la última lección
 *   (app/api/progress) y al aprobar el examen (app/api/quiz/submit). Quien aprueba el
 *   examen y llega al 100 % MAS TARDE y por otro camino —porque se borró la lección que
 *   le faltaba, que desde la #307 recalcula las matrículas— no vuelve a pasar por
 *   ninguno de los dos. `/api/certificates/generate` existía, pero NO LO LLAMABA NADIE:
 *   cumplía las condiciones y no tenía forma de pedirlo.
 *
 *   Y el aviso de «ya lo terminaste» de la ficha, con el examen aprobado y sin
 *   certificado, no ofrecía nada: un callejón sin salida.
 *
 * LO QUE SE COMPRUEBA, de punta a punta y con sesión de alumna:
 *   1. con el examen aprobado y 1 de 2 lecciones, el borrado la pone a 100 %
 *   2. la ficha del curso ofrece emitirlo, y su panel lo lista
 *   3. emitirlo funciona, y después la ficha enseña el certificado y ya no el botón
 *   4. sin aprobar el examen, no se ofrece y el servidor lo rechaza
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

const MARCA = 'qa-certificado'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
const galleta = (sesion: unknown) =>
  `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')}`
const sinComentariosHtml = (html: string) => html.replace(/<!--[\s\S]*?-->/g, '')

/**
 * El trozo de HTML de la seccion «listos para emitir».
 *
 * Buscar «listo para emitir» en toda la pagina no sirve: el encabezado es singular con
 * uno y plural con dos, y el titulo de un curso sale tambien en la lista de certificados
 * ya emitidos. Las comprobaciones tienen que mirar DENTRO de la seccion.
 */
const bloqueDeListos = (html: string) => {
  const k = html.indexOf('para emitir')
  if (k === -1) return ''
  const fin = html.indexOf('</ul>', k)
  return html.slice(k, fin === -1 ? Math.min(k + 4000, html.length) : fin)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

const pedirUnaVez = async (ruta: string, o: { cookie?: string; metodo?: string; cuerpo?: unknown } = {}) => {
  const r = await fetch(`${SITIO}${ruta}`, {
    method: o.metodo ?? 'GET',
    headers: {
      ...(o.cookie ? { Cookie: o.cookie } : {}),
      ...(o.cuerpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: o.cuerpo ? JSON.stringify(o.cuerpo) : undefined,
    redirect: 'manual',
  })
  const texto = await r.text()
  let json: Record<string, unknown> = {}
  try { json = JSON.parse(texto) } catch { /* no era json */ }
  return { status: r.status, json, texto: sinComentariosHtml(texto) }
}
const pedir = async (ruta: string, o: { cookie?: string; metodo?: string; cuerpo?: unknown } = {}) => {
  for (let i = 0; i < 4; i++) {
    const r = await pedirUnaVez(ruta, o)
    if (r.status !== 429) return r
    console.log(`   (429 en ${ruta}: esperando 20 s)`)
    await esperar(20000)
  }
  return pedirUnaVez(ruta, o)
}

async function cuenta(sufijo: string, rol: string) {
  const correo = `${MARCA}-${sufijo}-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(error.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: rol, full_name: `Prueba ${sufijo}` }).eq('id', u!.user.id)
  const { data: s, error: elog } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email: correo, password: CLAVE })
  if (elog || !s.session) throw new Error(`sesion ${sufijo}: ${elog?.message}`)
  return { id: u!.user.id, correo, cookie: galleta(s.session) }
}

try {
  if (!(await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0))) {
    throw new Error(`no hay nada escuchando en ${SITIO}`)
  }

  const { data: esp } = await svc.from('instructor_specialties')
    .select('id').eq('slug', 'ethereum-contratos').single()

  const instructor = await cuenta('instructor', 'instructor')
  await svc.from('instructor_certifications').insert({
    user_id: instructor.id, specialty_id: esp!.id, status: 'aprobada',
    certification_number: `${MARCA}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })
  const alumna = await cuenta('alumna', 'student')
  const otra = await cuenta('sinexamen', 'student')

  // Sesión de admin sobre un admin que ya existe, para publicar por la API.
  const { data: admins } = await svc.from('users').select('email').eq('role', 'admin').limit(1)
  const { data: enlace } = await svc.auth.admin.generateLink({
    type: 'magiclink', email: admins![0].email as string,
  })
  const { data: sa } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.verifyOtp({ token_hash: enlace!.properties!.hashed_token, type: 'magiclink' })
  const cookieAdmin = galleta(sa!.session)

  // ── El curso: un módulo, dos lecciones y examen ───────────────────────────
  const slug = `${MARCA}-${Math.random().toString(36).slice(2, 8)}`
  const { data: c, error: ec } = await svc.from('courses').insert({
    title: 'PRUEBA certificado tras borrado', slug,
    description: 'Curso de prueba del certificado.', long_description: 'x'.repeat(220),
    level: 'beginner', is_free: true, status: 'draft',
    instructor_id: instructor.id, specialty_id: esp!.id,
    thumbnail_url: 'https://example.invalid/x.png',
  }).select('id, slug').single()
  if (ec) throw new Error(`curso: ${ec.message}`)
  creado.cursos.push(c!.id)

  const { data: m } = await svc.from('modules')
    .insert({ course_id: c!.id, title: 'Módulo 1', order_index: 0 }).select('id').single()
  const lecciones: { id: string; slug: string }[] = []
  for (const j of [0, 1]) {
    const sl = `${slug}-l${j}`
    const { data: l, error: el } = await svc.from('lessons').insert({
      course_id: c!.id, module_id: m!.id, title: `Lección ${j + 1}`,
      slug: sl, order_index: j, content: 'Contenido de prueba.',
    }).select('id').single()
    if (el) throw new Error(`leccion: ${el.message}`)
    lecciones.push({ id: l!.id, slug: sl })
  }

  const { error: eq } = await svc.from('quiz_questions').insert({
    module_id: m!.id, question: '¿Pregunta de prueba?',
    options: ['a', 'b', 'c', 'd'], correct_answer: 0, order_index: 0,
  })
  di(!eq, 'el curso tiene examen (una pregunta)', eq?.message ?? '')

  const publicado = await pedir(`/api/admin/courses/${c!.id}/publish`, {
    cookie: cookieAdmin, metodo: 'POST', cuerpo: { force: true, noAnunciar: true },
  })
  di(publicado.status === 200, 'el curso se publica', String(publicado.status))

  // ── Un SEGUNDO curso, también listo, para probar el filtro por curso ─────
  const slug2 = `${MARCA}-otro-${Math.random().toString(36).slice(2, 8)}`
  const { data: c2, error: ec2 } = await svc.from('courses').insert({
    title: 'PRUEBA certificado otro curso', slug: slug2,
    description: 'El otro.', long_description: 'x'.repeat(220),
    level: 'beginner', is_free: true, status: 'draft',
    instructor_id: instructor.id, specialty_id: esp!.id,
    thumbnail_url: 'https://example.invalid/x.png',
  }).select('id, slug').single()
  if (ec2) throw new Error(`curso 2: ${ec2.message}`)
  creado.cursos.push(c2!.id)
  const { data: m2 } = await svc.from('modules')
    .insert({ course_id: c2!.id, title: 'Módulo', order_index: 0 }).select('id').single()
  await svc.from('lessons').insert({
    course_id: c2!.id, module_id: m2!.id, title: 'Lección',
    slug: `${slug2}-l0`, order_index: 0, content: 'x',
  })
  // Sin preguntas: un curso sin examen no exige examen. Y sin publicar: «listos para
  // emitir» no lo necesita —le basta la matricula al 100 %— y publicar exige minimos de
  // contenido que este curso de pega no cumple.

  // ── La alumna: examen aprobado y una lección de dos ───────────────────────
  console.log('\n=== el montaje: examen aprobado, 1 de 2 lecciones ===')
  for (const quien of [alumna, otra]) {
    await svc.from('course_enrollments').insert({
      user_id: quien.id, course_id: c!.id, progress_percentage: 50,
    })
    await svc.from('user_progress').insert({
      user_id: quien.id, lesson_id: lecciones[0].id, is_completed: true,
    })
  }

  // `answers` es NOT NULL (medido: 23502 sin ella), y la sonda de dos payloads no lo
  // habia cazado. El esquema completo, antes de los datos de prueba.
  await svc.from('course_enrollments').insert({
    user_id: alumna.id, course_id: c2!.id, progress_percentage: 100,
  })

  const { error: eIntento } = await svc.from('quiz_attempts').insert({
    user_id: alumna.id, module_id: m!.id, score: 100,
    total_questions: 1, correct_answers: 1, passed: true,
    answers: [], completed_at: new Date().toISOString(),
  })
  di(!eIntento, 'la alumna aprueba el examen final', eIntento?.message ?? '')

  const { count: certsAntes } = await svc.from('certificates')
    .select('id', { count: 'exact' }).eq('user_id', alumna.id).eq('course_id', c!.id).limit(0)
  di((certsAntes ?? 0) === 0, 'y todavía no tiene certificado: le falta una lección')

  // ── El borrado la pone a 100 % ────────────────────────────────────────────
  console.log('\n=== el instructor borra la lección que le faltaba ===')
  const borrada = await pedir(`/api/instructor/lessons/${lecciones[1].id}`, {
    cookie: instructor.cookie, metodo: 'DELETE',
  })
  di(borrada.status === 200, 'se borra: 200', String(borrada.status))

  const { data: matricula } = await svc.from('course_enrollments')
    .select('progress_percentage, completed_at')
    .eq('user_id', alumna.id).eq('course_id', c!.id).maybeSingle()
  di(matricula?.progress_percentage === 100, 'su matrícula pasa a 100 %', `${matricula?.progress_percentage} %`)
  di(matricula?.completed_at == null, 'y completed_at sigue sin tocarse (no certifica el recálculo)')

  // ── La ficha del curso se lo ofrece ───────────────────────────────────────
  console.log('\n=== la ficha del curso ===')
  const ficha = await pedir(`/cursos/${c!.slug}`, { cookie: alumna.cookie })
  di(ficha.status === 200, 'responde 200', String(ficha.status))
  di(ficha.texto.includes('tu certificado está listo para emitirse'),
    'dice que el certificado está listo')
  di(ficha.texto.includes('Emitir mi certificado'), 'y ofrece el botón de emitirlo')

  // ── Y su panel también ───────────────────────────────────────────────────
  console.log('\n=== su panel de certificados ===')
  const panel = await pedir('/dashboard/certificados', { cookie: alumna.cookie })
  di(panel.status === 200, 'responde 200', String(panel.status))
  di(bloqueDeListos(panel.texto) !== '', 'tiene la sección de listos para emitir')
  di(bloqueDeListos(panel.texto).includes('PRUEBA certificado tras borrado'),
    'y el curso está DENTRO de esa sección')

  // ── Emitirlo ─────────────────────────────────────────────────────────────
  console.log('\n=== emitirlo ===')
  const emitido = await pedir('/api/certificates/generate', {
    cookie: alumna.cookie, metodo: 'POST', cuerpo: { courseId: c!.id },
  })
  di(emitido.status === 200 && emitido.json.success === true,
    'se emite: 200', `${emitido.status} ${String(emitido.json.error ?? '')}`)

  const { data: cert } = await svc.from('certificates')
    .select('id, certificate_number, type').eq('user_id', alumna.id).eq('course_id', c!.id).maybeSingle()
  di(Boolean(cert?.certificate_number) && cert?.type === 'course',
    'y queda la fila con su número', cert?.certificate_number ?? 'ninguna')

  const fichaDespues = await pedir(`/cursos/${c!.slug}`, { cookie: alumna.cookie })
  di(fichaDespues.texto.includes('Ver tu certificado'), 'la ficha ya enseña el certificado')
  di(!fichaDespues.texto.includes('Emitir mi certificado'), 'y ya no ofrece emitirlo')

  const panelDespues = await pedir('/dashboard/certificados', { cookie: alumna.cookie })
  di(!bloqueDeListos(panelDespues.texto).includes('PRUEBA certificado tras borrado'),
    'el panel ya no lo lista como pendiente')
  di(panelDespues.texto.includes('PRUEBA certificado tras borrado'),
    'y lo lista como certificado, con el nombre del curso')
  di(!panelDespues.texto.includes('Aun no tienes certificados'),
    'y no dice que no tenga ninguno')

  const paginaDelCertificado = await pedir(`/certificados/${cert!.id}`, { cookie: alumna.cookie })
  di(paginaDelCertificado.status === 200, 'la pagina del certificado responde 200',
    String(paginaDelCertificado.status))
  di(paginaDelCertificado.texto.includes('PRUEBA certificado tras borrado'),
    'y trae el nombre del curso (el embed va al espejo)')

  const verificacion = await pedir(`/verificar/${cert!.certificate_number}`)
  di(verificacion.status === 200, 'la verificacion publica responde 200', String(verificacion.status))

  // Pedirlo dos veces no duplica nada
  const otraVez = await pedir('/api/certificates/generate', {
    cookie: alumna.cookie, metodo: 'POST', cuerpo: { courseId: c!.id },
  })
  const { count: cuantos } = await svc.from('certificates')
    .select('id', { count: 'exact' }).eq('user_id', alumna.id).eq('course_id', c!.id).limit(0)
  di(otraVez.status === 200 && (cuantos ?? 0) === 1,
    'pedirlo otra vez devuelve el mismo, no emite dos', `${otraVez.status}, ${cuantos} certificados`)

  // ── El filtro por curso llega a «listos para emitir» ─────────────────────
  console.log('\n=== el panel con ?curso=<slug> ===')
  const sinFiltro = await pedir('/dashboard/certificados', { cookie: alumna.cookie })
  di(bloqueDeListos(sinFiltro.texto).includes('PRUEBA certificado otro curso'),
    'sin filtro, el otro curso también sale como listo')

  const conFiltro = await pedir(`/dashboard/certificados?curso=${c2!.slug}`, { cookie: alumna.cookie })
  di(conFiltro.status === 200, 'con ?curso= responde 200', String(conFiltro.status))
  di(bloqueDeListos(conFiltro.texto).includes('PRUEBA certificado otro curso'),
    'y el curso filtrado sigue saliendo')
  di(!bloqueDeListos(conFiltro.texto).includes('PRUEBA certificado tras borrado'),
    'pero el que NO es del filtro ya no aparece en «listos para emitir»')

  // ── Un error de base NO es un 404 ────────────────────────────────────────
  console.log('\n=== la página del certificado: 404 solo si no existe ===')
  const inexistente = await pedir('/certificados/00000000-0000-0000-0000-000000000000', {
    cookie: alumna.cookie,
  })
  di(inexistente.status === 404, 'un certificado que no existe: 404', String(inexistente.status))

  // Un id que no es UUID hace fallar la consulta en la base (22P02): es un error, no
  // un «no existe», y no puede contestar 404.
  const idInvalido = await pedir('/certificados/no-es-un-uuid', { cookie: alumna.cookie })
  di(idInvalido.status !== 404, 'un id inválido NO contesta 404', String(idInvalido.status))
  di(idInvalido.texto.includes('No hemos podido leer tu certificado'),
    'sino la página de error, que dice que el certificado sigue siendo válido')

  // ── Sin aprobar el examen, nada ──────────────────────────────────────────
  console.log('\n=== la otra alumna, que no aprobó el examen ===')
  const { data: matriculaOtra } = await svc.from('course_enrollments')
    .select('progress_percentage').eq('user_id', otra.id).eq('course_id', c!.id).maybeSingle()
  di(matriculaOtra?.progress_percentage === 100, 'también está a 100 % por el borrado',
    `${matriculaOtra?.progress_percentage} %`)

  const fichaOtra = await pedir(`/cursos/${c!.slug}`, { cookie: otra.cookie })
  di(!fichaOtra.texto.includes('Emitir mi certificado'), 'a ella NO se le ofrece emitirlo')
  di(fichaOtra.texto.includes('el certificado') && fichaOtra.texto.includes('examen'),
    'y se le dice que el examen es la condición')

  const rechazado = await pedir('/api/certificates/generate', {
    cookie: otra.cookie, metodo: 'POST', cuerpo: { courseId: c!.id },
  })
  di(rechazado.status === 400 && String(rechazado.json.error ?? '').includes('examen'),
    'y el servidor lo rechaza por el examen',
    `${rechazado.status} ${String(rechazado.json.error ?? '')}`)

  const { count: certsOtra } = await svc.from('certificates')
    .select('id', { count: 'exact' }).eq('user_id', otra.id).limit(0)
  di((certsOtra ?? 0) === 0, 'sin certificado para ella')
} catch (e) {
  fallos++
  console.log(`\n   EXPLOTO: ${e instanceof Error ? e.message : String(e)}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('certificates').delete().eq('course_id', id)
    await svc.from('user_progress').delete().in(
      'lesson_id',
      ((await svc.from('lessons_publicadas').select('id').eq('course_id', id)).data ?? []).map((l) => l.id)
    )
    await svc.from('course_enrollments').delete().eq('course_id', id)
    await svc.from('learning_path_courses').delete().eq('course_id', id)
    const modulos = ((await svc.from('modules').select('id').eq('course_id', id)).data ?? []).map((x) => x.id)
    if (modulos.length) {
      await svc.from('quiz_attempts').delete().in('module_id', modulos)
      await svc.from('quiz_questions').delete().in('module_id', modulos)
    }
    await svc.from('courses').update({ status: 'draft', published_at: null }).eq('id', id)
    const { error } = await svc.from('courses').delete().eq('id', id)
    if (error) console.log(`   curso ${id.slice(0, 8)}: ${error.message}`)
    // EL ESPEJO, EN ORDEN. Las preguntas publicadas apuntan a los modulos publicados,
    // asi que sin borrarlas primero fallan los dos borrados siguientes —y el curso se
    // quedaba en el registro del espejo, acumulandose entre pasadas—.
    const modulosEspejo = ((await svc.from('modules_publicados').select('id').eq('course_id', id)).data ?? [])
      .map((m) => m.id)
    if (modulosEspejo.length) {
      await svc.from('quiz_questions_publicadas').delete().in('module_id', modulosEspejo)
    }
    await svc.from('lessons_publicadas').delete().eq('course_id', id)
    await svc.from('modules_publicados').delete().eq('course_id', id)
    await svc.from('courses_publicados').delete().eq('id', id)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    await svc.from('certificates').delete().eq('user_id', id)
    await svc.auth.admin.deleteUser(id)
  }

  const { count: cursos } = await svc.from('courses')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA certificado%').limit(0)
  const { count: espejo } = await svc.from('courses_publicados')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA %').limit(0)
  const { count: cuentas } = await svc.from('users')
    .select('id', { count: 'exact' }).ilike('email', `${MARCA}-%`).limit(0)

  console.log(
    `\nfallos ${fallos}, cursos_de_prueba ${cursos ?? 0}, de_prueba_en_el_espejo ${espejo ?? 0}, ` +
    `cuentas_de_prueba ${cuentas ?? 0}`
  )
  console.log(
    fallos === 0 && (cursos ?? 0) === 0 && (espejo ?? 0) === 0 && (cuentas ?? 0) === 0
      ? 'TODO CORRECTO\n' : 'REVISAR\n'
  )
  process.exit(fallos === 0 ? 0 : 1)
}
