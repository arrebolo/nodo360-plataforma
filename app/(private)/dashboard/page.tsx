import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Debes iniciar sesión para acceder al dashboard.
        </p>
        <Link href="/login" className="text-sm underline">
          Ir a login
        </Link>
      </div>
    );
  }

  // Tu estándar: public.users.role (enum: student, instructor, mentor, admin)
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const role = (!profileError && profile?.role ? profile.role : "student") as
    | "student"
    | "instructor"
    | "mentor"
    | "admin";

  const isAdmin = role === "admin";
  const isInstructorLike = role === "instructor" || role === "mentor" || role === "admin";

  // Recomendación futura: aquí deberías traer “última lección” y “ruta actual”.
  // Hoy lo dejamos estático con CTAs claros para no bloquear.
  const continueHref = "/rutas";
  const routesHref = "/dashboard/rutas";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* ============================
         HEADER
      ============================ */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Tu centro de aprendizaje. <span className="font-medium">Rol:</span>{" "}
          <span className="font-medium">{role}</span>
        </p>
      </header>

      {/* ============================
         BLOQUE PRINCIPAL (EDUCATIVO)
      ============================ */}
      <section className="rounded-2xl border bg-white/5 p-6 md:p-8 space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Continúa tu aprendizaje</h2>
          <p className="text-sm text-muted-foreground">
            Retoma tu ruta donde la dejaste y mantén tu progreso activo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={continueHref}
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium bg-[#ff6b35] text-white hover:bg-[#ff6b35]/90"
          >
            Continuar
          </Link>

          <Link
            href={routesHref}
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium border hover:bg-muted/30"
          >
            Ver mis rutas
          </Link>

          <Link
            href="/cursos"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium border hover:bg-muted/30"
          >
            Explorar cursos
          </Link>
        </div>

        {/* Mini métricas (sin datos reales todavía, solo estructura) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl border bg-black/20 p-4">
            <div className="text-xs text-muted-foreground">Progreso</div>
            <div className="text-sm font-medium">Siguiente paso recomendado</div>
          </div>
          <div className="rounded-xl border bg-black/20 p-4">
            <div className="text-xs text-muted-foreground">Consistencia</div>
            <div className="text-sm font-medium">Mantén tu racha diaria</div>
          </div>
          <div className="rounded-xl border bg-black/20 p-4">
            <div className="text-xs text-muted-foreground">Objetivo</div>
            <div className="text-sm font-medium">Completa 1 lección hoy</div>
          </div>
        </div>
      </section>

      {/* ============================
         ZONA ALUMNO (SECUNDARIA)
      ============================ */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Progreso y comunidad
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border p-6 space-y-2">
            <div className="text-sm font-medium">Mi progreso</div>
            <p className="text-xs text-muted-foreground">
              Revisa tus logros y métricas de aprendizaje.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link className="underline" href="/dashboard/badges">
                Badges
              </Link>
              <Link className="underline" href="/dashboard/leaderboard">
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border p-6 space-y-2">
            <div className="text-sm font-medium">Comunidad</div>
            <p className="text-xs text-muted-foreground">
              Participa y aprende con otros miembros.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link className="underline" href="/comunidad">
                Ir a comunidad
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
         ZONA INSTRUCTOR / MENTOR
      ============================ */}
      {isInstructorLike && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Zona Instructor / Mentor
          </h3>

          <div className="rounded-2xl border border-[#ff6b35]/25 bg-[#ff6b35]/5 p-6 space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Gestión de cursos</div>
              <p className="text-xs text-muted-foreground">
                Crea y edita tus cursos. Ownership por <span className="font-medium">instructor_id</span>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link className="underline" href="/dashboard/instructor/cursos">
                Mis cursos
              </Link>
              <Link className="underline" href="/dashboard/instructor/cursos/nuevo">
                Crear curso
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================
         ADMIN (DISCRETO)
      ============================ */}
      {isAdmin && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Administración
          </h3>

          <div className="rounded-2xl border p-6 space-y-2">
            <p className="text-xs text-muted-foreground">
              Acceso a herramientas de gestión global (backoffice).
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link className="underline" href="/admin">
                Admin home
              </Link>
              <Link className="underline" href="/admin/cursos">
                Admin cursos
              </Link>
              <Link className="underline" href="/admin/usuarios">
                Usuarios
              </Link>
              <Link className="underline" href="/admin/configuracion">
                Configuración
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================
         DIAGNÓSTICO (SOLO DEV)
      ============================ */}
      {process.env.NODE_ENV === "development" && (
        <section className="rounded-2xl border p-6 space-y-2">
          <div className="text-sm font-medium">Diagnóstico (dev)</div>
          <p className="text-xs text-muted-foreground">
            Si no aparecen enlaces por rol, revisa que tu usuario tenga el rol correcto en{" "}
            <span className="font-medium">public.users.role</span> y que exista un registro en{" "}
            <span className="font-medium">public.users</span> con{" "}
            <span className="font-medium">id = auth.uid()</span>.
          </p>
        </section>
      )}
    </div>
  );
}
