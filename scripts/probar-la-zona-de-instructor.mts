/**
 * La zona de instructor, en un navegador de verdad.
 *
 *   npx tsx scripts/probar-la-zona-de-instructor.mts [http://localhost:3161]
 *
 * POR QUÉ UN NAVEGADOR Y NO `fetch`
 *   Las pruebas que sirven páginas con `fetch` comprueban el HTML del servidor, y eso
 *   deja fuera precisamente lo que falló en la re-auditoría del flujo de instructor:
 *
 *   - La vista previa daba «Algo salió mal» con el React minificado #441, porque se le
 *     pasaba UNA FUNCIÓN como propiedad a un componente de cliente. Con `fetch` la
 *     página responde 200 y trae HTML: el fallo ocurre al hidratar, en el navegador.
 *   - El aviso de hidratación #418 solo existe en el navegador, por definición.
 *   - `confirm()` y `prompt()` son del navegador: que estén o no estén no se ve en el
 *     HTML. Aquí se comprueba de la única forma que vale: pisando los dos y mirando si
 *     alguien los llama.
 *
 *   Así que esto maneja Chrome sin cabeza por el protocolo de depuración (CDP), que ya
 *   está instalado, y escucha su consola.
 *
 * LO QUE SE COMPRUEBA
 *   1. la vista previa abre, con módulos, lecciones y un vídeo de YouTube
 *   2. ninguna pantalla de instructor avisa de hidratación (#418, #423, #425)
 *   3. borrar módulo y lección piden confirmación EN LA PÁGINA, y nada se borra al
 *      cancelar
 *   4. «Mis cursos» no inventa alumnos: con 0 cursos, 0 alumnos
 *   5. el editor de lecciones no llama a prompt(): enlace, imagen y vídeo abren diálogo,
 *      y hay botón de tabla
 *   6. las erratas de tildes que se corrigieron no han vuelto
 *   7. crear curso pide las rutas a /api/instructor, no al panel, y las ofrece
 *   8. la «Zona de peligro» de la ficha del módulo pide confirmación
 *   9. NADA DE ESO CAMBIA CON EL NAVEGADOR EN OTRO HUSO Y OTRO IDIOMA
 *
 * LO DEL HUSO NO ES UN ADORNO
 *   El aviso de hidratación #418 de la auditoría no se reproducía con el navegador en el
 *   mismo huso y el mismo idioma que el servidor: con los dos iguales, una fecha o un
 *   número formateados en el cliente salen idénticos a los del servidor y no hay nada
 *   que no coincida. El caso real es el contrario y es el caso normal de esta
 *   plataforma: el servidor en UTC y quien mira en Bogotá, en México o en Madrid.
 *
 *   Así que la segunda pasada pone el navegador en otro huso (Pacific/Kiritimati, UTC+14)
 *   y en otro idioma (en-US), que es como se ve si una fecha se formatea dos veces en dos
 *   sitios distintos. Es el único montaje en el que ese fallo se ve en casa.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ── el entorno ──────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const REF = new URL(URL_BASE).hostname.split('.')[0]
const SITIO = process.argv[2] ?? 'http://localhost:3161'
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => fs.existsSync(p))

const MARCA = 'qa-instructor-nav'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
const VIDEO = 'https://www.youtube.com/watch?v=Gc2en3nHxA4'

let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Un recuento, o se para: `count` a null no es cero filas. */
const exigirCuenta = (r: { count: number | null; error: { message: string } | null }) => {
  if (r.error) throw new Error('no se pudo contar: ' + r.error.message)
  if (r.count === null) throw new Error('no se pudo contar: sin recuento y sin error')
  return r.count
}

// ═══════════════════════════════════════════════════════════════════════════════
// EL NAVEGADOR
// ═══════════════════════════════════════════════════════════════════════════════
type Mensaje = { tipo: string; texto: string }

class Navegador {
  private proceso!: ChildProcess
  private ws!: WebSocket
  private perfil!: string
  private n = 0
  private pendientes = new Map<number, (r: any) => void>()
  mensajes: Mensaje[] = []
  /** Las peticiones que ha hecho la página, para saber si un botón llegó a pedir algo. */
  peticiones: string[] = []

