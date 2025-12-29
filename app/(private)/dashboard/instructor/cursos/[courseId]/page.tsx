import { redirect } from "next/navigation";
import CourseForm from "@/components/instructor/CourseForm";
import { requireInstructorLike } from "@/lib/auth/requireInstructor";
import { getMyCourseForEdit, updateMyCourse } from "@/lib/instructor/courses";

export default async function EditInstructorCoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const { userId } = await requireInstructorLike();
  const course = await getMyCourseForEdit(userId, params.courseId);

  async function onSave(payload: any) {
    "use server";
    await updateMyCourse(userId, params.courseId, payload);
    redirect(`/dashboard/instructor/cursos/${params.courseId}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar curso</h1>
        <p className="text-sm text-muted-foreground">Curso: {course.title}</p>
      </div>

      <div className="rounded-2xl border p-5">
        <CourseForm
          initial={{
            title: course.title,
            slug: course.slug,
            description: course.description ?? "",
            level: course.level,
            status: course.status,
            is_free: course.is_free,
            price: course.price ?? null,
          }}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
