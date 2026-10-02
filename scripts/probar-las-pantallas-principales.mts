/**
 * Las pantallas principales, servidas con datos de verdad.
 *
 *   npx tsx scripts/probar-las-pantallas-principales.mts [http://localhost:3151]
 *
 * POR QUE
 *   La 117 repuntó cinco claves ajenas a la copia publicada, y un embed de PostgREST se
 *   resuelve POR LA CLAVE AJENA: al moverla, la consulta entera falla con PGRST200 y la
 *   pantalla se queda vacía o contesta 404 sin decir nada. Pasó en
 *   /dashboard/certificados (vacía) y en /certificados/[id] (404 con el certificado
 *   emitido). Lo único que lo caza es pedir las páginas con datos que ejerzan esas
 *   claves: progreso, XP y certificado.
 *
 * QUE SE MONTA
 *   Un curso publicado con módulo, lección y examen; una alumna matriculada con
 *   progreso, XP y certificado emitido. Y se piden las pantallas del alumno, las
 *   públicas y las de administración, comprobando que responden 200 y que ENSEÑAN SUS
 *   DATOS, no un estado vacío.
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

const MARCA = 'qa-pantallas'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
const galleta = (s: unknown) =>
  `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s), 'utf8').toString('base64url')}`

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

const pedirUnaVez = async (ruta: string, cookie?: string) => {
  const r = await fetch(`${SITIO}${ruta}`, { headers: cookie ? { Cookie: cookie } : {}, redirect: 'manual' })
  const texto = (await r.text()).replace(/<!--[\s\S]*?-->/g, '')
  return { status: r.status, destino: r.headers.get('location') ?? '', texto }
}
const pedir = async (ruta: string, cookie?: string) => {
  for (let i = 0; i < 4; i++) {
    const r = await pedirUnaVez(ruta, cookie)
    if (r.status !== 429) return r
    console.log(`   (429 en ${ruta}: esperando 20 s)`)
    await esperar(20000)
  }
  return pedirUnaVez(ruta, cookie)
}

/** Lo que Next pinta cuando algo se ha ido al suelo. */
const SENALES_DE_FALLO = ['Application error', 'Internal Server Error']

