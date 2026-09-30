import { createAdminClient } from '@/lib/supabase/admin'

/**
 * ¿Ha aceptado esta persona que sus logros se anuncien con su nombre?
 *
 * PRINCIPIO #8. Publicar «X ha completado el curso Y» en un grupo de Telegram es
 * publicar el nombre de alguien, y eso lo decide esa persona, no la plataforma.
 * Hasta ahora se publicaba siempre: `defaultOptions` traía `telegram: true` y
 * `discord: true`, y nadie preguntaba nada.
 *
 * Y no era solo el de los cursos. `broadcastNewUser` publicaba «X se ha unido a la
 * comunidad» al conceder acceso beta, con el mismo problema.
 *
 * POR DEFECTO, NO. La columna `anunciar_logros` nace en false (migración 113) y
 * esta función devuelve false ante cualquier duda:
 *
 *   · si la columna no existe todavía —la migración sin aplicar— devuelve false,
 *     así que el anuncio queda apagado en vez de colarse;
 *   · si la consulta falla, devuelve false;
 *   · si no hay fila, devuelve false.
 *
 * Es deliberado que el error se resuelva hacia el silencio. Al revés, un fallo de
 * lectura publicaría el nombre de alguien que nunca dijo que sí, y eso no se puede
 * deshacer borrando un mensaje.
 */
export async function puedeAnunciarSusLogros(userId: string): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient()
      .from('users')
      .select('anunciar_logros')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // 42703 mientras la 113 no esté aplicada. Cualquier otro error, igual de
      // silencioso: no publicar nunca es la opción segura.
      console.log(
        `[consentimiento] No se pudo leer anunciar_logros (${error.code}): no se anuncia nada`
      )
      return false
    }

    return (data as { anunciar_logros?: boolean } | null)?.anunciar_logros === true
  } catch (e) {
    console.error('[consentimiento] Error inesperado, no se anuncia:', e)
    return false
  }
}
