import { notFound, redirect } from 'next/navigation'
import { AvisoEducativo } from '@/components/legal/AvisoEducativo'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CourseFinalQuiz } from '@/components/quiz/CourseFinalQuiz'
import { sortearExamen } from '@/lib/quiz/sortearExamen'
import type { QuizQuestion } from '@/types/database'
import { resolveCourseAccess } from '@/lib/courses/access'
import { CoursePreviewBanner } from '@/components/course/CoursePreviewBanner'
import { CourseUnavailable } from '@/components/course/CourseUnavailable'

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
      instructor_id,
      owner:users!courses_owner_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('slug', slug)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // Regla única de visibilidad: publicado -> todos; borrador -> admin e
  // instructor del curso; el resto, 404. Ver lib/courses/access.ts
  const { canView, isPreview } = await resolveCourseAccess(course, user?.id)

  // Mismo trato que en la ficha: quien no puede ver el curso no ve el examen,
  // pero tampoco un 404 seco.
  if (!canView) {
    return (
      <CourseUnavailable
        courseId={course.id}
        courseTitle={course.title}
        status={course.status}
      />
    )
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
    // Lista explicita de columnas: correct_answer y explanation se quedan en el
    // servidor. Un select('*') las serializaria en el payload RSC, donde son
    // legibles desde el navegador.
    const { data: questionData } = await supabase
      .from('quiz_questions')
      .select('id, module_id, question, options, order_index, difficulty, points')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true })

    // El examen es un subconjunto sorteado, no el banco entero: 4 preguntas por
    // modulo, 12 en un curso de tres. Antes se servian las 27 siempre las
    // mismas, y con reintentos ilimitados y el veredicto pregunta por pregunta
    // eso se recorre a base de repetir. Ver lib/quiz/sortearExamen.ts.
    //
    // El sorteo ocurre AQUI, en el servidor, en cada carga de la pagina. Al
    // volver a intentarlo el componente recarga la ruta, asi que toca examen
    // nuevo.
    questions = sortearExamen((questionData || []) as QuizQuestion[], moduleIds)
  }

  console.log('🔍 [QuizFinal] Curso:', course.title, '- Preguntas sorteadas:', questions.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-surface via-dark-soft to-dark-surface">
      {isPreview && <CoursePreviewBanner />}
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
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
          redirectTo="/dashboard/certificados"
          fallbackUrl={`/cursos/${course.slug}`}
        />

        <AvisoEducativo tipo="curso" />
      </main>
    </div>
  )
}
