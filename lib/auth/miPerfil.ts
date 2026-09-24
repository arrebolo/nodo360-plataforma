import { createClient } from '@/lib/supabase/server'

/**
 * La fila propia de `public.users`, entera.
 *
 * Desde la migracion 049, `authenticated` solo tiene GRANT SELECT sobre las
 * seis columnas publicas de `users` (id, full_name, avatar_url, role, bio,
 * created_at). Un GRANT de columna es por rol, no por fila: no distingue la
 * fila propia de las ajenas, asi que cerrar las columnas ajenas cierra tambien
 * las propias.
 *
 * `mi_perfil()` es la puerta para lo propio: una funcion SECURITY DEFINER que
 * devuelve la fila de auth.uid() con todas sus columnas, y solo esa. Sin
 * sesion devuelve vacio.
 *
 * Usala para leer is_suspended, is_beta, active_path_id, avatar_path o
 * cualquier otra columna no publica del usuario actual. Para leer perfiles
 * ajenos, consulta `users` normalmente: las seis columnas publicas siguen ahi.
 */
export type MiPerfil = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  avatar_path: string | null
  role: string
  bio: string | null
  website: string | null
  twitter: string | null
  linkedin: string | null
  github: string | null
  active_path_id: string | null
  active_path_selected_at: string | null
  is_beta: boolean | null
  is_beta_enabled: boolean | null
  wants_beta_notification: boolean | null
  is_suspended: boolean | null
  suspended_at: string | null
  suspended_reason: string | null
  suspended_by: string | null
  last_seen_at: string | null
  created_at: string
  updated_at: string | null
}

export async function getMiPerfil(): Promise<MiPerfil | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('mi_perfil')

  if (error) {
    console.error('[miPerfil] Error leyendo el perfil propio:', error.message)
    return null
  }

  const filas = (data ?? []) as MiPerfil[]
  return filas[0] ?? null
}
