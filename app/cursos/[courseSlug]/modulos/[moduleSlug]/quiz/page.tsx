import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createClient } from "@/lib/supabase/server";
import { ModuleQuiz } from "@/components/quiz/ModuleQuiz";
import { QuizStartWrapper } from "@/components/quiz/QuizStartWrapper";
import Link from "next/link";
import type { Metadata } from "next";

// Configuración de Next.js para rutas dinámicas
export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface QuizPageProps {
  params: { courseSlug: string; moduleSlug: string };
  searchParams: { start?: string };
}

export async function generateMetadata({
  params,
}: QuizPageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: `Quiz - ${resolvedParams.moduleSlug} | Nodo360`,
    description: "Evalúa tus conocimientos y obtén tu certificado",
  };
}

export default async function QuizPage({
  params,
  searchParams,
}: QuizPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Require authentication
  const returnUrl = `/cursos/${resolvedParams.courseSlug}/modulos/${resolvedParams.moduleSlug}/quiz`;
  const user = await requireAuth(returnUrl);

  const supabase = await createClient();

  // Get course and module
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("slug", resolvedParams.courseSlug)
    .single();

  if (!course) {
    notFound();
  }

  const { data: module } = await supabase
    .from("modules")
    .select("id, title, slug, requires_quiz, course_id")
    .eq("slug", resolvedParams.moduleSlug)
    .eq("course_id", course.id)
    .single();

  if (!module) {
    notFound();
  }

  // Check if this module requires a quiz
  if (!module.requires_quiz) {
    redirect(`/cursos/${resolvedParams.courseSlug}`);
  }

  // Get quiz questions
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  if (questionsError || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Quiz no disponible
            </h1>
            <p className="text-white/70 mb-6">
              Este módulo aún no tiene preguntas de quiz configuradas.
            </p>
            <Link
              href={`/cursos/${resolvedParams.courseSlug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all"
            >
              ← Volver al curso
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get user's previous attempts
  const { data: previousAttempts } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("module_id", module.id)
    .order("completed_at", { ascending: false });

  const bestAttempt = previousAttempts?.reduce((best, attempt) => {
    if (!best || attempt.score > best.score) {
      return attempt;
    }
    return best;
  }, previousAttempts[0]);

  const hasStarted = resolvedSearchParams.start === "true";

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

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
          <Link href="/cursos" className="hover:text-white transition">
            Cursos
          </Link>
          <span>/</span>
          <Link
            href={`/cursos/${resolvedParams.courseSlug}`}
            className="hover:text-white transition"
          >
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-white/70">{module.title}</span>
          <span>/</span>
          <span className="text-white/70">Quiz</span>
        </nav>

        {!hasStarted ? (
          <QuizStartWrapper
            moduleTitle={module.title}
            questionCount={questions.length}
            passingScore={70}
            estimatedMinutes={Math.ceil(questions.length * 2)}
            previousAttempts={previousAttempts || []}
            bestAttempt={bestAttempt || null}
          />
        ) : (
          <ModuleQuiz
            moduleId={module.id}
            moduleTitle={module.title}
            questions={questions}
            userId={user.id}
            onComplete={async (attemptId) => {
              // Redirect to results page (you can create this later)
              redirect(
                `/cursos/${resolvedParams.courseSlug}/modulos/${resolvedParams.moduleSlug}/quiz/results?attemptId=${attemptId}`
              );
            }}
            onCancel={() => {
              redirect(`/cursos/${resolvedParams.courseSlug}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
