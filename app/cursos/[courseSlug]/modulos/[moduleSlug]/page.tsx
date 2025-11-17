import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { ModuleStatusBadge } from "@/components/course/ModuleStatusBadge";
import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Award,
  Download,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

// Configuración de Next.js para rutas dinámicas
export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface ModulePageProps {
  params: { courseSlug: string; moduleSlug: string };
}

export async function generateMetadata({
  params,
}: ModulePageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: `${resolvedParams.moduleSlug} | Nodo360`,
    description: "Módulo del curso en Nodo360",
  };
}

export default async function ModulePage({ params }: ModulePageProps) {
  const resolvedParams = await params;

  // Require authentication
  const returnUrl = `/cursos/${resolvedParams.courseSlug}/modulos/${resolvedParams.moduleSlug}`;
  const user = await requireAuth(returnUrl);

  const supabase = await createClient();

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, description, is_free")
    .eq("slug", resolvedParams.courseSlug)
    .eq("status", "published")
    .single();

  if (!course) {
    notFound();
  }

  // Get module with lessons
  const { data: module } = await supabase
    .from("modules")
    .select(
      `
      *,
      lessons (
        id,
        title,
        slug,
        description,
        duration_minutes,
        order_index
      )
    `
    )
    .eq("slug", resolvedParams.moduleSlug)
    .eq("course_id", course.id)
    .single();

  if (!module) {
    notFound();
  }

  // Sort lessons by order_index
  const sortedLessons = (module.lessons || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  // Get user's lesson progress
  const { data: lessonProgress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("user_id", user.id)
    .in(
      "lesson_id",
      sortedLessons.map((l: any) => l.id)
    );

  const completedLessonIds = new Set(
    lessonProgress?.filter((lp) => lp.completed).map((lp) => lp.lesson_id) || []
  );

  const completedLessonsCount = completedLessonIds.size;
  const totalLessons = sortedLessons.length;
  const allLessonsCompleted = completedLessonsCount === totalLessons && totalLessons > 0;

  // Get quiz status if module requires quiz
  let quizStatus: "not_attempted" | "attempted" | "passed" = "not_attempted";
  let bestAttempt: any = null;
  let certificate: any = null;

  if (module.requires_quiz) {
    // Get user's quiz attempts
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("module_id", module.id)
      .order("score", { ascending: false })
      .limit(1);

    if (attempts && attempts.length > 0) {
      bestAttempt = attempts[0];
      quizStatus = bestAttempt.passed ? "passed" : "attempted";

      // If passed, check for certificate
      if (bestAttempt.passed) {
        const { data: cert } = await supabase
          .from("certificates")
          .select("*")
          .eq("user_id", user.id)
          .eq("module_id", module.id)
          .eq("type", "module")
          .eq("status", "active")
          .single();

        certificate = cert;
      }
    }
  }

  const totalDuration = sortedLessons.reduce(
    (sum: number, lesson: any) => sum + (lesson.duration_minutes || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-white font-bold text-xl">NODO360</span>
            </Link>
            <Link
              href={`/cursos/${resolvedParams.courseSlug}`}
              className="text-white/70 hover:text-white transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al curso
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
          <Link href="/cursos" className="hover:text-white transition">
            Cursos
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/cursos/${resolvedParams.courseSlug}`}
            className="hover:text-white transition"
          >
            {course.title}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/70">{module.title}</span>
        </nav>

        {/* Module Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {module.title}
          </h1>
          {module.description && (
            <p className="text-xl text-white/70 mb-6">{module.description}</p>
          )}

          {/* Module Stats */}
          <div className="flex flex-wrap items-center gap-6 text-white/60">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>
                {totalLessons} {totalLessons === 1 ? "lección" : "lecciones"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{totalDuration} minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {completedLessonsCount}/{totalLessons} completadas
              </span>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#ff6b35]" />
            Lecciones del Módulo
          </h2>

          <div className="space-y-4">
            {sortedLessons.map((lesson: any, index: number) => {
              const isCompleted = completedLessonIds.has(lesson.id);

              return (
                <Link
                  key={lesson.id}
                  href={`/cursos/${resolvedParams.courseSlug}/modulos/${resolvedParams.moduleSlug}/lecciones/${lesson.slug}`}
                  className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Lesson Number */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white/70 font-bold">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#ff6b35] transition">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-sm text-white/60 mb-2">
                          {lesson.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-white/50">
                        {lesson.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{lesson.duration_minutes} min</span>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Completada</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#ff6b35] group-hover:translate-x-1 transition flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quiz Status Section */}
        {module.requires_quiz && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Award className="w-6 h-6 text-[#ff6b35]" />
              Quiz Final del Módulo
            </h2>

            {/* Case 1: Not all lessons completed */}
            {!allLessonsCompleted && (
              <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 backdrop-blur-sm border border-gray-500/30 rounded-xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-500/20 border border-gray-500/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Completa todas las lecciones para acceder al quiz
                    </h3>
                    <p className="text-white/60 mb-4">
                      Has completado {completedLessonsCount} de {totalLessons}{" "}
                      lecciones. Termina las lecciones restantes para
                      desbloquear el quiz final.
                    </p>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] transition-all duration-500"
                        style={{
                          width: `${(completedLessonsCount / totalLessons) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Case 2: Lessons completed but quiz not attempted OR attempted but not passed */}
            {allLessonsCompleted && quizStatus !== "passed" && (
              <div className="bg-gradient-to-br from-[#ff6b35]/10 via-[#f7931a]/10 to-[#ff6b35]/10 backdrop-blur-sm border-2 border-[#ff6b35]/30 rounded-2xl p-8">
                <div className="text-center max-w-2xl mx-auto">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] mb-6">
                    <Award className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl font-bold text-white mb-3">
                    {quizStatus === "not_attempted"
                      ? "¡Listo para el Quiz Final!"
                      : "Intenta el Quiz Nuevamente"}
                  </h3>

                  {/* Description */}
                  <p className="text-lg text-white/70 mb-6">
                    {quizStatus === "not_attempted"
                      ? "Has completado todas las lecciones. ¡Es hora de demostrar lo que has aprendido!"
                      : `Tu mejor puntuación es ${bestAttempt?.score || 0}%. Necesitas 70% o más para aprobar y obtener tu certificado.`}
                  </p>

                  {/* Stats */}
                  {quizStatus === "attempted" && bestAttempt && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-2xl font-bold text-white">
                          {bestAttempt.score}%
                        </div>
                        <div className="text-sm text-white/60">
                          Mejor puntuación
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-2xl font-bold text-white">70%</div>
                        <div className="text-sm text-white/60">
                          Puntuación requerida
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link
                    href={`/cursos/${resolvedParams.courseSlug}/modulos/${resolvedParams.moduleSlug}/quiz`}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white text-lg font-bold hover:shadow-2xl hover:shadow-[#ff6b35]/50 transition-all"
                  >
                    {quizStatus === "not_attempted"
                      ? "Tomar Quiz"
                      : "Reintentar Quiz"}
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  {/* Requirements */}
                  <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/50">
                    <span>✓ 70% para aprobar</span>
                    <span>✓ Certificado incluido</span>
                    <span>✓ Intentos ilimitados</span>
                  </div>
                </div>
              </div>
            )}

            {/* Case 3: Quiz passed - Show certificate */}
            {quizStatus === "passed" && (
              <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 backdrop-blur-sm border-2 border-green-500/30 rounded-2xl p-8">
                <div className="text-center max-w-2xl mx-auto">
                  {/* Success Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-6">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">
                      Quiz Completado
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl font-bold text-white mb-3">
                    ¡Felicitaciones!
                  </h3>

                  {/* Description */}
                  <p className="text-lg text-white/70 mb-6">
                    Has aprobado el quiz con {bestAttempt?.score || 0}%. Tu
                    certificado está listo para descargar.
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-green-400">
                        {bestAttempt?.score || 0}%
                      </div>
                      <div className="text-sm text-white/60">Tu puntuación</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-white">
                        {bestAttempt?.correct_answers || 0}/
                        {bestAttempt?.total_questions || 0}
                      </div>
                      <div className="text-sm text-white/60">Correctas</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-white">
                        {new Date(bestAttempt?.completed_at).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "short",
                          }
                        )}
                      </div>
                      <div className="text-sm text-white/60">Fecha</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {certificate && (
                      <>
                        <Link
                          href={`/certificados/${certificate.id}`}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all"
                        >
                          <Award className="w-5 h-5" />
                          Ver Certificado
                        </Link>
                        {certificate.certificate_url && (
                          <a
                            href={certificate.certificate_url}
                            download
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
                          >
                            <Download className="w-5 h-5" />
                            Descargar PDF
                          </a>
                        )}
                      </>
                    )}
                    <Link
                      href={`/cursos/${resolvedParams.courseSlug}/modulos/${resolvedParams.moduleSlug}/quiz`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all"
                    >
                      Ver resultados del quiz
                    </Link>
                  </div>

                  {/* Certificate Note */}
                  {certificate && (
                    <p className="mt-6 text-sm text-white/50">
                      Certificado #{certificate.certificate_number} •
                      Verificable en línea
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
