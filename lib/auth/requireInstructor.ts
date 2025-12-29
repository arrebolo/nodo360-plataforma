// lib/auth/requireInstructor.ts
import { createClient } from "@/lib/supabase/server";

export async function requireInstructorLike() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    throw new Error("No autenticado");
  }

  // Tu estándar: public.users.role (student, instructor, mentor, admin)
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Perfil no encontrado");
  }

  const allowed = new Set(["instructor", "mentor", "admin"]);
  if (!allowed.has(profile.role)) {
    throw new Error("No autorizado");
  }

  return { userId: user.id, role: profile.role as "instructor" | "mentor" | "admin" };
}
