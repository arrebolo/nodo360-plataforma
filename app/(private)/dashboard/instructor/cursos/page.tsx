import Link from "next/link";
import { Suspense } from "react";
import { PlusCircle, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInstructorLike } from "@/lib/auth/requireInstructor";
import InstructorCourseCard from "@/components/instructor/InstructorCourseCard";
import CourseFilters from "@/components/instructor/CourseFilters";
import CourseTabs from "@/components/instructor/CourseTabs";
import LoadMoreButton from "@/components/instructor/LoadMoreButton";

export const metadata = {
  title: "Mis Cursos | Instructor Nodo360",
};

interface SearchParams {
  q?: string;
  status?: string;
  level?: string;
  type?: string;
  sort?: string;
  tab?: string;
  limit?: string;
}

export default async function InstructorCoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId, role } = await requireInstructorLike();
  const supabase = await createClient();
  const params = await searchParams;

  const { q, status, level, type, sort, limit: limitParam } = params;
  const isAdmin = role === "admin";
  const limit = parseInt(limitParam || "10");

  // Query para contar por estado (sin filtros de busqueda) - para tabs
  let countQuery = supabase.from("courses").select("status");
  if (!isAdmin) {
    countQuery = countQuery.eq("instructor_id", userId);
  }
  const { data: allCoursesForCount } = await countQuery;

  const tabCounts = {
    all: allCoursesForCount?.length || 0,
    published: allCoursesForCount?.filter((c) => c.status === "published").length || 0,
    draft: allCoursesForCount?.filter((c) => c.status === "draft").length || 0,
  };

  // Query base para lista
  let query = supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      level,
      status,
      is_free,
      price,
      total_modules,
      total_lessons,
      total_duration_minutes,
      updated_at,
      thumbnail_url
    `);

  // Filtrar por instructor (excepto admin que ve todos)
  if (!isAdmin) {
    query = query.eq("instructor_id", userId);
  }

  // Aplicar filtro de busqueda
  if (q && q.trim()) {
    query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  // Aplicar filtro de estado
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Aplicar filtro de nivel
  if (level && level !== "all") {
    query = query.eq("level", level);
  }

  // Aplicar filtro de tipo (free/premium)
  if (type && type !== "all") {
    if (type === "free") {
      query = query.eq("is_free", true);
    } else if (type === "premium") {
      query = query.eq("is_free", false);
    }
  }

  // Aplicar ordenacion
  switch (sort) {
    case "oldest":
      query = query.order("updated_at", { ascending: true });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "title_desc":
      query = query.order("title", { ascending: false });
      break;
    case "students":
    case "recent":
    default:
      query = query.order("updated_at", { ascending: false });
  }

  // Aplicar limite
  query = query.limit(limit);

  const { data: courses, error } = await query;

  if (error) {
    console.error("[Instructor Cursos] Error:", error);
  }

  // Obtener conteo de alumnos por curso
  const courseIds = (courses || []).map((c) => c.id);
  let enrollmentCounts: Record<string, number> = {};

  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .in("course_id", courseIds);

    enrollments?.forEach((e) => {
      enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
    });
  }

  // Agregar enrolled_count a cada curso
  let coursesWithStats = (courses || []).map((course) => ({
    ...course,
    enrolled_count: enrollmentCounts[course.id] || 0,
  }));

  // Ordenar por alumnos si es necesario (post-query)
  if (sort === "students") {
    coursesWithStats = [...coursesWithStats].sort(
      (a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0)
    );
  }

  // Query para total sin filtros (para stats header)
  let totalQuery = supabase
    .from("courses")
    .select("id", { count: "exact", head: true });

  if (!isAdmin) {
    totalQuery = totalQuery.eq("instructor_id", userId);
  }

  const { count: totalCount } = await totalQuery;
  const totalCourses = totalCount || 0;

  // Stats generales (de todos los cursos, no solo los filtrados)
  const publishedCourses = tabCounts.published;
  const draftCourses = tabCounts.draft;

  // Total de alumnos (necesita calcular de todos los cursos)
  let totalStudentsQuery = supabase.from("course_enrollments").select("course_id");
  if (!isAdmin && courseIds.length > 0) {
    // Solo contar de los cursos del instructor
    const { data: allInstructorCourses } = await supabase
      .from("courses")
      .select("id")
      .eq("instructor_id", userId);
    const allIds = allInstructorCourses?.map((c) => c.id) || [];
    if (allIds.length > 0) {
      totalStudentsQuery = totalStudentsQuery.in("course_id", allIds);
    }
  }
  const { data: allEnrollments } = await totalStudentsQuery;
  const totalStudents = allEnrollments?.length || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#f7931a]" />
            Mis Cursos
          </h1>
          <p className="text-white/60 mt-1">
            Gestiona tus cursos, edita contenido y controla su estado de
            publicacion.
          </p>
        </div>

        <Link
          href="/dashboard/instructor/cursos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          Crear curso
        </Link>
      </div>

      {/* Stats rapidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{totalCourses}</div>
          <div className="text-sm text-white/50">Total cursos</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">
            {publishedCourses}
          </div>
          <div className="text-sm text-emerald-400/70">Publicados</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {draftCourses}
          </div>
          <div className="text-sm text-yellow-400/70">Borradores</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">{totalStudents}</div>
          <div className="text-sm text-blue-400/70">Alumnos total</div>
        </div>
      </div>

      {/* Pestanas */}
      <Suspense fallback={<div className="h-12 bg-white/5 rounded-xl animate-pulse" />}>
        <CourseTabs counts={tabCounts} />
      </Suspense>

      {/* Filtros */}
      <Suspense fallback={<div className="h-32 bg-white/5 rounded-xl animate-pulse" />}>
        <CourseFilters
          totalCourses={totalCourses}
          filteredCount={coursesWithStats.length}
        />
      </Suspense>

      {/* Lista de cursos */}
      {coursesWithStats.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          {totalCourses === 0 ? (
            <>
              <h3 className="text-lg font-medium text-white mb-2">
                Aun no tienes cursos
              </h3>
              <p className="text-sm text-white/60 mb-4">
                Crea tu primer curso y empieza a compartir tu conocimiento.
              </p>
              <Link
                href="/dashboard/instructor/cursos/nuevo"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white hover:opacity-90 transition-opacity"
              >
                <PlusCircle className="w-4 h-4" />
                Crear mi primer curso
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-white mb-2">
                No hay cursos con estos filtros
              </h3>
              <p className="text-white/50">
                Prueba a cambiar los filtros de busqueda
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {coursesWithStats.map((course) => (
              <InstructorCourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* Paginacion */}
          <Suspense fallback={null}>
            <LoadMoreButton
              currentCount={coursesWithStats.length}
              totalCount={totalCourses}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
