import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StreakCard } from "@/components/gamification/StreakIndicator";
import { DashboardIconCard, DashboardSection } from "@/components/dashboard";
import {
  Trophy,
  BarChart3,
  Bookmark,
  FileText,
  Users,
  BookOpen,
  PlusCircle,
  Route,
  Search,
  TrendingUp,
  GraduationCap,
  Award,
  Landmark,
  ClipboardList,
  MessageSquare,
  BarChart,
} from "lucide-react";

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
            Debes iniciar sesion para acceder al dashboard.
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
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  // Obtener stats de gamificacion
  const { data: gamificationStats } = await supabase
    .from("user_gamification_stats")
    .select("total_xp, current_level, current_streak, longest_streak, last_activity_date, total_badges")
    .eq("user_id", user.id)
    .single();

  const currentStreak = gamificationStats?.current_streak || 0;
  const longestStreak = gamificationStats?.longest_streak || 0;
  const lastActivityDate = gamificationStats?.last_activity_date;
  const totalXP = gamificationStats?.total_xp || 0;
  const currentLevel = gamificationStats?.current_level || 1;
  const totalBadges = gamificationStats?.total_badges || 0;

  const role = (!profileError && profile?.role ? profile.role : "student") as
    | "student"
    | "instructor"
    | "mentor"
    | "admin";

  const userName = profile?.full_name || user.email?.split('@')[0] || 'Usuario';

  const isAdmin = role === "admin";
  const isMentor = role === "mentor" || role === "admin";
  const isInstructor = role === "instructor" || role === "mentor" || role === "admin";

  const continueHref = "/dashboard/rutas";
  const routesHref = "/dashboard/rutas";

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">
              Hola, {userName}!
            </h1>
            <p className="text-sm text-white/60">
              {role === 'student' && 'Continua tu aprendizaje'}
              {role === 'instructor' && 'Gestiona tus cursos y alumnos'}
              {role === 'mentor' && 'Lidera la comunidad'}
              {role === 'admin' && 'Panel de control'}
            </p>
          </div>

          {/* Stats rapidos */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[#f7931a] font-bold">{totalXP.toLocaleString()}</span>
              <span className="text-white/60">XP</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-emerald-400 font-bold">Nivel {currentLevel}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-orange-400">🔥 {currentStreak}</span>
              <span className="text-white/60">dias</span>
            </div>
          </div>
        </header>

        {/* BLOQUE PRINCIPAL (EDUCATIVO) */}
        <section className="bg-dark-surface border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Continua tu aprendizaje</h2>
            <p className="text-sm text-white/60">
              Retoma tu ruta donde la dejaste y manten tu progreso activo.
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

          {/* Mini metricas con gradientes semanticos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Card Nivel y XP */}
            <div className="bg-gradient-to-br from-brand-light/15 to-brand/10 border border-brand/20 rounded-xl p-5">
              <span className="text-brand-light text-sm font-medium">Tu nivel</span>
              <p className="text-white text-2xl font-bold mt-1">Nivel {currentLevel}</p>
              <p className="text-white/60 text-sm mt-1">{totalXP.toLocaleString()} XP total</p>
            </div>

            {/* Card Racha */}
            <StreakCard
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              lastActivityDate={lastActivityDate}
            />

            {/* Card Objetivo */}
            <div className="bg-gradient-to-br from-success/15 to-success/10 border border-success/20 rounded-xl p-5">
              <span className="text-success text-sm font-medium">Objetivo diario</span>
              <p className="text-white text-lg font-semibold mt-1">Completa 1 leccion</p>
              <p className="text-white/60 text-sm mt-1">Manten tu racha activa</p>
            </div>
          </div>
        </section>

        {/* MI APRENDIZAJE */}
        <DashboardSection title="Mi Aprendizaje" columns={4}>
          <DashboardIconCard
            href="/dashboard/cursos"
            icon={BookOpen}
            label="Mis Cursos"
            description="Cursos inscritos"
            color="blue"
          />
          <DashboardIconCard
            href="/dashboard/rutas"
            icon={Route}
            label="Mis Rutas"
            description="Rutas de aprendizaje"
            color="orange"
          />
          <DashboardIconCard
            href="/cursos"
            icon={Search}
            label="Explorar Cursos"
            description="Descubrir mas"
            color="cyan"
          />
          <DashboardIconCard
            href="/dashboard/progreso"
            icon={TrendingUp}
            label="Mi Progreso"
            description="Estadisticas"
            color="emerald"
          />
        </DashboardSection>

        {/* LOGROS Y COMUNIDAD */}
        <DashboardSection title="Logros y Comunidad" columns={5}>
          <DashboardIconCard
            href="/dashboard/badges"
            icon={Trophy}
            label="Badges"
            description={`${totalBadges} obtenidos`}
            color="yellow"
          />
          <DashboardIconCard
            href="/dashboard/leaderboard"
            icon={BarChart3}
            label="Leaderboard"
            description="Ranking"
            color="blue"
          />
          <DashboardIconCard
            href="/dashboard/guardados"
            icon={Bookmark}
            label="Guardados"
            color="green"
          />
          <DashboardIconCard
            href="/dashboard/notas"
            icon={FileText}
            label="Mis Notas"
            color="purple"
          />
          <DashboardIconCard
            href="/comunidad"
            icon={Users}
            label="Comunidad"
            color="pink"
          />
        </DashboardSection>

        {/* MENTORIAS */}
        <DashboardSection title="Mentorias" columns={3}>
          <DashboardIconCard
            href="/mentoria"
            icon={GraduationCap}
            label="Buscar Mentor"
            description="Encuentra guia"
            color="purple"
          />
          <DashboardIconCard
            href="/dashboard/certificados"
            icon={Award}
            label="Certificados"
            description="Mis logros"
            color="yellow"
          />
          <DashboardIconCard
            href="/comunidad"
            icon={Users}
            label="Comunidad"
            description="Conecta"
            color="pink"
          />
        </DashboardSection>

        {/* ZONA INSTRUCTOR */}
        {isInstructor && (
          <DashboardSection title="Zona Instructor" columns={3}>
            <DashboardIconCard
              href="/dashboard/instructor/cursos/nuevo"
              icon={PlusCircle}
              label="Crear Curso"
              description="Nuevo contenido"
              color="green"
            />
            <DashboardIconCard
              href="/dashboard/instructor/cursos"
              icon={BookOpen}
              label="Mis Cursos"
              description="Gestionar"
              color="cyan"
            />
            <DashboardIconCard
              href="/dashboard/instructor/estadisticas"
              icon={BarChart}
              label="Estadisticas"
              description="Alumnos"
              color="blue"
            />
          </DashboardSection>
        )}

        {/* ZONA MENTOR */}
        {isMentor && (
          <DashboardSection title="Zona Mentor" columns={4}>
            <DashboardIconCard
              href="/gobernanza"
              icon={Landmark}
              label="Gobernanza"
              description="Propuestas y votos"
              color="orange"
            />
            <DashboardIconCard
              href="/dashboard/mentor/mentorias"
              icon={GraduationCap}
              label="Mis Mentorias"
              description="Gestionar"
              color="purple"
            />
            <DashboardIconCard
              href="/dashboard/mentor/solicitudes"
              icon={ClipboardList}
              label="Solicitudes"
              description="Pendientes"
              color="blue"
            />
            <DashboardIconCard
              href="/dashboard/mentor/sesiones"
              icon={MessageSquare}
              label="Sesiones"
              description="Calendario"
              color="cyan"
            />
          </DashboardSection>
        )}

        {/* LINK A ADMIN */}
        {isAdmin && (
          <div className="pt-4 border-t border-white/10">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              🛡️ Ir al Panel de Administracion
            </Link>
          </div>
        )}

        {/* DIAGNOSTICO (SOLO DEV) */}
        {process.env.NODE_ENV === "development" && (
          <section className="bg-dark-surface border border-white/10 rounded-xl p-5 space-y-2">
            <h4 className="text-white font-medium">Diagnostico (dev)</h4>
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
