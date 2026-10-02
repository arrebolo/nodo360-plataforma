/**
 * «Enviar a revisión» desde la lista de Mis cursos, en la pantalla de verdad.
 *
 *   npx tsx scripts/probar-el-envio-desde-mis-cursos.mts [http://localhost:3151]
 *
 * LOS TRES FALLOS QUE CUBRE
 *
 *   1. El botón de la tarjeta mandaba la petición a ciegas y enseñaba el rechazo en un
 *      `alert()` del navegador: desaparece al primer clic, no deja rastro y no dice
 *      dónde arreglarlo. Ahora, si falta algo, lleva al editor con el motivo a la vista.
 *
 *   2. «Está verificado en la especialidad» no es lo mismo que «puede enseñar este
 *      curso»: la verificación va TAMBIÉN por jurisdicción. Una de Fiscalidad en España
 *      no vale para un curso de Fiscalidad en México, y el checklist lo daba por bueno.
 *      Se comprueba con un caso real de esos.
 *
 *   3. Los cambios sin guardar se comprobaban solo al abrir la confirmación, no al
 *      pulsar «Sí, enviar». Eso no se puede pedir por HTTP —es un clic en el
 *      navegador—, así que se comprueba sobre el código, y se dice que es así.
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

const MARCA = 'qa-envio-tarjeta'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

try {
  if (!(await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0))) {
    throw new Error(`no hay nada escuchando en ${SITIO}`)
  }

  // ═══ El codigo: lo que no se puede pedir por HTTP ═════════════════════════
  console.log('\n=== sobre el codigo ===')
  const boton = fs.readFileSync('components/instructor/SubmitForReviewButton.tsx', 'utf8')
  const cuerpoDeHandleSubmit = boton.slice(
    boton.indexOf('const handleSubmit = async () => {'),
    boton.indexOf('const aviso =')
  )
  di(cuerpoDeHandleSubmit.includes('if (hayCambios)'),
    'handleSubmit comprueba los cambios sin guardar al confirmar, no solo al abrir')

  // SIN LOS COMENTARIOS: en la tarjeta se habla de alert() y de confirm() justamente
  // para explicar por qué ya no se usan, y buscarlos a pelo encontraba la explicación.
  const sinComentarios = (texto: string) =>
    texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const tarjeta = sinComentarios(
    fs.readFileSync('components/instructor/InstructorCourseCard.tsx', 'utf8')
  )
  di(!/(^|[^.\w])alert\s*\(/.test(tarjeta), 'la tarjeta ya no llama a alert()')
  di(!/(^|[^.\w])confirm\s*\(/.test(tarjeta), 'ni a confirm() del navegador')
  di(!tarjeta.includes('window.location.reload'), 'ni recarga la pagina entera al duplicar')

  // ═══ Montaje: una instructora verificada en fiscalidad SOLO en ES ═════════
  const correo = `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor', full_name: 'Instructora de prueba' }).eq('id', u!.user.id)

  const { data: fiscalidad } = await svc.from('instructor_specialties')
    .select('id, slug, requiere_acreditacion').eq('slug', 'fiscalidad').single()
  const { data: defi } = await svc.from('instructor_specialties')
    .select('id, slug').eq('slug', 'defi').single()
  if (!fiscalidad?.requiere_acreditacion) throw new Error('fiscalidad deberia verificarse por pais')

  await svc.from('instructor_certifications').insert({
    user_id: u!.user.id, specialty_id: fiscalidad!.id, status: 'aprobada',
    jurisdiccion: 'ES',
    certification_number: `${MARCA}-${Date.now()}`,
    evaluator_is_external: false, consentimiento_anuncio: false,
    issued_at: new Date().toISOString(),
  })

  const nuevoCurso = async (titulo: string, extra: Record<string, unknown>) => {
    const slug = `${MARCA}-${Math.random().toString(36).slice(2, 8)}`
    const { data, error } = await svc.from('courses').insert({
      title: titulo, slug, description: 'Curso de prueba.', level: 'beginner',
      status: 'draft', is_free: true, instructor_id: u!.user.id, ...extra,
    }).select('id, slug').single()
    if (error) throw new Error(`${titulo}: ${error.message}`)
    creado.cursos.push(data!.id)
    return data!
  }
  const conContenido = async (courseId: string, slug: string) => {
    const { data: m } = await svc.from('modules')
      .insert({ course_id: courseId, title: 'Módulo', order_index: 1 }).select('id').single()
    await svc.from('lessons').insert({
      course_id: courseId, module_id: m!.id, title: 'Lección',
      slug: `${slug}-l1`, order_index: 1, content: 'x',
    })
  }

  // a) sin especialidad
  const sinEsp = await nuevoCurso('PRUEBA sin especialidad', {})
  await conContenido(sinEsp.id, sinEsp.slug)
  // b) fiscalidad en MEXICO, verificada solo en ES  <- el caso de Codex
  const otroPais = await nuevoCurso('PRUEBA fiscalidad en Mexico', {
    specialty_id: fiscalidad!.id, jurisdiccion: 'MX',
  })
  await conContenido(otroPais.id, otroPais.slug)
  // c) fiscalidad en ESPAÑA, que si puede
  const mismoPais = await nuevoCurso('PRUEBA fiscalidad en Espana', {
    specialty_id: fiscalidad!.id, jurisdiccion: 'ES',
  })
  await conContenido(mismoPais.id, mismoPais.slug)
  // d) especialidad en la que no esta verificada
  const sinVerif = await nuevoCurso('PRUEBA especialidad sin verificar', { specialty_id: defi!.id })
  await conContenido(sinVerif.id, sinVerif.slug)
  // e) con especialidad buena pero sin modulos
  const sinModulos = await nuevoCurso('PRUEBA sin modulos', {
    specialty_id: fiscalidad!.id, jurisdiccion: 'ES',
  })

  // ═══ La lista, servida ════════════════════════════════════════════════════
  const { data: s, error: elog } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email: correo, password: CLAVE })
  if (elog || !s.session) throw new Error(`sesion: ${elog?.message}`)
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`

  const pedir = async (ruta: string) => {
    const r = await fetch(`${SITIO}${ruta}`, { headers: { Cookie: cookie }, redirect: 'manual' })
    return { status: r.status, html: r.status === 200 ? await r.text() : '' }
  }

  console.log('\n=== /dashboard/instructor/cursos (sesión de instructora) ===')
  const lista = await pedir('/dashboard/instructor/cursos?limit=50')
  di(lista.status === 200, 'responde 200', String(lista.status))

  // El enlace al editor con el motivo, uno por cada impedimento
  const enlaceCon = (id: string, clave: string) =>
    lista.html.includes(`/dashboard/instructor/cursos/${id}?aviso=${clave}`)

  di(enlaceCon(sinEsp.id, 'sin-especialidad'),
    'sin especialidad: el boton lleva al editor con ?aviso=sin-especialidad')
  di(enlaceCon(sinVerif.id, 'sin-verificacion'),
    'especialidad sin verificar: ?aviso=sin-verificacion')
  di(enlaceCon(otroPais.id, 'sin-verificacion'),
    'FISCALIDAD EN MEXICO con verificacion de ESPAÑA: ?aviso=sin-verificacion')
  di(enlaceCon(sinModulos.id, 'sin-modulos'),
    'sin modulos: ?aviso=sin-modulos')
  di(!enlaceCon(mismoPais.id, 'sin-verificacion') && !enlaceCon(mismoPais.id, 'sin-especialidad'),
    'fiscalidad en ESPAÑA con verificacion de España: ningun impedimento')
  di(lista.html.includes('Falta algo para enviar'), 'y el boton lo dice en vez de intentarlo')
  di(lista.html.includes('Elígela en el editor y guarda'),
    'el motivo se lee en la tarjeta, no solo al pasar el raton')
  di(lista.html.includes('Vista previa') && !lista.html.includes(`/cursos/${sinEsp.slug}"`),
    'la vista previa de un curso sin publicar NO apunta a la pagina publica')

  // ═══ El editor, con el aviso ══════════════════════════════════════════════
  console.log('\n=== el editor, llegando con el aviso ===')
  const conAviso = await pedir(`/dashboard/instructor/cursos/${sinEsp.id}?aviso=sin-especialidad`)
  di(conAviso.status === 200, 'responde 200', String(conAviso.status))
  di(conAviso.html.includes('Todavía no se puede enviar a revisión'), 'el aviso se ve')
  di(conAviso.html.includes('Elígela en el editor y guarda'), 'y dice qué falta')

  const inventado = await pedir(
    `/dashboard/instructor/cursos/${sinEsp.id}?aviso=${encodeURIComponent('<b>cualquier cosa</b>')}`
  )
  di(!inventado.html.includes('Todavía no se puede enviar a revisión') &&
     !inventado.html.includes('<b>cualquier cosa</b>'),
    'un ?aviso= inventado no pinta nada: solo valen las claves conocidas')

  // ═══ El checklist, con la jurisdiccion equivocada ═════════════════════════
  //
  // Los dos cursos son identicos salvo el pais: misma especialidad, un modulo y una
  // leccion cada uno. Si la verificacion se comprobara solo por especialidad, el
  // contador de requeridos saldria igual en los dos. Tiene que salir uno menos en el de
  // Mexico, porque ahi la verificacion de España no habilita.
  console.log('\n=== el checklist del editor ===')
  const requeridos = (html: string) => {
    // React separa los trozos de texto con comentarios: «7<!-- -->/<!-- -->9».
    const limpio = html.replace(/<!--[\s\S]*?-->/g, '')
    const m = limpio.match(/(\d+)\s*\/\s*(\d+)<\/span>[\s\S]{0,160}?requeridos/)
    return m ? { cumplidos: Number(m[1]), total: Number(m[2]) } : null
  }
  const editorMX = await pedir(`/dashboard/instructor/cursos/${otroPais.id}`)
  const editorES = await pedir(`/dashboard/instructor/cursos/${mismoPais.id}`)
  di(editorMX.status === 200 && editorES.status === 200, 'los dos editores responden 200',
    `${editorMX.status} / ${editorES.status}`)
  const mx = requeridos(editorMX.html)
  const es = requeridos(editorES.html)
  di(Boolean(mx && es), 'el checklist dice cuantos requeridos van cumplidos',
    `MX ${mx?.cumplidos}/${mx?.total}  ES ${es?.cumplidos}/${es?.total}`)
  di(Boolean(mx && es && es.cumplidos === mx.cumplidos + 1),
    'el de Mexico cumple UNO MENOS: la especialidad no esta verificada para su pais',
    `MX ${mx?.cumplidos}  ES ${es?.cumplidos}`)

  // ═══ Y el servidor, que es quien manda ════════════════════════════════════
  console.log('\n=== y el servidor rechaza lo mismo ===')
  const intento = await fetch(`${SITIO}/api/instructor/courses/${otroPais.id}/submit-review`, {
    method: 'POST', headers: { Cookie: cookie },
  })
  const cuerpo = await intento.json().catch(() => ({}))
  di(intento.status === 403, 'fiscalidad en Mexico con verificacion de España: 403',
    `${intento.status} ${String(cuerpo.error ?? '').slice(0, 60)}`)

  const bueno = await fetch(`${SITIO}/api/instructor/courses/${mismoPais.id}/submit-review`, {
    method: 'POST', headers: { Cookie: cookie },
  })
  di(bueno.status === 200, 'fiscalidad en España con verificacion de España: se envia',
    String(bueno.status))
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

  const { count: cursosDePrueba } = await svc.from('courses')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA %').limit(0)
  const { count: enElEspejo } = await svc.from('courses_publicados')
    .select('id', { count: 'exact' }).ilike('title', 'PRUEBA %').limit(0)
  const { count: cuentas } = await svc.from('users')
    .select('id', { count: 'exact' }).ilike('email', `${MARCA}-%`).limit(0)

  console.log(
    `\nfallos ${fallos}, cursos_de_prueba ${cursosDePrueba ?? 0}, ` +
    `de_prueba_en_el_espejo ${enElEspejo ?? 0}, cuentas_de_prueba ${cuentas ?? 0}`
  )
  console.log(
    fallos === 0 && (cursosDePrueba ?? 0) === 0 && (enElEspejo ?? 0) === 0 && (cuentas ?? 0) === 0
      ? 'TODO CORRECTO\n' : 'REVISAR\n'
  )
  process.exit(fallos === 0 ? 0 : 1)
}
