import { redirect } from "next/navigation";
import CourseForm from "@/components/instructor/CourseForm";
import { requireInstructorLike } from "@/lib/auth/requireInstructor";
import { createMyCourse } from "@/lib/instructor/courses";

export default async function NewInstructorCoursePage() {
  const { userId } = await requireInstructorLike();

  async function onSave(payload: any) {
    "use server";
    const { id } = await createMyCourse(userId, payload);
    redirect(`/dashboard/instructor/cursos/${id}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Crear curso</h1>
        <p className="text-sm text-muted-foreground">
          Define lo básico. Luego añadiremos módulos y lecciones.
        </p>
      </div>

      <div className="rounded-2xl border p-5">
        <CourseForm onSave={onSave} />
      </div>
    </div>
  );
}
