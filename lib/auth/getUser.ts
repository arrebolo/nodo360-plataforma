import { createClient } from "@/lib/supabase/server";
import { User } from "@/types/database";

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

  // Fetch full user profile from the users table
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError || !userProfile) {
    return null;
  }

  return userProfile;
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
