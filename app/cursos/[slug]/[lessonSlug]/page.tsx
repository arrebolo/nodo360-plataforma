// app/cursos/[slug]/[lessonSlug]/page.tsx
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import LessonPlayer from "@/components/lesson/LessonPlayer"
import { getCourseQuizStatus } from "@/lib/quiz/checkCourseQuiz"
import type { LessonPlayerProps, ModuleWithLessons, LessonNavigation, LessonProgress, QuizStatus } from "@/types/lesson-player"

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ slug: string; lessonSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lessonSlug } = await params
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, courses!inner(title, slug)")
    .eq("slug", lessonSlug)
    .eq("courses.slug", slug)
    .single()

  if (!lesson) {
    return { title: "Leccion no encontrada | Nodo360" }
  }

  // Handle the courses join result - it's a single object, not an array
  const courseData = lesson.courses as unknown as { title: string; slug: string } | null
  const courseTitle = courseData?.title || slug

  return {
    title: `${lesson.title} | ${courseTitle} | Nodo360`,
    description: `Leccion: ${lesson.title}`,
  }
}

export default async function LessonPage({ params }: PageProps) {
  const { slug: courseSlug, lessonSlug } = await params
  const supabase = await createClient()

  // 1) Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar autenticación obligatoria para ver lecciones
  if (!user) {
    redirect(`/login?redirect=/cursos/${courseSlug}/${lessonSlug}`)
  }

  const userId = user.id

  // 2) Fetch course with modules and lessons in one query
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(`
      id,
      slug,
      title,
      modules (
        id,
        title,
        description,
        order_index,
        lessons (
          id,
          slug,
          title,
          order_index
        )
      )
    `)
    .eq("slug", courseSlug)
    .single()

  if (courseError || !course) {
    console.error("❌ [LessonPage] Error cargando curso:", courseError?.message)
    notFound()
  }

  // 3) Fetch the specific lesson with full details
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(`
      id,
      course_id,
      module_id,
      title,
      description,
      slug,
      order_index,
      video_url,
      slides_url,
      slides_type,
      resources_url,
      pdf_url,
      content,
      content_json
    `)
    .eq("slug", lessonSlug)
    .eq("course_id", course.id)
    .single()

  if (lessonError || !lesson) {
    console.error("❌ [LessonPage] Error cargando leccion:", lessonError?.message)
    notFound()
  }

  // 4) Process modules - sort and structure
  const modules: ModuleWithLessons[] = (course.modules || [])
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .map((mod) => ({
      id: mod.id,
      title: mod.title,
      description: mod.description || null,
      order_index: mod.order_index || 0,
      lessons: (mod.lessons || [])
        .sort((a: { order_index: number | null }, b: { order_index: number | null }) =>
          (a.order_index || 0) - (b.order_index || 0)
        )
        .map((les: { id: string; slug: string; title: string; order_index: number | null }) => ({
          id: les.id,
          slug: les.slug,
          title: les.title,
          order_index: les.order_index || 0,
        })),
    }))

  // 5) Find the current module
  const currentModule = modules.find((m) =>
    m.lessons.some((l) => l.id === lesson.id)
  ) || modules[0]

  // 6) Fetch user progress (completed lessons)
  let completedLessonIds: string[] = []
  if (userId) {
    const { data: progressData } = await supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("is_completed", true)

    if (progressData) {
      completedLessonIds = progressData.map((p) => p.lesson_id)
    }
  }

  // 7) Calculate navigation (prev/next lesson)
  const allLessons: { slug: string; title: string; moduleId: string }[] = []
  for (const mod of modules) {
    for (const les of mod.lessons) {
      allLessons.push({ slug: les.slug, title: les.title, moduleId: mod.id })
    }
  }

  const currentIndex = allLessons.findIndex((l) => l.slug === lesson.slug)
  const totalLessons = allLessons.length

  const navigation: LessonNavigation = {
    prevLesson: currentIndex > 0
      ? { slug: allLessons[currentIndex - 1].slug, title: allLessons[currentIndex - 1].title }
      : null,
    nextLesson: currentIndex < totalLessons - 1
      ? { slug: allLessons[currentIndex + 1].slug, title: allLessons[currentIndex + 1].title }
      : null,
    totalLessons,
    currentIndex: currentIndex + 1, // 1-based for display
  }

  // 8) Build progress object
  const progress: LessonProgress = {
    completedLessonIds,
    currentLessonId: lesson.id,
  }

  // 9) Get quiz status for course completion flow
  const quizStatus: QuizStatus = await getCourseQuizStatus(course.id, userId)

  // 10) Build props for LessonPlayer
  const playerProps: LessonPlayerProps = {
    userId,
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
    },
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      video_url: lesson.video_url,
      slides_url: lesson.slides_url,
      slides_type: lesson.slides_type,
      order_index: lesson.order_index || 0,
      content: lesson.content,
      content_json: lesson.content_json,
    },
    module: {
      id: currentModule?.id || '',
      title: currentModule?.title || 'Modulo',
      order_index: currentModule?.order_index || 0,
      description: currentModule?.description || null,
    },
    modules,
    progress,
    navigation,
    quizStatus,
  }

  return <LessonPlayer {...playerProps} />
}
