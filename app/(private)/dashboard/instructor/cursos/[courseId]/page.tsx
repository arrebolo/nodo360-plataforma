import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Eye, ExternalLink, ArrowLeft, Layers } from "lucide-react";
import CourseForm from "@/components/instructor/CourseForm";
import { PublishChecklist } from "@/components/courses/PublishChecklist";
import { PublishCourseButton } from "@/components/admin/PublishCourseButton";
import { requireInstructorLike } from "@/lib/auth/requireInstructor";
import { getMyCourseForEdit, getMyCourseStats, updateMyCourse } from "@/lib/instructor/courses";

export default async function EditInstructorCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { userId } = await requireInstructorLike();

  let course;
  try {
    course = await getMyCourseForEdit(userId, courseId);
  } catch {
    notFound();
  }

  const stats = await getMyCourseStats(userId, courseId);

  async function onSave(payload: any) {
    "use server";
    await updateMyCourse(userId, courseId, payload);
    redirect(`/dashboard/instructor/cursos/${courseId}`);
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header con título y estado */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">
                {course.title}
              </h1>

              {/* Badge de estado */}
              <span className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                ${course.status === 'published'
                  ? 'bg-success/20 text-success'
                  : course.status === 'archived'
                    ? 'bg-white/10 text-white/60'
                    : 'bg-warning/20 text-warning'
                }
              `}>
                {course.status === 'published' ? 'Publicado' :
                 course.status === 'archived' ? 'Archivado' :
                 course.status === 'coming_soon' ? 'Próximamente' : 'Borrador'}
              </span>
            </div>
          </div>

          {/* Fila de acciones principales */}
          <div className="flex flex-wrap items-center gap-3">
            {/* CTA Principal: Gestionar módulos */}
            <Link
              href={`/dashboard/instructor/cursos/${courseId}/modulos`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 hover:-translate-y-0.5 transition-all"
            >
              <Layers className="w-5 h-5" />
              Gestionar módulos
            </Link>

            {/* Botón Publicar/Despublicar */}
            <PublishCourseButton
              courseId={courseId}
              currentStatus={course.status}
            />

            {/* Botón secundario: Preview */}
            <Link
              href={`/dashboard/instructor/cursos/${courseId}/preview`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
            >
              <Eye className="w-5 h-5" />
              Preview
            </Link>

            {/* Ver público (solo si publicado) */}
            {course.status === "published" && (
              <Link
                href={`/cursos/${course.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 text-white/70 font-medium rounded-xl hover:bg-white/10 hover:text-white transition"
              >
                <ExternalLink className="w-5 h-5" />
                Ver público
              </Link>
            )}

            {/* Link de escape: Volver */}
            <Link
              href="/dashboard/instructor/cursos"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-white/60 hover:text-white transition ml-auto"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a mis cursos
            </Link>
          </div>
        </div>

        {/* Separador visual */}
        <div className="border-b border-white/10 mb-8" />

        {/* Grid de 2 columnas */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna principal - Formulario */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
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
                courseId={courseId}
                onSave={onSave}
              />
            </div>
          </div>

          {/* Sidebar - Checklist + Acciones */}
          <div className="space-y-6">
            {/* Checklist */}
            <PublishChecklist
              course={{
                title: course.title,
                slug: course.slug,
                description: course.description ?? "",
                long_description: course.long_description,
                thumbnail_url: course.thumbnail_url,
                banner_url: course.banner_url,
                level: course.level,
                status: course.status,
                is_free: course.is_free,
                is_premium: course.is_premium,
              }}
              stats={stats}
            />

            {/* Info del curso */}
            <div className="bg-dark-surface border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Estadísticas</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/50">Módulos</dt>
                  <dd className="text-white">{stats.modulesCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Lecciones</dt>
                  <dd className="text-white">{stats.lessonsCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Duración</dt>
                  <dd className="text-white">
                    {stats.totalDurationMinutes > 0
                      ? `${Math.floor(stats.totalDurationMinutes / 60)}h ${stats.totalDurationMinutes % 60}m`
                      : "Sin definir"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Precio</dt>
                  <dd className="text-white">
                    {course.is_free ? "Gratis" : course.price ? `${course.price} EUR` : "Sin definir"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
