/**
 * Los endpoints de instructor para módulos y lecciones.
 *
 *   npx tsx scripts/probar-endpoints-de-instructor.mts [http://localhost:3151]
 *
 * EL FALLO
 *   Los cuatro botones del editor del instructor —subir, bajar, borrar módulo, borrar
 *   lección— llamaban a `/api/admin/{modules,lessons}/...`, que exige admin: **403**, y
 *   en la auditoría «fallaban sin avisar». Un instructor no podía ordenar su propio
 *   curso.
 *
 * LO QUE SE COMPRUEBA, con DOS instructores de verdad:
 *   1. cada uno puede reordenar y borrar lo suyo
 *   2. ninguno puede tocar lo del otro, y lo del otro sigue intacto después
 *   3. el padre se deriva de la fila: mandar el `courseId` de otro curso en el cuerpo
 *      no cambia a qué curso se aplica ni a quién se le pide permiso
 *   4. sin sesión, 401
 *   5. las rutas de /api/admin siguen exigiendo admin
 *   6. las rutas de aprendizaje que se ofrecen son solo las activas
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

const MARCA = 'qa-endpoints'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

type Instructor = { id: string; correo: string; cookie: string; curso: string; modulos: string[]; lecciones: string[] }

async function nuevoInstructor(sufijo: string, especialidadId: string): Promise<Instructor> {
  const correo = `${MARCA}-${sufijo}-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor', full_name: `Instructor ${sufijo}` }).eq('id', u!.user.id)
  await svc.from('instructor_certifications').insert({
    user_id: u!.user.id, specialty_id: especialidadId, status: 'aprobada',
    certification_number: `${MARCA}-${sufijo}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })

  const slug = `${MARCA}-${sufijo}-${Math.random().toString(36).slice(2, 8)}`
  const { data: c, error: ec } = await svc.from('courses').insert({
    title: `PRUEBA endpoints ${sufijo}`, slug, description: 'Curso de prueba.',
    level: 'beginner', status: 'draft', is_free: true,
    instructor_id: u!.user.id, specialty_id: especialidadId,
  }).select('id').single()
  if (ec) throw new Error(`curso ${sufijo}: ${ec.message}`)
  creado.cursos.push(c!.id)

  const modulos: string[] = []
  const lecciones: string[] = []
  for (const i of [0, 1]) {
    const { data: m, error: em } = await svc.from('modules')
      .insert({ course_id: c!.id, title: `Módulo ${i + 1}`, order_index: i })
      .select('id').single()
    if (em) throw new Error(`modulo ${i}: ${em.message}`)
    modulos.push(m!.id)
    for (const j of [0, 1]) {
      const { data: l, error: el } = await svc.from('lessons').insert({
        course_id: c!.id, module_id: m!.id, title: `Lección ${i + 1}.${j + 1}`,
        slug: `${slug}-l${i}${j}`, order_index: j, content: 'x',
      }).select('id').single()
      if (el) throw new Error(`leccion ${i}${j}: ${el.message}`)
      lecciones.push(l!.id)
    }
  }

  const { data: s, error: elog } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email: correo, password: CLAVE })
  if (elog || !s.session) throw new Error(`sesion ${sufijo}: ${elog?.message}`)

  return {
    id: u!.user.id, correo,
    cookie: `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`,
    curso: c!.id, modulos, lecciones,
  }
}

/**
 * EL LIMITADOR DE PETICIONES ES PARTE DEL ENTORNO, no un fallo.
 *
 * `checkRateLimit(request, 'api')` permite 30 peticiones por minuto, y esta prueba hace
 * unas treinta: dos pasadas seguidas devuelven 429 y las comprobaciones salen en rojo
 * sin que nada esté roto. Así que un 429 se espera y se reintenta, y se dice en voz
 * alta para que no se confunda con un acierto.
 */
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

