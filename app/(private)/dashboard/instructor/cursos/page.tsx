import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireInstructorLike } from "@/lib/auth/requireInstructor";
import { listMyCourses } from "@/lib/instructor/courses";
import InstructorCourseCard from "@/components/instructor/InstructorCourseCard";

export default async function InstructorCoursesPage() {
  const { userId } = await requireInstructorLike();
  const courses = await listMyCourses(userId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Mis cursos</h1>
          <p className="text-sm text-white/60">
            Gestiona tus cursos, edita contenido y controla su estado de publicacion.
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

      {/* Stats resumen */}
      {courses.length > 0 && (
        <div className="flex gap-4 text-sm">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-white font-medium">{courses.length}</span>
            <span className="text-white/60 ml-1.5">cursos</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-emerald-400 font-medium">
              {courses.filter(c => c.status === 'published').length}
            </span>
            <span className="text-white/60 ml-1.5">publicados</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-yellow-400 font-medium">
              {courses.filter(c => c.status === 'draft').length}
            </span>
            <span className="text-white/60 ml-1.5">borradores</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-blue-400 font-medium">
              {courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)}
            </span>
            <span className="text-white/60 ml-1.5">alumnos total</span>
          </div>
        </div>
      )}

      {/* Lista de cursos */}
      <div className="grid gap-4">
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="text-white/40 mb-4">
              <PlusCircle className="w-12 h-12 mx-auto" />
            </div>
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
          </div>
        ) : (
          courses.map((course) => (
            <InstructorCourseCard
              key={course.id}
              course={course}
            />
          ))
        )}
      </div>
    </div>
  );
}
