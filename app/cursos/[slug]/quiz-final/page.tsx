import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CourseFinalQuiz } from '@/components/quiz/CourseFinalQuiz'
import type { QuizQuestion } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface FinalQuizPageProps {
  params: Promise<{ slug: string }>
}

export default async function FinalQuizPage({ params }: FinalQuizPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener curso + OWNER (mentor/instructor)
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      status,
      owner:users!courses_owner_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('slug', slug)
    .single()

  if (courseError || !course || course.status !== 'published') {
    notFound()
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    redirect(`/login?redirect=/cursos/${course.slug}/quiz-final`)
  }

  // Obtener módulos del curso
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, slug, order_index')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  const moduleIds = (modules || []).map((module) => module.id)

  // Obtener preguntas del quiz
  let questions: QuizQuestion[] = []

  if (moduleIds.length > 0) {
    const { data: questionData } = await supabase
      .from('quiz_questions')
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true })

    questions = (questionData || []) as QuizQuestion[]
  }

  console.log('🔍 [QuizFinal] Curso:', course.title, '- Preguntas:', questions.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-white font-bold text-xl">NODO360</span>
          </Link>

          <Link
            href={`/cursos/${course.slug}`}
            className="text-white/70 hover:text-white transition text-sm"
          >
            Volver al curso
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/cursos" className="hover:text-white transition">Cursos</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/cursos/${course.slug}`} className="hover:text-white transition">
            {course.title}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/70">Quiz final</span>
        </nav>

        {/* Quiz Component */}
        <CourseFinalQuiz
          courseId={course.id}
          courseTitle={course.title}
          questions={questions}
          userId={user.id}
          redirectTo="/certificados"
          fallbackUrl={`/cursos/${course.slug}`}
        />
      </main>
    </div>
  )
}