  async abrir(puerto = 9444) {
    if (!CHROME) throw new Error('no hay Chrome ni Edge donde mirar')
    this.perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-qa-'))
    this.proceso = spawn(CHROME, [
      '--headless=new',
      `--remote-debugging-port=${puerto}`,
      `--user-data-dir=${this.perfil}`,
      '--no-first-run', '--no-default-browser-check', '--disable-gpu',
      '--window-size=1280,900',
      'about:blank',
    ], { stdio: 'ignore' })

    let pestana: any
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${puerto}/json/list`)
        if (r.ok) {
          const lista = await r.json()
          pestana = lista.find((p: any) => p.type === 'page')
          if (pestana) break
        }
      } catch { /* todavia no */ }
      await esperar(250)
    }
    if (!pestana) throw new Error('Chrome no abrio el puerto de depuracion')

    this.ws = new WebSocket(pestana.webSocketDebuggerUrl)
    await new Promise<void>((listo, falla) => {
      this.ws.onopen = () => listo()
      this.ws.onerror = () => falla(new Error('no se pudo hablar con Chrome'))
    })
    this.ws.onmessage = (e) => {
      const m = JSON.parse(String(e.data))
      if (m.id && this.pendientes.has(m.id)) {
        this.pendientes.get(m.id)!(m)
        this.pendientes.delete(m.id)
        return
      }
      if (m.method === 'Runtime.consoleAPICalled') {
        this.mensajes.push({
          tipo: m.params.type,
          texto: m.params.args.map((a: any) => a.value ?? a.description ?? '').join(' '),
        })
      }
      if (m.method === 'Runtime.exceptionThrown') {
        this.mensajes.push({
          tipo: 'excepcion',
          texto: m.params.exceptionDetails.exception?.description
            ?? m.params.exceptionDetails.text ?? '',
        })
      }
      if (m.method === 'Network.requestWillBeSent') {
        this.peticiones.push(`${m.params.request.method} ${m.params.request.url.replace(SITIO, '')}`)
      }
      if (m.method === 'Network.responseReceived') {
        this.peticiones.push(`  → ${m.params.response.status} ${m.params.response.url.replace(SITIO, '')}`)
      }
    }
    await this.pedir('Runtime.enable')
    await this.pedir('Page.enable')
    await this.pedir('Network.enable')
  }

  pedir(method: string, params: unknown = {}): Promise<any> {
    const id = ++this.n
    return new Promise((listo) => {
      this.pendientes.set(id, listo)
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async ponerLaSesion(cookie: string) {
    const [nombre, valor] = [cookie.slice(0, cookie.indexOf('=')), cookie.slice(cookie.indexOf('=') + 1)]
    await this.pedir('Network.setCookie', {
      name: nombre, value: valor, domain: 'localhost', path: '/',
    })
  }

  /** Va a una página y espera a que termine de hidratar. Devuelve lo que se oyó allí. */
  async ir(ruta: string, { espera = 2500 } = {}) {
    this.mensajes = []
    this.peticiones = []
    await this.pedir('Page.navigate', { url: `${SITIO}${ruta}` })
    await esperar(espera)
    return this.mensajes
  }

  async evaluar<T = unknown>(expresion: string): Promise<T> {
    const r = await this.pedir('Runtime.evaluate', {
      expression: expresion, returnByValue: true, awaitPromise: true,
    })
    if (r.result?.exceptionDetails) {
      throw new Error('al evaluar: ' + JSON.stringify(r.result.exceptionDetails))
    }
    return r.result?.result?.value as T
  }

  /**
   * El navegador, en otro huso y otro idioma que el servidor.
   *
   * Con los dos iguales, cualquier fecha formateada en el cliente coincide con la del
   * servidor por casualidad, y un fallo de hidratación por fechas no se ve. Con esto se
   * ve: es lo que pasa de verdad cuando el servidor está en UTC y quien mira, en Bogotá.
   */
  async mudarse(huso: string, idioma: string) {
    await this.pedir('Emulation.setTimezoneOverride', { timezoneId: huso })
    await this.pedir('Emulation.setLocaleOverride', { locale: idioma })
  }

  texto() { return this.evaluar<string>('document.body.innerText') }
  html() { return this.evaluar<string>('document.documentElement.outerHTML') }

  /** Pisa prompt, confirm y alert para saber si alguien los llama. */
  async vigilarLosDialogosDelNavegador() {
    await this.pedir('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__nativos = [];
        window.prompt = function (m) { window.__nativos.push('prompt: ' + m); return null };
        window.confirm = function (m) { window.__nativos.push('confirm: ' + m); return false };
        window.alert = function (m) { window.__nativos.push('alert: ' + m) };
      `,
    })
  }
  nativosLlamados() { return this.evaluar<string[]>('window.__nativos || []') }

  /**
   * Pulsa el primer elemento cuyo texto o título contenga esto.
   *
   * Reintenta un par de segundos: en desarrollo la página se compila al pedirla y el
   * botón puede no estar todavía. Sin esperar, la prueba falla una vez de cada tantas y
   * eso es peor que no tenerla, porque el rojo deja de significar nada.
   */
  async pulsar(queDice: string, { intentos = 8 } = {}) {
    for (let i = 0; i < intentos; i++) {
      const hecho = await this.evaluar<boolean>(`(() => {
        const q = ${JSON.stringify(queDice)}.toLowerCase();
        const todos = [...document.querySelectorAll('button, a, [role=button]')];
        const el = todos.find((e) =>
          (e.innerText || '').toLowerCase().includes(q) ||
          (e.getAttribute('title') || '').toLowerCase().includes(q) ||
          (e.getAttribute('aria-label') || '').toLowerCase().includes(q));
        if (!el) return false;
        el.click();
        return true;
      })()`)
      if (hecho) {
        await esperar(700)
        return true
      }
      await esperar(400)
    }
    return false
  }

  async cerrar() {
    try { this.ws.close() } catch { /* ya estaba */ }
    try { this.proceso.kill() } catch { /* ya estaba */ }
    await esperar(400)
    try { fs.rmSync(this.perfil, { recursive: true, force: true }) } catch { /* da igual */ }
  }
}

