// lib/auth/requireMentor.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Requires the user to have mentor or admin role.
 * Redirects to /dashboard if not authorized.
 */
export async function requireMentor() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    redirect("/login?redirect=/dashboard/mentor");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  const allowed = new Set(["mentor", "admin"]);
  if (!allowed.has(profile.role)) {
    redirect("/dashboard");
  }

  return {
    userId: user.id,
    role: profile.role as "mentor" | "admin",
    fullName: profile.full_name,
    email: profile.email,
  };
}
