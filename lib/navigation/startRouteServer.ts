import { getMiPerfil } from '@/lib/auth/miPerfil'

// Version de SERVIDOR de getStartRoute.
//
// Vive en su propio fichero, y no junto a getStartRoute, porque esa la importa
// LogoLink, que es un componente de cliente. mi_perfil() arrastra
// @/lib/supabase/server, que usa next/headers: en el mismo modulo romperia el
// bundle del cliente.
/**
 * ESTADO: hoy NADIE importa esta funcion; la que se usa es getStartRoute(), la
 * de cliente, desde LogoLink. Se corrige en lugar de dejarla porque leia de
 * `user_selected_paths`, una tabla con 0 filas en la que nadie escribe: habria
 * mandado a /dashboard/rutas a todo el mundo, incluso teniendo ruta activa.
 *
 * La ruta activa se guarda en `users.active_path_id`, y esa columna no es
 * publica desde la 049: se lee con mi_perfil(). Como la identidad sale de la
 * sesion y no de un parametro, ya no hace falta recibir ni el cliente ni el
 * userId.
 */
export async function getStartRouteServer(): Promise<string> {
  try {
    const perfil = await getMiPerfil()

    // Sin perfil no hay sesion: a la portada.
    if (!perfil) {
      return '/'
    }

    return perfil.active_path_id ? '/dashboard' : '/dashboard/rutas'
  } catch (error) {
    console.error('[getStartRouteServer] Exception:', error)
    return '/dashboard/rutas' // Fallback seguro para usuarios con sesion
  }
}
