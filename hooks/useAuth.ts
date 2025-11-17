"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "./useUser";

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

interface SignInData {
  email: string;
  password: string;
}

/**
 * Complete authentication hook with login, logout, and session management
 *
 * @returns Authentication methods and user state
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useAuth } from "@/hooks/useAuth";
 *
 * export function LoginForm() {
 *   const { signIn, loading, error } = useAuth();
 *   const [email, setEmail] = useState('');
 *   const [password, setPassword] = useState('');
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     await signIn({ email, password });
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input value={email} onChange={(e) => setEmail(e.target.value)} />
 *       <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
 *       <button disabled={loading}>Sign In</button>
 *       {error && <p>{error.message}</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Sign in with email and password
   */
  const signIn = async ({ email, password }: SignInData) => {
    try {
      setLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Check for return URL in query params
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl") || "/";

      router.push(returnUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to sign in"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up with email, password, and full name
   */
  const signUp = async ({ email, password, fullName }: SignUpData) => {
    try {
      setLoading(true);
      setError(null);

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("No user returned from sign up");
      }

      // Create user profile in users table
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: "student", // Default role
      } as any);

      if (profileError) {
        throw profileError;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to sign up"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to sign out"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   */
  const signInWithOAuth = async (
    provider: "google" | "github" | "discord"
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to sign in with OAuth")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset password via email
   */
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to reset password")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update password (must be logged in)
   */
  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to update password")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading: loading || userLoading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
  };
}