const pedirUnaVez = async (ruta: string, opciones: { cookie?: string; metodo?: string; cuerpo?: unknown } = {}) => {
  const r = await fetch(`${SITIO}${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers: {
      ...(opciones.cookie ? { Cookie: opciones.cookie } : {}),
      ...(opciones.cuerpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    redirect: 'manual',
  })
  const texto = await r.text()
  let json: Record<string, unknown> = {}
  try { json = JSON.parse(texto) } catch { /* no era json */ }
  return { status: r.status, json, texto }
}

const pedir = async (ruta: string, opciones: { cookie?: string; metodo?: string; cuerpo?: unknown } = {}) => {
  for (let intento = 0; intento < 4; intento++) {
    const r = await pedirUnaVez(ruta, opciones)
    if (r.status !== 429) return r
    console.log(`   (429 en ${ruta}: el limitador. Esperando 20 s y reintentando)`)
    await esperar(20000)
  }
  return pedirUnaVez(ruta, opciones)
}

const ordenDe = async (tabla: 'modules' | 'lessons', id: string) => {
  const { data } = await svc.from(tabla).select('order_index').eq('id', id).maybeSingle()
  return (data as { order_index: number } | null)?.order_index ?? null
}

try {
  if (!(await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0))) {
    throw new Error(`no hay nada escuchando en ${SITIO}`)
  }

  const { data: esp } = await svc.from('instructor_specialties')
    .select('id').eq('slug', 'ethereum-contratos').single()

  const a = await nuevoInstructor('a', esp!.id)
  const b = await nuevoInstructor('b', esp!.id)

  // ═══ Las pantallas, servidas ══════════════════════════════════════════════
  console.log('\n=== las pantallas del instructor ===')
  for (const [nombre, ruta] of [
    ['módulos', `/dashboard/instructor/cursos/${a.curso}/modulos`],
    ['lecciones', `/dashboard/instructor/cursos/${a.curso}/modulos/${a.modulos[0]}/lecciones`],
    ['editor', `/dashboard/instructor/cursos/${a.curso}`],
  ] as const) {
    const r = await pedir(ruta, { cookie: a.cookie })
    di(r.status === 200, `${nombre}: responde 200`, String(r.status))
  }

  // ═══ Reordenar lo propio ══════════════════════════════════════════════════
  console.log('\n=== reordenar su propio curso ===')
  di(await ordenDe('modules', a.modulos[1]) === 1, 'el segundo módulo está en la posición 1')

  const subir = await pedir('/api/instructor/modules/reorder', {
    cookie: a.cookie, metodo: 'POST', cuerpo: { moduleId: a.modulos[1], direction: 'up' },
  })
  di(subir.status === 200, 'subirlo: 200', `${subir.status} ${String(subir.json.error ?? '')}`)
  di(await ordenDe('modules', a.modulos[1]) === 0 && await ordenDe('modules', a.modulos[0]) === 1,
    'y los dos módulos han intercambiado su posición de verdad',
    `${await ordenDe('modules', a.modulos[1])} / ${await ordenDe('modules', a.modulos[0])}`)

  const tope = await pedir('/api/instructor/modules/reorder', {
    cookie: a.cookie, metodo: 'POST', cuerpo: { moduleId: a.modulos[1], direction: 'up' },
  })
  di(tope.status === 400, 'subir el primero: 400 y lo dice', `${tope.status} ${String(tope.json.error ?? '')}`)

  const inventada = await pedir('/api/instructor/modules/reorder', {
    cookie: a.cookie, metodo: 'POST', cuerpo: { moduleId: a.modulos[1], direction: 'arriba del todo' },
  })
  di(inventada.status === 400, 'una dirección inventada: 400', String(inventada.status))

  const lecc = await pedir('/api/instructor/lessons/reorder', {
    cookie: a.cookie, metodo: 'POST', cuerpo: { lessonId: a.lecciones[1], direction: 'up' },
  })
  di(lecc.status === 200 && await ordenDe('lessons', a.lecciones[1]) === 0,
    'reordenar una lección propia: 200 y cambia el orden', String(lecc.status))

  // ═══ EL PADRE SE DERIVA DE LA FILA ════════════════════════════════════════
  console.log('\n=== el courseId del cuerpo no manda ===')
  const conCursoAjeno = await pedir('/api/instructor/modules/reorder', {
    cookie: a.cookie, metodo: 'POST',
    // El módulo es suyo; el curso que manda en el cuerpo es el de OTRO.
    cuerpo: { moduleId: a.modulos[1], courseId: b.curso, direction: 'down' },
  })
  di(conCursoAjeno.status === 200, 'con un courseId ajeno en el cuerpo, sigue siendo su módulo: 200',
    String(conCursoAjeno.status))
  di(await ordenDe('modules', b.modulos[0]) === 0 && await ordenDe('modules', b.modulos[1]) === 1,
    'y el curso del otro no se ha movido')

  // ═══ Lo del otro, no ══════════════════════════════════════════════════════
  console.log('\n=== el curso de otro instructor ===')
  const mover = await pedir('/api/instructor/modules/reorder', {
    cookie: a.cookie, metodo: 'POST', cuerpo: { moduleId: b.modulos[1], direction: 'up' },
  })
  di(mover.status === 403, 'mover un módulo ajeno: 403', `${mover.status} ${String(mover.json.error ?? '')}`)
  di(await ordenDe('modules', b.modulos[1]) === 1, 'y sigue en su sitio')

  const borrarAjeno = await pedir(`/api/instructor/modules/${b.modulos[0]}`, {
    cookie: a.cookie, metodo: 'DELETE',
  })
  di(borrarAjeno.status === 403, 'borrar un módulo ajeno: 403', String(borrarAjeno.status))
  di(await ordenDe('modules', b.modulos[0]) !== null, 'y el módulo sigue existiendo')

  const borrarLeccionAjena = await pedir(`/api/instructor/lessons/${b.lecciones[0]}`, {
    cookie: a.cookie, metodo: 'DELETE',
  })
  di(borrarLeccionAjena.status === 403, 'borrar una lección ajena: 403', String(borrarLeccionAjena.status))
  di(await ordenDe('lessons', b.lecciones[0]) !== null, 'y la lección sigue existiendo')

  // ═══ Sin sesión, y lo que no existe ═══════════════════════════════════════
  console.log('\n=== sin sesión, y lo que no existe ===')
  const sinSesion = await pedir(`/api/instructor/modules/${a.modulos[0]}`, { metodo: 'DELETE' })
  di(sinSesion.status === 401, 'sin sesión: 401', String(sinSesion.status))
  di(await ordenDe('modules', a.modulos[0]) !== null, 'y no ha borrado nada')

  const fantasma = await pedir('/api/instructor/modules/00000000-0000-0000-0000-000000000000', {
    cookie: a.cookie, metodo: 'DELETE',
  })
  di(fantasma.status === 404, 'un módulo que no existe: 404', String(fantasma.status))

  // ═══ Las rutas de admin siguen siendo de admin ════════════════════════════
  console.log('\n=== /api/admin sigue exigiendo admin ===')
  const porLaDeAdmin = await pedir(`/api/admin/modules/${a.modulos[0]}`, {
    cookie: a.cookie, metodo: 'DELETE',
  })
  di(porLaDeAdmin.status === 403, 'un instructor, por la ruta de admin: 403', String(porLaDeAdmin.status))
  di(await ordenDe('modules', a.modulos[0]) !== null, 'y su propio módulo sigue ahí')

  // ═══ Rutas de aprendizaje: solo las activas ═══════════════════════════════
  console.log('\n=== rutas de aprendizaje ===')
  const rutas = await pedir('/api/instructor/learning-paths', { cookie: a.cookie })
  const ofrecidas = (rutas.json.paths as { id: string; is_active: boolean }[] | undefined) ?? []
  di(rutas.status === 200 && ofrecidas.length > 0, 'se ofrecen rutas', `${rutas.status}, ${ofrecidas.length}`)
  di(ofrecidas.every((p) => p.is_active), 'y TODAS están activas')
  // Dato, no comprobación: si algún día no hubiera ninguna inactiva, la prueba de
  // arriba pasaría sin demostrar nada, y conviene verlo.
  const { count: inactivas } = await svc.from('learning_paths')
    .select('id', { count: 'exact' }).eq('is_active', false).limit(0)
  console.log(`   dato  en la base hay ${inactivas ?? 0} ruta(s) inactiva(s), que antes se ofrecían`)

  // Y LA DEL PANEL YA NO DEJA PASAR A UN INSTRUCTOR.
  //
  // `/api/admin/learning-paths` comprobaba solo que hubiera sesión, así que cualquier
  // cuenta —alumno incluido— pedía a una ruta de /api/admin el catálogo completo, con
  // las rutas inactivas dentro. Lo que la hacía fácil de pasar por alto es que
  // «funcionaba»: el formulario de crear curso del instructor la llamaba y recibía
  // 200, de modo que cerrarla y darle su ruta propia tenían que ir en el mismo cambio.
  const delPanel = await pedir('/api/admin/learning-paths', { cookie: a.cookie })
  di(delPanel.status === 403, 'GET /api/admin/learning-paths con sesión de instructor: 403',
     `${delPanel.status} ${JSON.stringify(delPanel.json).slice(0, 80)}`)
  const sinSesionPanel = await pedir('/api/admin/learning-paths')
  di(sinSesionPanel.status === 401, 'y sin sesión: 401', String(sinSesionPanel.status))

  if (ofrecidas.length > 0) {
    const asignar = await pedir(`/api/instructor/courses/${a.curso}/paths`, {
      cookie: a.cookie, metodo: 'POST',
      cuerpo: { learning_path_id: ofrecidas[0].id, position: 0, is_required: true },
    })
    di(asignar.status === 200, 'asignar una ruta a su curso: 200', `${asignar.status} ${String(asignar.json.error ?? '')}`)

    const ajena = await pedir(`/api/instructor/courses/${b.curso}/paths`, {
      cookie: a.cookie, metodo: 'POST',
      cuerpo: { learning_path_id: ofrecidas[0].id, position: 0, is_required: true },
    })
    di(ajena.status === 403, 'asignarla al curso de otro: 403', String(ajena.status))

    const quitar = await pedir(`/api/instructor/courses/${a.curso}/paths`, {
      cookie: a.cookie, metodo: 'DELETE', cuerpo: { learning_path_id: ofrecidas[0].id },
    })
    di(quitar.status === 200, 'y quitarla: 200', String(quitar.status))
  }

  // ═══ El examen, por la ruta del instructor ════════════════════════════════
  console.log('\n=== el examen final ===')
  const examenPropio = await pedir(`/api/instructor/quiz?courseId=${a.curso}`, { cookie: a.cookie })
  di(examenPropio.status === 200, 'leer el examen de su curso: 200', String(examenPropio.status))
  const examenAjeno = await pedir(`/api/instructor/quiz?courseId=${b.curso}`, { cookie: a.cookie })
  di(examenAjeno.status === 403, 'leer el de otro: 403', String(examenAjeno.status))

  // ═══ Y borrar lo propio, que es de lo que iba todo ════════════════════════
  console.log('\n=== borrar lo propio ===')
  const borrarLeccion = await pedir(`/api/instructor/lessons/${a.lecciones[0]}`, {
    cookie: a.cookie, metodo: 'DELETE',
  })
  di(borrarLeccion.status === 200, 'borrar una lección propia: 200',
    `${borrarLeccion.status} ${String(borrarLeccion.json.error ?? '')}`)
  di(await ordenDe('lessons', a.lecciones[0]) === null, 'y ya no está')

  const borrarModulo = await pedir(`/api/instructor/modules/${a.modulos[0]}`, {
    cookie: a.cookie, metodo: 'DELETE',
  })
  di(borrarModulo.status === 200, 'borrar un módulo propio: 200',
    `${borrarModulo.status} ${String(borrarModulo.json.error ?? '')}`)
  di(await ordenDe('modules', a.modulos[0]) === null, 'y ya no está')
} catch (e) {
  fallos++
  console.log(`\n   EXPLOTO: ${e instanceof Error ? e.message : String(e)}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado.cursos) {
    await svc.from('learning_path_courses').delete().eq('course_id', id)
    await svc.from('courses').update({ status: 'draft', published_at: null }).eq('id', id)
    const { error } = await svc.from('courses').delete().eq('id', id)
    if (error) console.log(`   curso ${id.slice(0, 8)}: ${error.message}`)
    await svc.from('lessons_publicadas').delete().eq('course_id', id)
    await svc.from('modules_publicados').delete().eq('course_id', id)
    await svc.from('courses_publicados').delete().eq('id', id)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    await svc.auth.admin.deleteUser(id)
  }

  const { count: cursos } = await svc.from('courses')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA endpoints%').limit(0)
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
