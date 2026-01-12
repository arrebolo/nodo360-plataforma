import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StreakCard } from "@/components/gamification/StreakIndicator";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    return (
      <div className="min-h-screen bg-dark text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-white/60">
            Debes iniciar sesión para acceder al dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-95 transition-colors"
          >
            Ir a login
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  // Obtener stats de gamificación
  const { data: gamificationStats } = await supabase
    .from("user_gamification_stats")
    .select("total_xp, current_level, current_streak, longest_streak, last_activity_date")
    .eq("user_id", user.id)
    .single();

  const currentStreak = gamificationStats?.current_streak || 0;
  const longestStreak = gamificationStats?.longest_streak || 0;
  const lastActivityDate = gamificationStats?.last_activity_date;
  const totalXP = gamificationStats?.total_xp || 0;
  const currentLevel = gamificationStats?.current_level || 1;

  const role = (!profileError && profile?.role ? profile.role : "student") as
    | "student"
    | "instructor"
    | "mentor"
    | "admin";

  const isAdmin = role === "admin";
  const isInstructorLike = role === "instructor" || role === "mentor" || role === "admin";

  const continueHref = "/dashboard/rutas";
  const routesHref = "/dashboard/rutas";

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* HEADER */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-white/60">
            Tu centro de aprendizaje. <span className="font-medium text-white/80">Rol:</span>{" "}
            <span className="font-medium text-brand-light">{role}</span>
          </p>
        </header>

        {/* BLOQUE PRINCIPAL (EDUCATIVO) */}
        <section className="bg-dark-surface border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Continúa tu aprendizaje</h2>
            <p className="text-sm text-white/60">
              Retoma tu ruta donde la dejaste y mantén tu progreso activo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={continueHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-95 transition-colors"
            >
              Continuar
            </Link>
            <Link
              href={routesHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              Ver mis rutas
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              Explorar cursos
            </Link>
          </div>

          {/* Mini métricas con gradientes semánticos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Card Nivel y XP - gradiente brand */}
            <div className="bg-gradient-to-br from-brand-light/15 to-brand/10 border border-brand/20 rounded-xl p-5">
              <span className="text-brand-light text-sm font-medium">Tu nivel</span>
              <p className="text-white text-2xl font-bold mt-1">Nivel {currentLevel}</p>
              <p className="text-white/60 text-sm mt-1">{totalXP.toLocaleString()} XP total</p>
            </div>

            {/* Card Racha - gradiente naranja */}
            <StreakCard
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              lastActivityDate={lastActivityDate}
            />

            {/* Card Objetivo - gradiente success */}
            <div className="bg-gradient-to-br from-success/15 to-success/10 border border-success/20 rounded-xl p-5">
              <span className="text-success text-sm font-medium">Objetivo diario</span>
              <p className="text-white text-lg font-semibold mt-1">Completa 1 lección</p>
              <p className="text-white/60 text-sm mt-1">Mantén tu racha activa</p>
            </div>
          </div>
        </section>

        {/* ZONA ALUMNO (SECUNDARIA) */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
            Progreso y comunidad
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-dark-surface border border-white/10 rounded-xl p-5 space-y-2">
              <h4 className="text-white font-semibold">Mi progreso</h4>
              <p className="text-sm text-white/60">
                Revisa tus logros y métricas de aprendizaje.
              </p>
              <div className="flex flex-wrap gap-4 text-sm pt-1">
                <Link
                  href="/dashboard/badges"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Badges
                </Link>
                <Link
                  href="/dashboard/leaderboard"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Leaderboard
                </Link>
              </div>
            </div>

            <div className="bg-dark-surface border border-white/10 rounded-xl p-5 space-y-2">
              <h4 className="text-white font-semibold">Comunidad</h4>
              <p className="text-sm text-white/60">
                Participa y aprende con otros miembros.
              </p>
              <div className="flex flex-wrap gap-4 text-sm pt-1">
                <Link
                  href="/comunidad"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Ir a comunidad
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ZONA INSTRUCTOR / MENTOR */}
        {isInstructorLike && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
              Zona Instructor / Mentor
            </h3>

            <div className="bg-dark-surface border border-white/10 rounded-xl p-5 space-y-3">
              <div className="space-y-1">
                <h4 className="text-white font-semibold">Gestión de cursos</h4>
                <p className="text-sm text-white/60">
                  Crea y edita tus cursos. Ownership por <span className="text-white/80 font-medium">instructor_id</span>.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  href="/dashboard/instructor/cursos"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Mis cursos
                </Link>
                <Link
                  href="/dashboard/instructor/cursos/nuevo"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Crear curso
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ADMIN (DISCRETO) */}
        {isAdmin && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
              Administración
            </h3>

            <div className="bg-dark-surface border border-white/10 rounded-xl p-5 space-y-2">
              <p className="text-sm text-white/60">
                Acceso a herramientas de gestión global (backoffice).
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  href="/admin"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Admin home
                </Link>
                <Link
                  href="/admin/cursos"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Admin cursos
                </Link>
                <Link
                  href="/admin/usuarios"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Usuarios
                </Link>
                <Link
                  href="/admin/configuracion"
                  className="text-brand-light hover:text-brand transition underline"
                >
                  Configuración
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* DIAGNÓSTICO (SOLO DEV) */}
        {process.env.NODE_ENV === "development" && (
          <section className="bg-dark-surface border border-white/10 rounded-xl p-5 space-y-2">
            <h4 className="text-white font-medium">Diagnóstico (dev)</h4>
            <p className="text-sm text-white/60">
              Si no aparecen enlaces por rol, revisa que tu usuario tenga el rol correcto en{" "}
              <span className="text-white/80 font-medium">public.users.role</span> y que exista un registro en{" "}
              <span className="text-white/80 font-medium">public.users</span> con{" "}
              <span className="text-white/80 font-medium">id = auth.uid()</span>.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
