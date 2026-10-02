/**
 * Borrar contenido: el progreso de los alumnos, la numeración y el escalonado.
 *
 *   npx tsx scripts/probar-el-borrado-de-contenido.mts [http://localhost:3151]
 *
 * LOS TRES FALLOS, los tres de la revisión de la #307
 *
 *   1. Al refactorizar perdí la llamada a `recalcularMatriculasDelCurso()` que hacía la
 *      ruta de admin. `progress_percentage` vive guardado en `course_enrollments` y es
 *      «hechas / total»: al quitar una lección el total baja, así que quien tenía 1 de 2
 *      se queda diciendo 50 % para siempre.
 *
 *   2. Al borrar quedaban huecos en `order_index` (0, 1, 3). Los hermanos que quedan se
 *      renumeran en la misma operación.
 *
 *   3. Y el hueco no era cosmético: `checkLessonAccess` buscaba el módulo anterior como
 *      «order_index - 1», no lo encontraba y ABRIA el módulo sin pedir nada. Borrar un
 *      módulo intermedio desbloqueaba el siguiente para todo el mundo.
 *
 * EL CURSO SE PUBLICA porque el progreso de los alumnos cuelga de la copia publicada:
 * desde la 117, `user_progress.lesson_id` apunta a `lessons_publicadas` con RESTRICT, y
 * sin fila en el espejo no se puede ni crear progreso (23503). Se publica con «no
 * anunciar», y el servidor de pruebas se arranca sin webhooks.
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

const MARCA = 'qa-borrado'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
const galleta = (sesion: unknown) =>
  `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')}`

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
  return { status: r.status, json, texto }
}
/** El limitador deja 30 peticiones por minuto: un 429 se espera, no es un fallo. */
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

