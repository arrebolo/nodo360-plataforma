// lib/auth/requireInstructor.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireInstructorLike() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    redirect("/login?redirect=/dashboard/instructor/cursos");
  }

  // Tu estándar: public.users.role (student, instructor, mentor, admin)
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  const allowed = new Set(["instructor", "mentor", "admin"]);
  if (!allowed.has(profile.role)) {
    // Usuario no autorizado para esta sección, redirigir al dashboard
    redirect("/dashboard");
  }

  return { userId: user.id, role: profile.role as "instructor" | "mentor" | "admin" };
}


