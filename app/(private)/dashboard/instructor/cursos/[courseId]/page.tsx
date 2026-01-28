import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Eye, ExternalLink, ArrowLeft, Layers, Clock, XCircle, AlertTriangle, Send } from "lucide-react";
import CourseForm from "@/components/instructor/CourseForm";
import { PublishChecklist } from "@/components/courses/PublishChecklist";
import { SubmitForReviewButton } from "@/components/instructor/SubmitForReviewButton";
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
                  : course.status === 'pending_review'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : course.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : course.status === 'archived'
                        ? 'bg-white/10 text-white/60'
                        : 'bg-warning/20 text-warning'
                }
              `}>
                {course.status === 'published' && 'Publicado'}
                {course.status === 'pending_review' && (
                  <><Clock className="w-3.5 h-3.5" /> Pendiente de aprobación</>
                )}
                {course.status === 'rejected' && (
                  <><XCircle className="w-3.5 h-3.5" /> Rechazado</>
                )}
                {course.status === 'archived' && 'Archivado'}
                {course.status === 'draft' && 'Borrador'}
                {course.status === 'coming_soon' && 'Próximamente'}
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

            {/* Botón Enviar a revisión (solo si es borrador o rechazado) */}
            {(course.status === 'draft' || course.status === 'rejected') && (
              <SubmitForReviewButton
                courseId={courseId}
                currentStatus={course.status}
              />
            )}

            {/* Mensaje si está pendiente */}
            {course.status === 'pending_review' && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm">
                <Clock className="w-4 h-4" />
                En revisión por administrador
              </div>
            )}


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

        {/* Advertencia para cursos publicados */}
        {course.status === 'published' && (
          <div className="mb-8 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-200 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-200 mb-1">Curso publicado</h3>
                <p className="text-amber-200/80 text-sm">
                  Si guardas cambios en título, descripción, nivel o precio, el curso volverá a estado de revisión y deberá ser aprobado nuevamente por un administrador.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de rechazo */}
        {course.status === 'rejected' && course.rejection_reason && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">Curso rechazado</h3>
                <p className="text-white/70 text-sm">
                  <span className="font-medium text-white/80">Motivo:</span> {course.rejection_reason}
                </p>
                <p className="text-white/50 text-sm mt-2">
                  Corrige los problemas indicados y vuelve a enviar el curso a revisión.
                </p>
              </div>
            </div>
          </div>
        )}

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
                isPublished={course.status === 'published'}
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