try {
  if (!(await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0))) {
    throw new Error(`no hay nada escuchando en ${SITIO}`)
  }

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()

  const cuenta = async (sufijo: string, rol: string) => {
    const correo = `${MARCA}-${sufijo}-${Date.now()}@nodo360-pruebas.invalid`
    const { data: u, error } = await svc.auth.admin.createUser({ email: correo, password: CLAVE, email_confirm: true })
    if (error) throw new Error(error.message)
    creado.usuarios.push(u!.user.id)
    await svc.from('users').update({ role: rol, full_name: `Prueba ${sufijo}` }).eq('id', u!.user.id)
    const { data: s, error: e } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
      .auth.signInWithPassword({ email: correo, password: CLAVE })
    if (e || !s.session) throw new Error(`sesion ${sufijo}: ${e?.message}`)
    return { id: u!.user.id, cookie: galleta(s.session) }
  }

  const instructor = await cuenta('instructor', 'instructor')
  await svc.from('instructor_certifications').insert({
    user_id: instructor.id, specialty_id: esp!.id, status: 'aprobada',
    certification_number: `${MARCA}-${Date.now()}`, evaluator_is_external: false,
    consentimiento_anuncio: false, issued_at: new Date().toISOString(),
  })
  const alumna = await cuenta('alumna', 'student')

  const { data: admins } = await svc.from('users').select('email').eq('role', 'admin').limit(1)
  const { data: enlace } = await svc.auth.admin.generateLink({ type: 'magiclink', email: admins![0].email as string })
  const { data: sa } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.verifyOtp({ token_hash: enlace!.properties!.hashed_token, type: 'magiclink' })
  const cookieAdmin = galleta(sa!.session)

  // ── El curso, publicado ───────────────────────────────────────────────────
  const slug = `${MARCA}-${Math.random().toString(36).slice(2, 8)}`
  const { data: c, error: ec } = await svc.from('courses').insert({
    title: 'PRUEBA pantallas principales', slug,
    description: 'Curso de prueba de las pantallas.', long_description: 'x'.repeat(220),
    level: 'beginner', is_free: true, status: 'draft',
    instructor_id: instructor.id, specialty_id: esp!.id,
    thumbnail_url: 'https://example.invalid/x.png',
  }).select('id, slug').single()
  if (ec) throw new Error(`curso: ${ec.message}`)
  creado.cursos.push(c!.id)

  const { data: m } = await svc.from('modules')
    .insert({ course_id: c!.id, title: 'Módulo 1', order_index: 0 }).select('id').single()
  const { data: l } = await svc.from('lessons').insert({
    course_id: c!.id, module_id: m!.id, title: 'Lección 1',
    slug: `${slug}-l0`, order_index: 0, content: 'Contenido de prueba.',
  }).select('id').single()
  await svc.from('quiz_questions').insert({
    module_id: m!.id, question: '¿Pregunta?', options: ['a', 'b'], correct_answer: 0, order_index: 0,
  })

  const publicado = await pedir(`/api/admin/courses/${c!.id}/publish`, cookieAdmin)
  // El publish es POST; se hace aparte para no complicar el helper.
  const pub = await fetch(`${SITIO}/api/admin/courses/${c!.id}/publish`, {
    method: 'POST', headers: { Cookie: cookieAdmin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: true, noAnunciar: true }),
  })
  di(pub.status === 200, 'el curso de prueba se publica', `${pub.status} (GET previo ${publicado.status})`)

  // ── Los datos de la alumna: matrícula, progreso, XP y certificado ────────
  await svc.from('course_enrollments').insert({
    user_id: alumna.id, course_id: c!.id, progress_percentage: 100,
    completed_at: new Date().toISOString(),
  })
  const { error: eProg } = await svc.from('user_progress').insert({
    user_id: alumna.id, lesson_id: l!.id, is_completed: true,
  })
  di(!eProg, 'la alumna tiene progreso (clave al espejo)', eProg?.message ?? '')

  const { error: eXp } = await svc.from('xp_events').insert({
    user_id: alumna.id, course_id: c!.id, lesson_id: l!.id,
    event_type: 'lesson_completed', xp_earned: 10, metadata: {},
  })
  di(!eXp, 'y XP con claves al espejo (course_id y lesson_id)', eXp?.message ?? '')

  await svc.from('quiz_attempts').insert({
    user_id: alumna.id, module_id: m!.id, score: 100, total_questions: 1,
    correct_answers: 1, passed: true, answers: [], completed_at: new Date().toISOString(),
  })
  const emitido = await fetch(`${SITIO}/api/certificates/generate`, {
    method: 'POST', headers: { Cookie: alumna.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId: c!.id }),
  })
  di(emitido.status === 200, 'y certificado emitido', String(emitido.status))
  const { data: cert } = await svc.from('certificates')
    .select('id, certificate_number').eq('user_id', alumna.id).eq('course_id', c!.id).maybeSingle()

  // ── Las pantallas ─────────────────────────────────────────────────────────
  const comprobar = async (
    nombre: string,
    ruta: string,
    cookie: string | undefined,
    debeContener: string[]
  ) => {
    const r = await pedir(ruta, cookie)
    const ok = r.status === 200
    di(ok, `${nombre.padEnd(34)} ${ruta}`, `${r.status}${r.destino ? ' -> ' + r.destino : ''}`)
    if (!ok) return
    for (const senal of SENALES_DE_FALLO) {
      di(!r.texto.includes(senal), `${nombre.padEnd(34)} sin «${senal}»`)
    }
    for (const texto of debeContener) {
      di(r.texto.includes(texto), `${nombre.padEnd(34)} enseña «${texto.slice(0, 32)}»`)
    }
  }

  console.log('\n=== las pantallas del alumno ===')
  await comprobar('panel', '/dashboard', alumna.cookie, [])
  // Esta pantalla son cifras, no nombres: se comprueba que las pinta.
  await comprobar('progreso', '/dashboard/progreso', alumna.cookie,
    ['Progreso promedio', 'Lecciones esta semana', 'Badges obtenidos'])
  await comprobar('mis cursos', '/dashboard/cursos', alumna.cookie, ['PRUEBA pantallas principales'])
  await comprobar('certificados', '/dashboard/certificados', alumna.cookie, ['PRUEBA pantallas principales'])
  await comprobar('clasificación', '/dashboard/leaderboard', alumna.cookie, [])
  await comprobar('insignias', '/dashboard/badges', alumna.cookie, [])

  console.log('\n=== lo público ===')
  await comprobar('catálogo', '/cursos', undefined, [])
  await comprobar('ficha del curso', `/cursos/${c!.slug}`, alumna.cookie, ['PRUEBA pantallas principales'])
  await comprobar('lección', `/cursos/${c!.slug}/${slug}-l0`, alumna.cookie, ['Lección 1'])
  await comprobar('certificado', `/certificados/${cert!.id}`, alumna.cookie, ['PRUEBA pantallas principales'])
  await comprobar('verificación', `/verificar/${cert!.certificate_number}`, undefined, [])

  console.log('\n=== administración ===')
  await comprobar('panel de admin', '/admin', cookieAdmin, [])
  await comprobar('cursos', '/admin/cursos', cookieAdmin, ['PRUEBA pantallas principales'])
  await comprobar('estadísticas', '/admin/estadisticas', cookieAdmin, [])
  await comprobar('usuarios', '/admin/usuarios', cookieAdmin, [])
  await comprobar('ficha de la alumna', `/admin/usuarios/${alumna.id}`, cookieAdmin, [])
  // El XP no tiene pantalla propia: la ficha del alumno lo pide por esta ruta, que es
  // la que ejerce xp_events.course_id y xp_events.lesson_id, las dos repuntadas.
  const xpDeLaAlumna = await fetch(`${SITIO}/api/admin/users/${alumna.id}/xp-events`, {
    headers: { Cookie: cookieAdmin },
  })
  const cuerpoXp = await xpDeLaAlumna.text()
  di(xpDeLaAlumna.status === 200, 'XP de la alumna (API de su ficha)', String(xpDeLaAlumna.status))
  di(cuerpoXp.includes('lesson_completed') || cuerpoXp.includes('xp_earned'),
    'y trae su evento de XP', cuerpoXp.slice(0, 80))
} catch (e) {
  fallos++
  console.log(`\n   EXPLOTO: ${e instanceof Error ? e.message : String(e)}`)
} finally {
  console.log('\n=== limpieza ===')
  // EL ORDEN IMPORTA, y los errores se dicen. Las claves al espejo son RESTRICT, así que
  // cualquier fila de progreso, XP o certificado que quede impide borrar el curso del
  // espejo —y entonces los cursos de prueba se acumulan ahí—. `xp_events` cuelga de DOS
  // claves repuntadas (course_id y lesson_id): hay que borrarlo por las dos.
  const quejarse = (que: string, e: { code?: string; message?: string } | null) => {
    if (e) console.log(`   ${que}: ${e.code} ${String(e.message).slice(0, 70)}`)
  }

  for (const id of creado.cursos) {
    quejarse('certificates', (await svc.from('certificates').delete().eq('course_id', id)).error)
    quejarse('xp_events por curso', (await svc.from('xp_events').delete().eq('course_id', id)).error)

    const leccionesEspejo = ((await svc.from('lessons_publicadas').select('id').eq('course_id', id)).data ?? []).map((x) => x.id)
    const leccionesTrabajo = ((await svc.from('lessons').select('id').eq('course_id', id)).data ?? []).map((x) => x.id)
    const lecciones = [...new Set([...leccionesEspejo, ...leccionesTrabajo])]
    if (lecciones.length) {
      quejarse('xp_events por lección', (await svc.from('xp_events').delete().in('lesson_id', lecciones)).error)
      quejarse('user_progress', (await svc.from('user_progress').delete().in('lesson_id', lecciones)).error)
    }
    quejarse('course_enrollments', (await svc.from('course_enrollments').delete().eq('course_id', id)).error)
    quejarse('learning_path_courses', (await svc.from('learning_path_courses').delete().eq('course_id', id)).error)

    const mods = ((await svc.from('modules').select('id').eq('course_id', id)).data ?? []).map((x) => x.id)
    if (mods.length) {
      quejarse('quiz_attempts', (await svc.from('quiz_attempts').delete().in('module_id', mods)).error)
      quejarse('quiz_questions', (await svc.from('quiz_questions').delete().in('module_id', mods)).error)
    }
    await svc.from('courses').update({ status: 'draft', published_at: null }).eq('id', id)
    quejarse('courses', (await svc.from('courses').delete().eq('id', id)).error)

    const modsEspejo = ((await svc.from('modules_publicados').select('id').eq('course_id', id)).data ?? []).map((x) => x.id)
    if (modsEspejo.length) {
      quejarse('quiz_questions_publicadas', (await svc.from('quiz_questions_publicadas').delete().in('module_id', modsEspejo)).error)
    }
    quejarse('lessons_publicadas', (await svc.from('lessons_publicadas').delete().eq('course_id', id)).error)
    quejarse('modules_publicados', (await svc.from('modules_publicados').delete().eq('course_id', id)).error)
    quejarse('courses_publicados', (await svc.from('courses_publicados').delete().eq('id', id)).error)
  }

  for (const id of creado.usuarios) {
    quejarse('verificaciones', (await svc.from('instructor_certifications').delete().eq('user_id', id)).error)
    quejarse('certificados de la cuenta', (await svc.from('certificates').delete().eq('user_id', id)).error)
    quejarse('xp de la cuenta', (await svc.from('xp_events').delete().eq('user_id', id)).error)
    const { error } = await svc.auth.admin.deleteUser(id)
    if (error) console.log(`   borrar la cuenta ${id.slice(0, 8)}: ${error.message.slice(0, 70)}`)
  }

  const { count: cursos } = await svc.from('courses').select('id', { count: 'exact' }).ilike('title', 'PRUEBA pantallas%').limit(0)
  const { count: espejo } = await svc.from('courses_publicados').select('id', { count: 'exact' }).ilike('title', 'PRUEBA %').limit(0)
  const { count: cuentas } = await svc.from('users').select('id', { count: 'exact' }).ilike('email', `${MARCA}-%`).limit(0)

  console.log(`\nfallos ${fallos}, cursos_de_prueba ${cursos ?? 0}, de_prueba_en_el_espejo ${espejo ?? 0}, cuentas_de_prueba ${cuentas ?? 0}`)
  console.log(
    fallos === 0 && (cursos ?? 0) === 0 && (espejo ?? 0) === 0 && (cuentas ?? 0) === 0
      ? 'TODO CORRECTO\n' : 'REVISAR\n'
  )
  process.exit(fallos === 0 ? 0 : 1)
}
