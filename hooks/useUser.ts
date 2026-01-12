"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types/database";

/**
 * Hook to access the currently authenticated user
 * Returns user data and loading state
 *
 * @returns Object with user, loading, and error states
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useUser } from "@/hooks/useUser";
 *
 * export function ProfileCard() {
 *   const { user, loading } = useUser();
 *
 *   if (loading) return <Spinner />;
 *   if (!user) return <LoginPrompt />;
 *
 *   return <div>Welcome {user.full_name}</div>;
 * }
 * ```
 */
export function useUser() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Fetch full user profile
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setUser(userProfile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Fetch user profile
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser(userProfile);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

/**
 * Hook to check if user is authenticated
 * Simpler version that only returns boolean
 *
 * @returns Object with isAuthenticated and loading states
 *
 * @example
 * ```tsx
 * export function ProtectedButton() {
 *   const { isAuthenticated, loading } = useIsAuthenticated();
 *
 *   if (loading) return null;
 *
 *   return isAuthenticated ? (
 *     <button>Continue</button>
 *   ) : (
 *     <button onClick={() => router.push('/login')}>Login</button>
 *   );
 * }
 * ```
 */
export function useIsAuthenticated() {
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAuthenticated, loading };
}


