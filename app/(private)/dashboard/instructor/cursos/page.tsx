import Link from "next/link";
import { requireInstructorLike } from "@/lib/auth/requireInstructor";
import { listMyCourses } from "@/lib/instructor/courses";

export default async function InstructorCoursesPage() {
  const { userId } = await requireInstructorLike();
  const courses = await listMyCourses(userId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mis cursos</h1>
          <p className="text-sm text-white/60">
            Crea y edita tus cursos. Solo tú podrás verlos y modificarlos.
          </p>
        </div>

        <Link
          href="/dashboard/instructor/cursos/nuevo"
          className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium border hover:bg-white/5"
        >
          Crear curso
        </Link>
      </div>

      <div className="grid gap-3">
        {courses.length === 0 ? (
          <div className="rounded-2xl border p-6 text-sm text-white/60">
            Aún no tienes cursos. Crea el primero.
          </div>
        ) : (
          courses.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/instructor/cursos/${c.id}`}
              className="rounded-2xl border p-4 hover:bg-white/5 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-white/60">
                    /{c.slug} · {c.level} · {c.status}
                  </div>
                </div>
                <div className="text-xs text-white/60">
                  {c.is_free ? "Gratis" : `€ ${c.price ?? "-"}`}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}


