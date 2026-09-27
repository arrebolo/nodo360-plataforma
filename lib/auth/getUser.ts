import { createClient } from "@/lib/supabase/server";
import { User } from "@/types/database";
import { getMiPerfil } from "./miPerfil";

/**
 * Get the currently authenticated user from the server session
 *
 * @returns The authenticated user or null if not logged in
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { getUser } from "@/lib/auth/getUser";
 *
 * export default async function ProfilePage() {
 *   const user = await getUser();
 *
 *   if (!user) {
 *     redirect('/login');
 *   }
 *
 *   return <div>Welcome {user.full_name}</div>;
 * }
 * ```
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // El perfil va por mi_perfil(), NO por select("*") sobre users.
  //
  // Desde la migracion 049, `authenticated` solo tiene GRANT SELECT sobre seis
  // columnas de public.users (id, full_name, avatar_url, role, bio,
  // created_at). Un select("*") pide todas, asi que lo deniega Postgres: esta
  // funcion devolvia null con la sesion perfectamente viva, y requireAuth leia
  // ese null como "no ha iniciado sesion" y mandaba a /login.
  //
  // Se noto en /certificados/[id], que es el unico sitio que usa requireAuth:
  // el resto de paginas leen columnas sueltas, y por eso ninguna se rompio.
  // Con sesion iniciada, la cabecera pintaba al usuario y la pagina redirigia
  // al login, que es lo mas parecido a un fallo aleatorio que puede haber.
  //
  // mi_perfil() es la puerta que la propia 049 dejo para esto: SECURITY
  // DEFINER, devuelve la fila de auth.uid() entera y solo esa.
  const perfil = await getMiPerfil();

  if (!perfil) {
    return null;
  }

  return perfil as unknown as User;
}

/**
 * Get the current user's ID without fetching the full profile
 * Useful for quick checks or when you only need the user ID
 *
 * @returns The user ID or null if not logged in
 *
 * @example
 * ```tsx
 * const userId = await getUserId();
 * if (!userId) {
 *   redirect('/login');
 * }
 * ```
 */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * Get the current session
 * Returns both the session and user data
 *
 * @returns Session data with user, or null if not logged in
 */
export async function getSession() {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}


