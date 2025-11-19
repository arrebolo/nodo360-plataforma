import { redirect } from "next/navigation";
import { getUser, getUserId } from "./getUser";

/**
 * Require authentication for a page or route
 * Redirects to login if not authenticated
 *
 * @param returnUrl - Optional return URL to redirect back after login
 * @returns The authenticated user (never returns null - redirects instead)
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { requireAuth } from "@/lib/auth/requireAuth";
 *
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *
 *   // User is guaranteed to be authenticated here
 *   return <div>Welcome {user.full_name}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom return URL
 * import { requireAuth } from "@/lib/auth/requireAuth";
 *
 * export default async function QuizPage({ params }: { params: { slug: string } }) {
 *   const user = await requireAuth(`/cursos/${params.slug}/quiz`);
 *
 *   return <Quiz userId={user.id} />;
 * }
 * ```
 */
export async function requireAuth(returnUrl?: string) {
  const user = await getUser();

  if (!user) {
    // Build login URL with return path
    const loginUrl = returnUrl
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/login";

    redirect(loginUrl);
  }

  return user;
}

/**
 * Require authentication but only return user ID
 * More efficient when you only need the ID
 *
 * @param returnUrl - Optional return URL to redirect back after login
 * @returns The user ID (never returns null - redirects instead)
 *
 * @example
 * ```tsx
 * export default async function SubmitQuizPage() {
 *   const userId = await requireAuthId();
 *
 *   // Use userId for database operations
 *   await submitQuizAttempt(userId, moduleId, answers);
 * }
 * ```
 */
export async function requireAuthId(returnUrl?: string): Promise<string> {
  const userId = await getUserId();

  if (!userId) {
    const loginUrl = returnUrl
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/login";

    redirect(loginUrl);
  }

  return userId;
}

/**
 * Check if user is authenticated without redirecting
 * Useful for conditional rendering or checking access
 *
 * @returns True if authenticated, false otherwise
 *
 * @example
 * ```tsx
 * export default async function CoursePage() {
 *   const isAuthenticated = await isAuth();
 *
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <EnrolledView />
 *       ) : (
 *         <LoginPrompt />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export async function isAuth(): Promise<boolean> {
  const userId = await getUserId();
  return userId !== null;
}

/**
 * Require specific role for access
 * Redirects to login if not authenticated, or to unauthorized page if wrong role
 *
 * @param allowedRoles - Array of allowed roles (e.g., ['admin', 'instructor'])
 * @param returnUrl - Optional return URL
 * @param unauthorizedUrl - Where to redirect if user has wrong role (default: '/')
 * @returns The authenticated user with verified role
 *
 * @example
 * ```tsx
 * export default async function AdminDashboard() {
 *   const user = await requireRole(['admin']);
 *
 *   return <AdminPanel user={user} />;
 * }
 * ```
 */
export async function requireRole(
  allowedRoles: string[],
  returnUrl?: string,
  unauthorizedUrl: string = "/"
) {
  const user = await requireAuth(returnUrl);

  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(unauthorizedUrl);
  }

  return user;
}
