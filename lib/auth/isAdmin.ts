import { createClient } from '@/lib/supabase/server'

/**
 * Comprueba si el usuario de la sesion es admin, sin redirigir.
 *
 * Es la version no bloqueante de requireAdmin(): esa redirige y sirve para
 * proteger paginas enteras; esta solo responde si o no, y sirve para decidir
 * que se muestra dentro de una pagina publica (por ejemplo, si se listan las
 * rutas vacias o los cursos sin publicar).
 *
 * @param knownUserId Id ya resuelto de la sesion, si quien llama lo tiene.
 *                    Se pasa solo para ahorrar una llamada; nunca es una
 *                    identidad que venga del cliente.
 */
export async function isCurrentUserAdmin(knownUserId?: string | null): Promise<boolean> {
  const supabase = await createClient()

  let userId = knownUserId ?? null
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  }

  if (!userId) return false

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'admin'
}