const ordenes = async (tabla: 'modules' | 'lessons', col: 'course_id' | 'module_id', padre: string) => {
  const { data } = await svc.from(tabla).select('id, order_index').eq(col, padre).order('order_index')
  return (data ?? []) as { id: string; order_index: number }[]
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

  // Sesión de admin sobre un admin QUE YA EXISTE, para publicar por la API.
  const { data: admins } = await svc.from('users').select('email').eq('role', 'admin').limit(1)
  const { data: enlace } = await svc.auth.admin.generateLink({
    type: 'magiclink', email: admins![0].email as string,
  })
  const { data: sa } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.verifyOtp({ token_hash: enlace!.properties!.hashed_token, type: 'magiclink' })
  const cookieAdmin = galleta(sa!.session)

  async function cursoConContenido(titulo: string, porModulo: number[]) {
    const slug = `${MARCA}-${Math.random().toString(36).slice(2, 8)}`
    const { data: c, error } = await svc.from('courses').insert({
      title: titulo, slug, description: 'Curso de prueba del borrado.',
      long_description: 'x'.repeat(220), level: 'beginner', is_free: true,
      status: 'draft', instructor_id: instructor.id, specialty_id: esp!.id,
      thumbnail_url: 'https://example.invalid/x.png',
    }).select('id, slug').single()
    if (error) throw new Error(`${titulo}: ${error.message}`)
    creado.cursos.push(c!.id)

    const modulos: { id: string; lecciones: { id: string; slug: string }[] }[] = []
    for (let i = 0; i < porModulo.length; i++) {
      const { data: m, error: em } = await svc.from('modules')
        .insert({ course_id: c!.id, title: `Módulo ${i + 1}`, order_index: i })
        .select('id').single()
      if (em) throw new Error(`modulo: ${em.message}`)
      const lecciones: { id: string; slug: string }[] = []
      for (let j = 0; j < porModulo[i]; j++) {
        const sl = `${slug}-m${i}-l${j}`
        const { data: l, error: el } = await svc.from('lessons').insert({
          course_id: c!.id, module_id: m!.id, title: `Lección ${i + 1}.${j + 1}`,
          slug: sl, order_index: j, content: 'Contenido de prueba.',
        }).select('id').single()
        if (el) throw new Error(`leccion: ${el.message}`)
        lecciones.push({ id: l!.id, slug: sl })
      }
      modulos.push({ id: m!.id, lecciones })
    }
    return { id: c!.id, slug: c!.slug as string, modulos }
  }

  const publicar = async (courseId: string) => {
    const r = await pedir(`/api/admin/courses/${courseId}/publish`, {
      cookie: cookieAdmin, metodo: 'POST', cuerpo: { force: true, noAnunciar: true },
    })
    const { count } = await svc.from('lessons_publicadas')
      .select('id', { count: 'exact' }).eq('course_id', courseId).limit(0)
    return { status: r.status, enElEspejo: count ?? 0 }
  }

  // ═══ 1. El progreso de los alumnos ════════════════════════════════════════
  console.log('\n=== borrar una lección pone al día el progreso ===')
  const a = await cursoConContenido('PRUEBA borrado progreso', [2])
  const pub = await publicar(a.id)
  di(pub.status === 200 && pub.enElEspejo === 2,
    'el curso se publica y sus 2 lecciones están en el espejo',
    `${pub.status}, ${pub.enElEspejo} en el espejo`)

  const { error: eMat } = await svc.from('course_enrollments').insert({
    user_id: alumna.id, course_id: a.id, progress_percentage: 50,
  })
  di(!eMat, 'la alumna se matricula', eMat?.message ?? '')

  const { error: eProg } = await svc.from('user_progress').insert({
    user_id: alumna.id, lesson_id: a.modulos[0].lecciones[0].id, is_completed: true,
  })
  di(!eProg, 'y completa UNA de las dos lecciones', eProg?.message ?? '')

  const borrada = await pedir(`/api/instructor/lessons/${a.modulos[0].lecciones[1].id}`, {
    cookie: instructor.cookie, metodo: 'DELETE',
  })
  di(borrada.status === 200, 'el instructor borra la que le faltaba: 200',
    `${borrada.status} ${String(borrada.json.error ?? '')}`)

  const { data: matricula } = await svc.from('course_enrollments')
    .select('progress_percentage, completed_at').eq('user_id', alumna.id).eq('course_id', a.id).maybeSingle()
  di(matricula?.progress_percentage === 100,
    'la matrícula pasa de 50 % a 100 %: 1 de 1',
    `${matricula?.progress_percentage} %`)

  // Y lo que NO hace, a proposito: certificar.
  const { count: certificados } = await svc.from('certificates')
    .select('id', { count: 'exact' }).eq('user_id', alumna.id).eq('course_id', a.id).limit(0)
  di((certificados ?? 0) === 0,
    'y NO emite certificado: eso exige aprobar el examen (createCertificate)',
    `${certificados ?? 0} certificados`)
  di(matricula?.completed_at == null,
    'ni toca completed_at, que es lo que emitiría el certificado')

  // ═══ 2. La numeración, sin huecos ═════════════════════════════════════════
  console.log('\n=== borrar no deja huecos en order_index ===')
  const b = await cursoConContenido('PRUEBA borrado numeracion', [3, 1, 1])
  di((await ordenes('modules', 'course_id', b.id)).map((m) => m.order_index).join(',') === '0,1,2',
    'tres módulos en 0,1,2')

  const borradoDelMedio = await pedir(`/api/instructor/modules/${b.modulos[1].id}`, {
    cookie: instructor.cookie, metodo: 'DELETE',
  })
  di(borradoDelMedio.status === 200, 'se borra el del medio: 200', String(borradoDelMedio.status))
  const trasBorrar = (await ordenes('modules', 'course_id', b.id)).map((m) => m.order_index)
  di(trasBorrar.join(',') === '0,1',
    'los que quedan se renumeran a 0,1 (antes quedaba 0,2)', trasBorrar.join(','))

  const lecciones = await ordenes('lessons', 'module_id', b.modulos[0].id)
  di(lecciones.map((l) => l.order_index).join(',') === '0,1,2', 'y el primer módulo tenía 3 lecciones en 0,1,2')
  const borradoLeccion = await pedir(`/api/instructor/lessons/${b.modulos[0].lecciones[1].id}`, {
    cookie: instructor.cookie, metodo: 'DELETE',
  })
  di(borradoLeccion.status === 200, 'se borra la del medio: 200', String(borradoLeccion.status))
  const trasLeccion = (await ordenes('lessons', 'module_id', b.modulos[0].id)).map((l) => l.order_index)
  di(trasLeccion.join(',') === '0,1', 'las que quedan se renumeran a 0,1', trasLeccion.join(','))

  // Y moverse sigue funcionando con la numeración nueva
  const mover = await pedir('/api/instructor/modules/reorder', {
    cookie: instructor.cookie, metodo: 'POST',
    cuerpo: { moduleId: b.modulos[2].id, direction: 'up' },
  })
  di(mover.status === 200, 'y el que quedó segundo se puede subir', String(mover.status))

  // ═══ 3. El escalonado, con un hueco a mano ════════════════════════════════
  console.log('\n=== con un hueco en la numeración NO se salta el requisito ===')
  const c = await cursoConContenido('PRUEBA borrado escalonado', [1, 1])
  const pubC = await publicar(c.id)
  di(pubC.status === 200, 'el curso se publica', String(pubC.status))

  // Un hueco como el que dejaba un borrado: 0 y 5 en vez de 0 y 1.
  await svc.from('modules').update({ order_index: 5 }).eq('id', c.modulos[1].id)
  const conHueco = (await ordenes('modules', 'course_id', c.id)).map((m) => m.order_index)
  di(conHueco.join(',') === '0,5', 'los módulos quedan en 0 y 5', conHueco.join(','))

  const segunda = c.modulos[1].lecciones[0]
  const bloqueada = await pedir(`/cursos/${c.slug}/${segunda.slug}`, { cookie: alumna.cookie })
  di(bloqueada.status === 200, 'la página de la lección responde 200', String(bloqueada.status))
  di(bloqueada.texto.includes('Esta lección se abre al terminar el módulo anterior'),
    'y está BLOQUEADA, aunque no haya ningún módulo en el índice 4')
  // Las comillas angulares solo salen en el panel de bloqueo: «Módulo 1» a secas
  // aparece tambien en la barra lateral de la leccion abierta, y esta asercion pasaba
  // igual con el fallo puesto.
  // React separa los trozos de texto con comentarios: «<!-- -->Módulo 1<!-- -->».
  const sinSeparadores = bloqueada.texto.replace(/<!--[\s\S]*?-->/g, '')
  di(sinSeparadores.includes('«Módulo 1»'),
    'y el panel de bloqueo dice que lo que falta es el módulo inmediatamente anterior')

  // Con el módulo anterior completo, se abre: la regla sigue funcionando.
  const { error: eProg2 } = await svc.from('user_progress').insert({
    user_id: alumna.id, lesson_id: c.modulos[0].lecciones[0].id, is_completed: true,
  })
  di(!eProg2, 'la alumna completa el módulo anterior', eProg2?.message ?? '')
  const abierta = await pedir(`/cursos/${c.slug}/${segunda.slug}`, { cookie: alumna.cookie })
  di(!abierta.texto.includes('Esta lección se abre al terminar el módulo anterior'),
    'y entonces sí se abre')
} catch (e) {
  fallos++
  console.log(`\n   EXPLOTO: ${e instanceof Error ? e.message : String(e)}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('learning_path_courses').delete().eq('course_id', id)
    await svc.from('user_progress').delete().in(
      'lesson_id',
      ((await svc.from('lessons_publicadas').select('id').eq('course_id', id)).data ?? []).map((l) => l.id)
    )
    await svc.from('course_enrollments').delete().eq('course_id', id)
    await svc.from('certificates').delete().eq('course_id', id)
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
    await svc.auth.admin.deleteUser(id)
  }

  const { count: cursos } = await svc.from('courses')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA borrado%').limit(0)
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
