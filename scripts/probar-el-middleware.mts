/**
 * La puerta de las rutas privadas: que niegue sin cerrar la sesión.
 *
 *   npx tsx scripts/probar-el-middleware.mts [http://localhost:3151]
 *
 * LOS TRES FALLOS
 *
 *   1. Un desvío del middleware se llevaba por delante la sesión. Con el token de
 *      acceso caducado, `getUser()` lo refresca y las cookies nuevas se escriben en la
 *      respuesta que hay delante; al devolver un `redirect()` —otra respuesta— se
 *      tiraban. El refresh ya estaba consumido, así que el navegador se quedaba con un
 *      refresh token gastado: sesión muerta por intentar entrar donde no toca.
 *
 *   2. «No hay sesión» y «no se pudo comprobar» acababan en el mismo sitio: /login.
 *
 *   3. La suspensión se leía con la sesión de la propia persona, y `is_suspended` está
 *      cerrada a `authenticated`: 42501, fila vacía, y la puerta nunca se cerraba.
 *      Medido antes de tocar nada. Ahora lo contesta `estoy_suspendido()` (118).
 *
 *   4. Y había una puerta de atrás por la URL: con `?_p=1` —un escape anti-bucle— el
 *      middleware devolvía `next()` ANTES de mirar la sesión, así que `/dashboard?_p=1`
 *      entraba sin comprobar nada. Se prueba en las tres zonas privadas.
 *
 * El caso 2 de punta a punta necesitaría un Supabase que no contestara, y la URL se
 * fija al construir. Así que la clasificación se comprueba sobre la función, y se dice
 * que es así en vez de disimularlo.
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

const MARCA = 'qa-middleware'
const CLAVE = 'Probar-' + Math.random().toString(36).slice(2) + 'K3!'
const NOMBRE_COOKIE = `sb-${REF}-auth-token`
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}
const galleta = (sesion: unknown) =>
  `${NOMBRE_COOKIE}=base64-${Buffer.from(JSON.stringify(sesion), 'utf8').toString('base64url')}`

const creado: string[] = []

const pedir = async (ruta: string, cookie?: string) => {
  const r = await fetch(`${SITIO}${ruta}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: 'manual',
  })
  return {
    status: r.status,
    destino: r.headers.get('location') ?? '',
    puestas: r.headers.getSetCookie?.() ?? [],
  }
}

async function nuevaCuenta(sufijo: string) {
  const correo = `${MARCA}-${sufijo}-${Date.now()}@nodo360-pruebas.invalid`
  const { data: u, error } = await svc.auth.admin.createUser({
    email: correo, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(error.message)
  creado.push(u!.user.id)
  const { data: s, error: elog } = await createClient(URL_BASE, ANON, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email: correo, password: CLAVE })
  if (elog || !s.session) throw new Error(`sesion: ${elog?.message}`)
  return { id: u!.user.id, correo, sesion: s.session }
}

/** La misma sesión, pero diciéndole al cliente que el token ya caducó: eso fuerza el refresco. */
const caducada = (sesion: Record<string, unknown>) => ({
  ...sesion,
  expires_at: Math.floor(Date.now() / 1000) - 60,
  expires_in: -60,
})