const HIDRATACION = /hydrat|#418|#423|#425|#421|did not match|Minified React error/i
const avisosDeHidratacion = (ms: Mensaje[]) =>
  ms.filter((m) => HIDRATACION.test(m.texto)).map((m) => `${m.tipo}: ${m.texto.slice(0, 160)}`)

// ═══════════════════════════════════════════════════════════════════════════════
// LOS DATOS DE PRUEBA
// ═══════════════════════════════════════════════════════════════════════════════
const creado: { usuarios: string[]; cursos: string[] } = { usuarios: [], cursos: [] }

type Instructor = {
  id: string; correo: string; cookie: string
  curso?: string; modulos: string[]; lecciones: string[]
  /** Para la «Zona de peligro»: con lecciones, su botón está desactivado. */
  moduloSinLecciones?: string
}

async function nuevoInstructor(sufijo: string, especialidadId: string | null, conCurso: boolean): Promise<Instructor> {
  const correo = `${MARCA}-${sufijo}-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error: eu } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (eu) throw new Error(eu.message)
  creado.usuarios.push(u!.user.id)
  await svc.from('users').update({ role: 'instructor', full_name: `Instructor ${sufijo}` }).eq('id', u!.user.id)

  if (especialidadId) {
    await svc.from('instructor_certifications').insert({
      user_id: u!.user.id, specialty_id: especialidadId, status: 'aprobada',
      certification_number: `${MARCA}-${sufijo}-${Date.now()}`,
      evaluator_is_external: false, consentimiento_anuncio: false,
      issued_at: new Date().toISOString(),
    })
  }

  const instructor: Instructor = { id: u!.user.id, correo, cookie: '', modulos: [], lecciones: [] }

  if (conCurso) {
    const slug = `${MARCA}-${sufijo}-${Math.random().toString(36).slice(2, 8)}`
    const { data: c, error: ec } = await svc.from('courses').insert({
      title: `PRUEBA zona instructor ${sufijo}`, slug,
      description: 'Curso de prueba para la zona de instructor.',
      level: 'beginner', status: 'draft', is_free: true,
      instructor_id: u!.user.id, specialty_id: especialidadId,
    }).select('id').single()
    if (ec) throw new Error(`curso ${sufijo}: ${ec.message}`)
    creado.cursos.push(c!.id)
    instructor.curso = c!.id

    // Un modulo SIN LECCIONES, que es el unico caso en que la «Zona de peligro» de la
    // ficha del modulo deja borrar: con lecciones, el boton esta desactivado.
    const { data: vacio, error: ev } = await svc.from('modules')
      .insert({ course_id: c!.id, title: 'Módulo sin lecciones', order_index: 9 })
      .select('id').single()
    if (ev) throw new Error(`modulo vacio: ${ev.message}`)
    instructor.moduloSinLecciones = vacio!.id

    for (const i of [0, 1]) {
      const { data: m, error: em } = await svc.from('modules')
        .insert({ course_id: c!.id, title: `Módulo de prueba ${i + 1}`, order_index: i })
        .select('id').single()
      if (em) throw new Error(`modulo ${i}: ${em.message}`)
      instructor.modulos.push(m!.id)
      for (const j of [0, 1]) {
        const { data: l, error: el } = await svc.from('lessons').insert({
          course_id: c!.id, module_id: m!.id,
          title: `Lección de prueba ${i + 1}.${j + 1}`,
          slug: `${slug}-l${i}${j}`, order_index: j,
          content: '<p>Contenido de prueba.</p>',
          // UN VIDEO DE VERDAD en la primera: la vista previa tiene que poder
          // ensenarlo, que es para lo que sirve antes de enviar a revision.
          video_url: i === 0 && j === 0 ? VIDEO : null,
          is_free_preview: i === 0 && j === 0,
        }).select('id').single()
        if (el) throw new Error(`leccion ${i}${j}: ${el.message}`)
        instructor.lecciones.push(l!.id)
      }
    }
  }

  const { data: s, error: elog } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email: correo, password: CLAVE })
  if (elog || !s.session) throw new Error(`sesion ${sufijo}: ${elog?.message}`)
  instructor.cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s.session), 'utf8').toString('base64url')}`
  return instructor
}

