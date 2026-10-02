import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { comprobarSuspension, urlDeCuentaSuspendida } from '@/lib/auth/suspension'

/**
 * La puerta de las rutas privadas.
 *
 * TRES REGLAS, y las tres salen de fallos medidos:
 *
 *   1. DENEGAR UNA RUTA NO PUEDE CERRAR LA SESION. Cuando el token de acceso está
 *      caducado, `getUser()` lo refresca y el cliente escribe las cookies nuevas en la
 *      respuesta que tenga delante. Si después devolvemos un `NextResponse.redirect()`
 *      —otra respuesta—, esas cookies se quedan en la que se tira: el refresh ya se
 *      consumió en el servidor y el navegador se queda con un refresh token gastado.
 *      Sesión muerta por intentar entrar donde no toca. Aquí las cookies se apuntan y
 *      se aplican a CUALQUIER respuesta que salga de este fichero.
 *
 *   2. «NO HAY SESION» NO ES «NO SE PUDO COMPROBAR». Si Supabase no contesta,
 *      `getUser()` devuelve `user: null` igual que si no hubiera sesión, y antes eso
 *      mandaba a /login a alguien que sí la tenía. Se distinguen: sin cookie de sesión
 *      no hay sesión; con cookie y un fallo de red o un 5xx, no se sabe, y entonces la
 *      petición sigue. Esto no abre nada: la seguridad la ponen la RLS y las guardas de
 *      cada página (`requireAdmin`, `requireInstructorLike`), no este fichero, que solo
 *      ahorra un viaje.
 *
 *   3. UNA LECTURA QUE FALLA NO ES UN «NO». La suspensión se leía con la sesión de la
 *      propia persona, y `users.is_suspended` está cerrada a `authenticated`: la
 *      consulta entera moría con 42501, `userRow` llegaba vacío y la puerta NO se
 *      cerraba nunca. Medido. Ahora lo contesta `estoy_suspendido()` (migración 118), y
 *      si no se puede averiguar se dice en el log en vez de dar por hecho que no.
 *
 *   4. NINGUN PARAMETRO DE LA URL SE SALTA NADA. Había un escape anti-bucle: con
 *      `?_p=1` el middleware devolvía `next()` ANTES de mirar la sesión, así que
 *      `/dashboard?_p=1` entraba sin comprobar nada —ni sesión ni suspensión—. Y era
 *      inútil: los dos destinos a los que se desvía, /login y /cuenta-suspendida, son
 *      públicos y no pasan por aquí, así que no hay bucle que evitar. Fuera.
 *
 * Y ESTO NO ES LA UNICA PUERTA: el layout de las páginas privadas comprueba lo mismo.
 * Un middleware se puede saltar de muchas maneras —un matcher que no cubre una ruta
 * nueva, un despliegue a medias—, y la comprobación que no se salta es la que está en
 * el render.
 */

const PREFIJOS_PRIVADOS = ['/dashboard', '/admin']

/** El nombre de la cookie de sesión de Supabase, troceada o no. */
export const ES_COOKIE_DE_SESION = /^sb-.+-auth-token(\.\d+)?$/

/**
 * ¿Este error significa «no se pudo comprobar» en vez de «no hay sesión»?
 *
 * `AuthRetryableFetchError` es justo eso: fallo de red o 5xx. Un 400/401/403 sí es un
 * token inválido o ausente.
 */
export function noSePudoComprobar(error: unknown): boolean {
  if (!error) return false
  const e = error as { name?: string; status?: number }
  if (e.name === 'AuthRetryableFetchError') return true
  if (typeof e.status === 'number') return e.status >= 500
  // Sin status y sin nombre conocido: no se sabe qué ha pasado, y no saberlo no es
  // motivo para cerrarle la sesión a nadie.
  return true
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1) Ficheros estáticos y API, fuera
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/beta') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // 2) Solo las rutas privadas
  if (!PREFIJOS_PRIVADOS.some((prefijo) => pathname.startsWith(prefijo))) {
    return NextResponse.next()
  }

  // 3) El cliente de Supabase, apuntando las cookies que quiera escribir
  let response = NextResponse.next({ request: { headers: request.headers } })

  // LA SESION AL DIA, en cualquier respuesta. Ver la regla 1 de arriba.
  const galletasDeLaSesion: { name: string; value: string; options: Record<string, unknown> }[] = []
  function conLaSesionAlDia<T extends NextResponse>(respuesta: T): T {
    for (const { name, value, options } of galletasDeLaSesion) {
      respuesta.cookies.set(name, value, options)
    }
    return respuesta
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          galletasDeLaSesion.push(
            ...cookiesToSet.map(({ name, value, options }) => ({
              name,
              value,
              options: (options ?? {}) as Record<string, unknown>,
            }))
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 4) Quién es
  const { data: { user }, error: errorDeSesion } = await supabase.auth.getUser()

  if (!user) {
    const traeCookieDeSesion = request.cookies
      .getAll()
      .some((c) => ES_COOKIE_DE_SESION.test(c.name))

    // CON cookie y sin poder comprobarla: no se sabe, así que no se le cierra la
    // sesión a nadie. La página tiene su propia guarda.
    if (traeCookieDeSesion && noSePudoComprobar(errorDeSesion)) {
      console.warn(
        '[middleware] No se pudo comprobar la sesión:',
        (errorDeSesion as { name?: string; message?: string } | null)?.name,
        (errorDeSesion as { message?: string } | null)?.message,
        '— se deja pasar y decide la página'
      )
      return conLaSesionAlDia(response)
    }

    const login = new URL('/login', request.url)
    login.searchParams.set('redirect', pathname)
    return conLaSesionAlDia(NextResponse.redirect(login))
  }

  // 5) Suspensión. La política, en lib/auth/suspension.ts, compartida con el layout.
  try {
    const suspension = await comprobarSuspension(supabase, user.id)
    if (suspension.desviar) {
      console.log('[middleware] Cuenta suspendida:', user.id.slice(0, 8) + '…')
      return conLaSesionAlDia(
        NextResponse.redirect(urlDeCuentaSuspendida(request.url, suspension.motivo))
      )
    }
    if (!suspension.sePudoComprobar) {
      console.warn('[middleware] Suspensión sin comprobar: decide el layout de la página')
    }
  } catch (e) {
    // Que falle esta comprobación no puede tumbar la navegación: el layout la repite.
    console.error('[middleware] Error comprobando la suspensión:', e)
  }

  // El rol NO se comprueba aquí: lo hacen las guardas de cada página, que además
  // saben a dónde mandar a cada uno. Aquí había un cálculo de rol que no decidía
  // nada —y que encima nunca llegaba a leerse, por el 42501 de arriba—.

  return conLaSesionAlDia(response)
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