try {
  if (!(await fetch(`${SITIO}/api/admin/quiz?courseId=x`).then((r) => r.status).catch(() => 0))) {
    throw new Error(`no hay nada escuchando en ${SITIO}`)
  }

  // ═══ Por qué camino va la suspensión ══════════════════════════════════════
  //
  // Importa para leer el resultado: con la 118 sin aplicar, lo que se está probando es
  // el camino de reserva (cliente de servicio), no la función. Las dos respuestas deben
  // ser la misma, y por eso existe la reserva, pero conviene saber cuál se midió.
  const sonda = await svc.rpc('estoy_suspendido' as never)
  console.log(
    `\n=== la suspensión va por: ${
      sonda.error ? `el camino de reserva (estoy_suspendido() no existe: ${sonda.error.code})` : 'estoy_suspendido() (118 aplicada)'
    } ===`
  )

  // ═══ La clasificación de errores ══════════════════════════════════════════
  console.log('\n=== «no hay sesión» frente a «no se pudo comprobar» ===')
  const { noSePudoComprobar, ES_COOKIE_DE_SESION } = await import('../middleware.ts')
  di(noSePudoComprobar({ name: 'AuthRetryableFetchError', status: 0 }) === true,
    'un fallo de red (AuthRetryableFetchError): no se pudo comprobar')
  di(noSePudoComprobar({ name: 'AuthApiError', status: 503 }) === true, 'un 503: no se pudo comprobar')
  di(noSePudoComprobar({ name: 'AuthApiError', status: 401 }) === false, 'un 401: el token no vale')
  di(noSePudoComprobar({ name: 'AuthSessionMissingError', status: 400 }) === false, 'un 400: no hay sesión')
  di(noSePudoComprobar(null) === false, 'sin error: no hay sesión')
  di(ES_COOKIE_DE_SESION.test(NOMBRE_COOKIE) && ES_COOKIE_DE_SESION.test(`${NOMBRE_COOKIE}.0`),
    'se reconoce la cookie de sesión, entera y troceada')
  di(!ES_COOKIE_DE_SESION.test('n360_curso_empezado'), 'y no confunde otras cookies')

  // ═══ Sin sesión, y con una inservible ═════════════════════════════════════
  console.log('\n=== sin sesión ===')
  const sinNada = await pedir('/dashboard')
  di(sinNada.status === 307 && sinNada.destino.includes('/login'),
    'sin cookie: al login', `${sinNada.status} ${sinNada.destino}`)
  di(sinNada.destino.includes('redirect=%2Fdashboard') || sinNada.destino.includes('redirect=/dashboard'),
    'y se recuerda a dónde quería ir')

  const basura = await pedir('/dashboard', `${NOMBRE_COOKIE}=base64-${Buffer.from('{"access_token":"x","refresh_token":"y"}').toString('base64url')}`)
  di(basura.status === 307 && basura.destino.includes('/login'),
    'con una cookie inservible: al login, no «no se pudo comprobar»',
    `${basura.status} ${basura.destino}`)

  // ═══ Con sesión ═══════════════════════════════════════════════════════════
  console.log('\n=== con sesión ===')
  const normal = await nuevaCuenta('normal')
  const conSesion = await pedir('/dashboard', galleta(normal.sesion))
  di(conSesion.status === 200, 'entra en /dashboard', String(conSesion.status))

  const admin = await pedir('/admin', galleta(normal.sesion))
  di(admin.status === 307 && admin.destino.includes('/dashboard'),
    'a /admin se le niega el paso (lo hace la guarda de la página)',
    `${admin.status} ${admin.destino}`)
  const despues = await pedir('/dashboard', galleta(normal.sesion))
  di(despues.status === 200, 'y la sesión sigue viva después de la negativa', String(despues.status))

  // ═══ EL FALLO 1: un desvío con refresco de token ══════════════════════════
  console.log('\n=== denegar con el token caducado no puede cerrar la sesión ===')
  const suspendida = await nuevaCuenta('suspendida')
  const { error: eSusp } = await svc.from('users')
    .update({ is_suspended: true, suspended_reason: 'Prueba del middleware' })
    .eq('id', suspendida.id)
  di(!eSusp, 'se puede suspender la cuenta de prueba', eSusp?.message ?? '')

  const desvio = await pedir('/dashboard', galleta(caducada(suspendida.sesion as unknown as Record<string, unknown>)))
  di(desvio.status === 307 && desvio.destino.includes('/cuenta-suspendida'),
    'una cuenta suspendida SÍ se para ahora (antes el 42501 dejaba la puerta abierta)',
    `${desvio.status} ${desvio.destino}`)
  const refrescadas = desvio.puestas.filter((c) => c.startsWith(`sb-${REF}-auth-token`))
  di(refrescadas.length > 0,
    'y el desvío devuelve la sesión refrescada, en vez de tirarla',
    `${desvio.puestas.length} cookies, ${refrescadas.length} de sesión`)

  // Y que la cookie devuelta sirva de verdad: se quita la suspensión y se usa.
  if (refrescadas.length > 0) {
    await svc.from('users').update({ is_suspended: false, suspended_reason: null }).eq('id', suspendida.id)
    const valor = refrescadas[0].split(';')[0]
    const conLaNueva = await pedir('/dashboard', valor)
    di(conLaNueva.status === 200,
      'con la cookie que devolvió el desvío se sigue navegando', String(conLaNueva.status))
  }

  // La excepcion de los admins (`fila.role !== 'admin'`) no se prueba aqui: haria
  // falta suspender una cuenta de admin, y no se crean cuentas de admin para probar ni
  // se toca una de verdad. Es la misma condicion que ya habia.

  // ═══ EL FALLO 4: ningún parámetro de la URL se salta la puerta ════════════
  console.log('\n=== ?_p=1 ya no es una puerta de atrás ===')
  const suspendidaOtraVez = await nuevaCuenta('conparametro')
  await svc.from('users')
    .update({ is_suspended: true, suspended_reason: 'Prueba del parametro' })
    .eq('id', suspendidaOtraVez.id)

  for (const ruta of ['/dashboard', '/dashboard/instructor', '/admin']) {
    const r = await pedir(`${ruta}?_p=1`, galleta(suspendidaOtraVez.sesion))
    di(r.status === 307 && r.destino.includes('/cuenta-suspendida'),
      `suspendida en ${ruta}?_p=1: a /cuenta-suspendida`,
      `${r.status} ${r.destino}`)
  }
  // Y con cualquier otro parámetro inventado, lo mismo.
  const otroParametro = await pedir('/dashboard?_p=1&salto=1&next=/admin', galleta(suspendidaOtraVez.sesion))
  di(otroParametro.status === 307 && otroParametro.destino.includes('/cuenta-suspendida'),
    'con más parámetros inventados, igual', `${otroParametro.status} ${otroParametro.destino}`)

  for (const ruta of ['/dashboard', '/dashboard/instructor', '/admin']) {
    const r = await pedir(`${ruta}?_p=1`)
    di(r.status === 307 && r.destino.includes('/login'),
      `sin sesión en ${ruta}?_p=1: al login`, `${r.status} ${r.destino}`)
  }

  const laPagina = await pedir('/cuenta-suspendida?reason=Prueba')
  di(laPagina.status === 200, '/cuenta-suspendida responde 200', String(laPagina.status))

  // ═══ LA DEFENSA EN PROFUNDIDAD, con una ruta que el middleware NO ve ══════
  //
  // El matcher es ['/dashboard/:path*', '/admin/:path*'], y `app/(private)/` tiene una
  // tercera rama: /gobernanza/mentores. Ahí el middleware no corre, así que quien
  // decide es el layout de lo privado. Es exactamente el caso para el que existe.
  console.log('\n=== una ruta privada que el middleware no cubre ===')
  const fueraDelMatcher = await pedir('/gobernanza/mentores', galleta(suspendidaOtraVez.sesion))
  di(fueraDelMatcher.status === 307 && fueraDelMatcher.destino.includes('/cuenta-suspendida'),
    '/gobernanza/mentores con cuenta suspendida: la para el LAYOUT',
    `${fueraDelMatcher.status} ${fueraDelMatcher.destino}`)

  await svc.from('users').update({ is_suspended: false, suspended_reason: null })
    .eq('id', suspendidaOtraVez.id)

  // ═══ Rutas públicas, intactas ═════════════════════════════════════════════
  console.log('\n=== las rutas públicas no las toca ===')
  for (const ruta of ['/', '/cursos', '/login']) {
    const r = await pedir(ruta)
    di(r.status === 200, `${ruta}: 200`, String(r.status))
  }
} catch (e) {
  fallos++
  console.log(`\n   EXPLOTO: ${e instanceof Error ? e.message : String(e)}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creado) await svc.auth.admin.deleteUser(id)
  const { count: cuentas } = await svc.from('users')
    .select('id', { count: 'exact' }).ilike('email', `${MARCA}-%`).limit(0)
  const { count: suspendidas } = await svc.from('users')
    .select('id', { count: 'exact' }).eq('is_suspended', true).limit(0)

  console.log(`\nfallos ${fallos}, cuentas_de_prueba ${cuentas ?? 0}, suspendidas_en_total ${suspendidas ?? 0}`)
  console.log(fallos === 0 && (cuentas ?? 0) === 0 ? 'TODO CORRECTO\n' : 'REVISAR\n')
  process.exit(fallos === 0 ? 0 : 1)
}