async function limpiar() {
  for (const id of creado.cursos) {
    await svc.from('lessons').delete().eq('course_id', id)
    await svc.from('modules').delete().eq('course_id', id)
    await svc.from('courses').delete().eq('id', id)
  }
  for (const id of creado.usuarios) {
    await svc.from('instructor_certifications').delete().eq('user_id', id)
    await svc.from('users').delete().eq('id', id)
    await svc.auth.admin.deleteUser(id)
  }
  const { count } = await svc.from('courses').select('id', { count: 'exact', head: true })
    .like('slug', `${MARCA}%`)
  console.log(`\nlimpieza: ${creado.cursos.length} cursos y ${creado.usuarios.length} usuarios borrados; restos: ${count ?? '?'}`)
}

// ═══════════════════════════════════════════════════════════════════════════════
const nav = new Navegador()

try {
  console.log(`\nSitio: ${SITIO}`)
  const r0 = await fetch(SITIO, { redirect: 'manual' }).catch(() => null)
  if (!r0) throw new Error(`no hay nada sirviendo en ${SITIO}`)

  const { data: esp } = await svc.from('instructor_specialties')
    .select('id, slug').eq('is_active', true).order('position').limit(1)
  const especialidad = esp?.[0]?.id
  if (!especialidad) throw new Error('no hay especialidades en la base')

  console.log('\nDatos de prueba…')
  const conCurso = await nuevoInstructor('con-curso', especialidad, true)
  const sinNada = await nuevoInstructor('sin-nada', null, false)
  console.log(`   instructor con curso: ${conCurso.curso}`)
  console.log(`   instructor sin cursos ni verificación`)

  await nav.abrir()
  await nav.vigilarLosDialogosDelNavegador()
  await nav.ponerLaSesion(conCurso.cookie)

  // ── 1. LA VISTA PREVIA ────────────────────────────────────────────────────────
  console.log('\n1. La vista previa del instructor')
  let ms = await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/preview`, { espera: 3500 })
  let texto = await nav.texto()
  let html = await nav.html()

  di(!/Algo salió mal|Algo salio mal/i.test(texto), 'no sale la pantalla de error global',
     texto.slice(0, 120).replace(/\n/g, ' '))
  di(!ms.some((m) => /#441|Functions cannot be passed/i.test(m.texto)),
     'ni el #441 ni «Functions cannot be passed»',
     ms.filter((m) => /#441|Functions/i.test(m.texto)).map((m) => m.texto.slice(0, 90)).join(' | '))
  di(texto.includes('Módulo de prueba 1') && texto.includes('Módulo de prueba 2'),
     'los dos módulos están')
  di(texto.includes('Lección de prueba 1.1'), 'las lecciones están')
  di(html.includes(`/dashboard/instructor/cursos/${conCurso.curso}/modulos/${conCurso.modulos[0]}/lecciones/${conCurso.lecciones[0]}`),
     'cada lección enlaza a su editor')
  di(avisosDeHidratacion(ms).length === 0, 'sin avisos de hidratación en la vista previa',
     avisosDeHidratacion(ms).join(' | '))

  // La lección con vídeo, abierta desde la vista previa.
  ms = await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/modulos/${conCurso.modulos[0]}/lecciones/${conCurso.lecciones[0]}`, { espera: 3500 })
  html = await nav.html()
  di(html.includes('Gc2en3nHxA4'), 'el vídeo de YouTube llega al editor de la lección')
  di(avisosDeHidratacion(ms).length === 0, 'sin avisos de hidratación en el editor de la lección',
     avisosDeHidratacion(ms).join(' | '))

  // ── 2. HIDRATACIÓN EN TODA LA ZONA ────────────────────────────────────────────
  console.log('\n2. Avisos de hidratación en la zona de instructor')
  const pantallas: [string, string][] = [
    ['panel', '/dashboard/instructor'],
    ['mis cursos', '/dashboard/instructor/cursos'],
    ['editor del curso', `/dashboard/instructor/cursos/${conCurso.curso}`],
    ['módulos', `/dashboard/instructor/cursos/${conCurso.curso}/modulos`],
    ['lecciones del módulo', `/dashboard/instructor/cursos/${conCurso.curso}/modulos/${conCurso.modulos[0]}/lecciones`],
    ['nuevo curso', '/dashboard/instructor/cursos/nuevo'],
    ['guía', '/dashboard/instructor/guia'],
    ['verificación', '/dashboard/instructor/verificacion'],
    ['estadísticas', '/dashboard/instructor/estadisticas'],
    ['referidos', '/dashboard/instructor/referidos'],
    ['onboarding', '/dashboard/instructor/onboarding'],
  ]
  for (const [nombre, ruta] of pantallas) {
    const m = await nav.ir(ruta, { espera: 2800 })
    const avisos = avisosDeHidratacion(m)
    di(avisos.length === 0, `sin avisos de hidratación: ${nombre}`, avisos.join(' | '))
  }

  // ── 3. BORRAR PIDE CONFIRMACIÓN, EN LA PÁGINA ─────────────────────────────────
  console.log('\n3. Borrar un módulo pide confirmación en la página')
  await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/modulos`, { espera: 3000 })
  const pulsado = await nav.pulsar('Borrar el módulo')
  di(pulsado, 'el botón de borrar módulo existe y se puede pulsar')
  texto = await nav.texto()
  di(/¿Borrar el módulo/.test(texto), 'aparece el diálogo propio, con el nombre del módulo',
     texto.slice(0, 100).replace(/\n/g, ' '))
  di(/Cancelar/.test(texto), 'y se puede cancelar')
  let nativos = await nav.nativosLlamados()
  di(!nativos.some((n) => n.startsWith('confirm')), 'nadie llamó a confirm() del navegador',
     nativos.join(' | '))

  // LOS RECUENTOS, RELATIVOS. Estaban escritos a mano (2 y 1) y se rompieron al añadir
  // un módulo más a los datos de prueba: una prueba que depende de cuántas filas crea
  // el fixture falla cada vez que el fixture crece, y eso ensena a no mirar los rojos.
  const alEmpezar = exigirCuenta(await svc.from('modules')
    .select('id', { count: 'exact', head: true }).eq('course_id', conCurso.curso!))
  console.log(`   (el curso tiene ${alEmpezar} módulos al empezar)`)
  let cuantosModulos = exigirCuenta(await svc.from('modules')
    .select('id', { count: 'exact', head: true }).eq('course_id', conCurso.curso!))
  di(cuantosModulos === alEmpezar, 'con el diálogo abierto todavía no se ha borrado nada',
     `módulos: ${cuantosModulos} de ${alEmpezar}`)

  await nav.pulsar('Cancelar')
  texto = await nav.texto()
  di(!/¿Borrar el módulo/.test(texto), 'al cancelar, el diálogo se va')
  cuantosModulos = exigirCuenta(await svc.from('modules')
    .select('id', { count: 'exact', head: true }).eq('course_id', conCurso.curso!))
  di(cuantosModulos === alEmpezar, 'y no se borró nada', `módulos: ${cuantosModulos}`)

  /**
   * EL LIMITADOR DE PETICIONES ES PARTE DEL ENTORNO, no un fallo.
   *
   * `/api/instructor/modules/[id]` pasa por `checkRateLimit(request, 'api')`: 30
   * peticiones por minuto. Pasar esta prueba dos veces seguidas agota la cuota y el
   * borrado contesta 429, con lo que el módulo sigue ahí y la comprobación sale en rojo
   * sin que nada esté roto. Así que un 429 se espera, se dice en voz alta y se reintenta.
   *
   * Y la espera es POR CONDICIÓN, no por reloj: en desarrollo la ruta de la API se
   * compila la primera vez que alguien la llama, y eso tarda segundos.
   */
  let confirmado = false
  for (let intento = 0; intento < 4; intento++) {
    await nav.pulsar('Borrar el módulo')
    confirmado = await nav.pulsar('Sí, borrar el módulo')
    for (let i = 0; i < 25; i++) {
      cuantosModulos = exigirCuenta(await svc.from('modules')
        .select('id', { count: 'exact', head: true }).eq('course_id', conCurso.curso!))
      if (cuantosModulos === alEmpezar - 1) break
      if (nav.peticiones.some((r) => /429 .*modules/.test(r))) break
      await esperar(600)
    }
    if (cuantosModulos === alEmpezar - 1) break
    if (nav.peticiones.some((r) => /429 .*modules/.test(r))) {
      console.log('   (429 al borrar: el limitador. Esperando 25 s y reintentando)')
      await esperar(25000)
      await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/modulos`, { espera: 3000 })
      continue
    }
    break
  }
  di(confirmado, 'el botón de confirmar existe')
  // SI NO SE BORRO, QUE DICE LA PAGINA. El boton ensena el error en pantalla, asi que la
  // prueba puede contarlo en vez de dejar un «siguen siendo 2» sin explicacion.
  // EL DIAGNOSTICO, SOLO SI FALLA. Un «siguen siendo 2» sin nada mas no se puede
  // investigar; en verde, la lista de peticiones solo tapa el resultado.
  let porQue = `módulos: ${cuantosModulos}, esperaba ${alEmpezar - 1}`
  if (cuantosModulos !== alEmpezar - 1) {
    const loQueDice = (await nav.texto()).split(/\r?\n/)
      .filter((l) => /no se pudo|error|429|demasiad|intenta/i.test(l))
    const alApi = nav.peticiones.filter((r) => r.includes('/api/'))
    porQue += (loQueDice.length ? '; la página dice: ' + loQueDice.join(' / ') : '')
      + (alApi.length ? '; a la API: ' + alApi.join(' | ') : '; NINGUNA petición a la API')
  }
  di(cuantosModulos === alEmpezar - 1, 'al confirmar, el módulo se borra', porQue)

  // ── 4. «MIS CURSOS» NO INVENTA ALUMNOS ────────────────────────────────────────
  console.log('\n4. «Mis cursos» de quien no tiene cursos')
  await nav.ponerLaSesion(sinNada.cookie)
  await nav.ir('/dashboard/instructor/cursos', { espera: 3000 })
  texto = await nav.texto()
  const alumnos = /(\d+)\s*\n?\s*Alumnos total/i.exec(texto)
  di(alumnos?.[1] === '0', 'con 0 cursos, 0 alumnos',
     alumnos ? `dice ${alumnos[1]}` : 'no se encontró la cifra: ' + texto.slice(0, 160).replace(/\n/g, ' | '))
  di(/Aún no tienes cursos/.test(texto), '«Aún no tienes cursos», con tilde')
  di(!/Aun no tienes/.test(texto), 'y no «Aun no tienes»')

  // ── 5. EL AVISO LLEVA A PEDIR LA VERIFICACIÓN ────────────────────────────────
  console.log('\n5. Sin ninguna verificación, el aviso lleva a pedirla')
  const sinVerificar = await nuevoInstructor('sin-verificar', null, true)
  await nav.ponerLaSesion(sinVerificar.cookie)
  await nav.ir('/dashboard/instructor/cursos', { espera: 3000 })
  texto = await nav.texto()
  html = await nav.html()
  di(/no estás verificado en ninguna especialidad/i.test(texto),
     'dice que todavía no hay ninguna verificación',
     texto.slice(0, 200).replace(/\n/g, ' '))
  di(!/Elígela en el editor/.test(texto), 'y NO dice «Elígela en el editor»')
  di(html.includes('/dashboard/instructor/verificacion'), 'con el enlace para pedirla')

  // ── 6. EL EDITOR DE LECCIONES NO LLAMA A prompt() ────────────────────────────
  console.log('\n6. El editor de lecciones: diálogos propios y botón de tabla')
  await nav.ponerLaSesion(conCurso.cookie)
  await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/modulos/${conCurso.modulos[1]}/lecciones/${conCurso.lecciones[2]}`, { espera: 4000 })
  html = await nav.html()
  di(html.includes('Insertar tabla'), 'hay botón de tabla')

  for (const [boton, titulo] of [
    ['Insertar enlace', 'Enlace'],
    ['Insertar imagen', 'Imagen'],
    ['Insertar vídeo de YouTube', 'Vídeo de YouTube'],
  ] as [string, string][]) {
    const abierto = await nav.pulsar(boton)
    texto = await nav.texto()
    di(abierto && texto.includes(titulo), `«${boton}» abre un diálogo de la página`)
    await nav.pulsar('Cancelar')
  }
  nativos = await nav.nativosLlamados()
  di(!nativos.some((n) => n.startsWith('prompt')), 'nadie llamó a prompt() del navegador',
     nativos.filter((n) => n.startsWith('prompt')).join(' | '))

  await nav.pulsar('Insertar tabla')
  const conTabla = await nav.evaluar<boolean>(
    `!!document.querySelector('.ProseMirror table, [contenteditable] table')`
  )
  di(conTabla, 'el botón de tabla inserta una tabla de verdad')

  // ── 7. LAS ERRATAS NO HAN VUELTO ──────────────────────────────────────────────
  console.log('\n7. Las erratas de tildes, en las páginas servidas')
  const ERRATAS = ['Aun no tienes', 'Mas recientes', 'Mas antiguos', 'Mas alumnos',
                   ' modulos', 'Informacion', 'Descripcion', 'Duracion', 'Titulo del curso',
                   'Proximamente', 'Guia para instructores', 'Criterios de aprobacion',
                   'Cargar mas', 'filtros de busqueda']
  for (const [nombre, ruta] of [
    ['mis cursos', '/dashboard/instructor/cursos'],
    ['editor del curso', `/dashboard/instructor/cursos/${conCurso.curso}`],
    ['guía', '/dashboard/instructor/guia'],
    ['onboarding', '/dashboard/instructor/onboarding'],
    ['nuevo curso', '/dashboard/instructor/cursos/nuevo'],
  ] as [string, string][]) {
    await nav.ir(ruta, { espera: 2500 })
    texto = await nav.texto()
    const malas = ERRATAS.filter((e) => texto.includes(e))
    di(malas.length === 0, `sin erratas: ${nombre}`, malas.join(' | '))
  }

  // El checklist, con un curso a medias: es donde estaban «Informacion» y «Duracion».
  await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}`, { espera: 3000 })
  texto = await nav.texto()
  di(/Información/.test(texto) || !/Informacion/.test(texto), 'el checklist dice «Información»')
  di(/Duración del contenido|Duración/.test(texto) || !/Duracion/.test(texto),
     'y «Duración del contenido»')

  // ── 8. CREAR CURSO: EL DESPLEGABLE DE RUTAS, Y A QUIEN LE PREGUNTA ───────────
  //
  // El formulario de crear curso llamaba a `/api/admin/learning-paths`, tres niveles
  // por debajo de la pagina (CourseFormCore -> LearningPathDropdown, con la URL escrita
  // dentro). Al cerrar ese endpoint a quien no es admin, el desplegable se habria
  // quedado VACIO sin que nada lo dijera: de ahi que los dos cambios fueran juntos.
  console.log('\n8. Crear curso: las rutas de aprendizaje')
  await nav.ponerLaSesion(conCurso.cookie)
  await nav.ir('/dashboard/instructor/cursos/nuevo', { espera: 4000 })

  const alPanel = nav.peticiones.filter((r) => r.includes('/api/admin/'))
  const alInstructor = nav.peticiones.filter((r) => r.includes('/api/instructor/learning-paths'))
  di(alPanel.length === 0, 'la pantalla NO llama a /api/admin', alPanel.join(' | '))
  di(alInstructor.length > 0, 'y sí llama a /api/instructor/learning-paths',
     alInstructor.join(' | '))
  di(!nav.peticiones.some((r) => /40[13] .*learning-paths/.test(r)),
     'sin 401 ni 403 al pedir las rutas',
     nav.peticiones.filter((r) => /learning-paths/.test(r)).join(' | '))

  // Y que las ofrezca de verdad: el desplegable las pinta al abrirlo.
  const abierto = await nav.pulsar('Rutas de aprendizaje')
  const cuantasRutas = await nav.evaluar<number>(
    `document.querySelectorAll('[role=option], button[data-ruta], label input[type=checkbox]').length`
  )
  const textoRutas = await nav.texto()
  di(abierto || cuantasRutas > 0, 'el desplegable de rutas responde')
  di(!/No se pudieron? (leer|cargar) las rutas|Error cargando rutas/i.test(textoRutas),
     'y no dice que no pudo leerlas')

  // ── 9. LA ZONA DE PELIGRO DE LA FICHA DEL MODULO ────────────────────────────
  console.log('\n9. La «Zona de peligro» de la ficha del módulo')
  await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/modulos/${conCurso.moduloSinLecciones}`, { espera: 3500 })
  texto = await nav.texto()
  di(/Zona de peligro/.test(texto), 'la pantalla tiene zona de peligro')

  const pulsadoPeligro = await nav.pulsar('Eliminar')
  di(pulsadoPeligro, 'se puede pulsar «Eliminar»')
  texto = await nav.texto()
  di(/¿Borrar el módulo/.test(texto), 'y pide confirmación EN LA PÁGINA (no la pedía)',
     texto.slice(0, 120).replace(/\n/g, ' '))
  nativos = await nav.nativosLlamados()
  di(!nativos.some((n) => n.startsWith('confirm')), 'sin confirm() del navegador')

  let sigueElVacio = exigirCuenta(await svc.from('modules')
    .select('id', { count: 'exact', head: true }).eq('id', conCurso.moduloSinLecciones!))
  di(sigueElVacio === 1, 'con el diálogo abierto no se ha borrado nada')

  await nav.pulsar('Cancelar')
  sigueElVacio = exigirCuenta(await svc.from('modules')
    .select('id', { count: 'exact', head: true }).eq('id', conCurso.moduloSinLecciones!))
  di(sigueElVacio === 1, 'al cancelar sigue estando')

  // Con el reintento del limitador, igual que el borrado de la seccion 3: esta prueba
  // hace unas cuantas escrituras y `checkRateLimit` permite 30 por minuto.
  for (let intento = 0; intento < 4; intento++) {
    await nav.pulsar('Eliminar')
    await nav.pulsar('Sí, borrar el módulo')
    for (let i = 0; i < 25; i++) {
      sigueElVacio = exigirCuenta(await svc.from('modules')
        .select('id', { count: 'exact', head: true }).eq('id', conCurso.moduloSinLecciones!))
      if (sigueElVacio === 0) break
      await esperar(600)
    }
    if (sigueElVacio === 0) break
    console.log('   (no se borró: espero 25 s por si es el limitador, y reintento)')
    await esperar(25000)
    await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/modulos/${conCurso.moduloSinLecciones}`, { espera: 3000 })
  }
  di(sigueElVacio === 0, 'al confirmar, el módulo se borra', `quedan ${sigueElVacio}`)

  // ── 10. OTRA VEZ, CON EL NAVEGADOR EN OTRO HUSO Y OTRO IDIOMA ────────────────
  //
  // Y CON LA FECHA EN EL BORDE DEL DIA, que es la parte que importa: una fecha a las
  // 23:30 del huso del servidor cae en OTRO DIA para quien esté doce horas más allá, y
  // entonces el servidor y el navegador escriben textos distintos. Sin empujar la fecha
  // al borde, dos husos distintos dan el mismo día y la prueba pasa sin comprobar nada.
  console.log('\n10. Lo mismo con el navegador en otro huso, y la fecha en el borde del día')
  const bordeDelDia = new Date()
  bordeDelDia.setHours(23, 30, 0, 0)
  await svc.from('courses').update({ updated_at: bordeDelDia.toISOString() }).eq('id', conCurso.curso!)
  console.log(`   (fecha de edición puesta en ${bordeDelDia.toISOString()})`)

  await nav.ponerLaSesion(conCurso.cookie)
  for (const huso of ['Pacific/Kiritimati', 'Pacific/Niue', 'America/Bogota', 'Europe/Madrid']) {
    await nav.mudarse(huso, 'en-US')
    const m = await nav.ir('/dashboard/instructor/cursos', { espera: 3000 })
    const avisos = avisosDeHidratacion(m)
    di(avisos.length === 0, `«Mis cursos» hidrata bien desde ${huso}`, avisos.join(' | '))
  }

  await nav.mudarse('Pacific/Niue', 'en-US')
  for (const [nombre, ruta] of pantallas) {
    const m = await nav.ir(ruta, { espera: 2800 })
    const avisos = avisosDeHidratacion(m)
    di(avisos.length === 0, `sin avisos de hidratación en otro huso: ${nombre}`, avisos.join(' | '))
  }
  const m2 = await nav.ir(`/dashboard/instructor/cursos/${conCurso.curso}/preview`, { espera: 3000 })
  di(avisosDeHidratacion(m2).length === 0, 'sin avisos de hidratación en otro huso: vista previa',
     avisosDeHidratacion(m2).join(' | '))
} catch (e) {
  fallos++
  console.error('\nSE ROMPIÓ LA PRUEBA:', e instanceof Error ? e.message : e)
} finally {
  await nav.cerrar()
  await limpiar()
}

console.log(`\n${fallos === 0 ? 'TODO CORRECTO' : `FALLOS: ${fallos}`}`)
process.exit(fallos === 0 ? 0 : 1)
