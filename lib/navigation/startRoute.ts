/**
 * Determina la ruta de inicio segun el estado del usuario:
 * - No logueado -> / (landing)
 * - Logueado sin ruta activa -> /dashboard/rutas
 * - Logueado con ruta activa -> /dashboard
 *
 * IMPORTANTE: Esta funcion NUNCA debe fallar y romper la navegacion.
 * En caso de error, devuelve un fallback seguro.
 */
export async function getStartRoute(): Promise<string> {
  try {
    const res = await fetch('/api/user/select-path', {
      method: 'GET',
      credentials: 'include',
    })

    // No autenticado -> landing
    if (res.status === 401) {
      return '/'
    }

    // Error del servidor (500, 502, etc.) -> fallback a /dashboard/rutas
    // NO mandamos a landing porque el usuario puede estar logueado
    if (!res.ok) {
      console.warn('[getStartRoute] Error del servidor:', res.status)
      return '/dashboard/rutas'
    }

    const data = await res.json()

    // Verificar autenticacion del response
    if (data?.authenticated === false) {
      return '/'
    }

    // Sin ruta activa -> elegir ruta
    if (!data?.activePath) {
      return '/dashboard/rutas'
    }

    // Con ruta activa -> dashboard
    return '/dashboard'

  } catch (error) {
    // Error de red/fetch -> fallback seguro a landing
    console.error('[getStartRoute] Error de fetch:', error)
    return '/'
  }
}

// La version de servidor vive en ./startRouteServer, no aqui: necesita
// mi_perfil(), que arrastra next/headers, y este modulo lo importa LogoLink,
// que es un componente de cliente.
