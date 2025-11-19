import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface LessonPageProps {
  params: { slug: string; lessonSlug: string }
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      title,
      module:modules!inner(
        course:courses!inner(title)
      )
    `)
    .eq('slug', resolvedParams.lessonSlug)
    .single()

  return {
    title: lesson ? `${lesson.title} | Nodo360` : 'Lección | Nodo360',
    description: lesson ? `Aprende ${lesson.title}` : 'Lección del curso'
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  console.log('🔍 [LessonPage] Cargando lección:', resolvedParams.lessonSlug)

  // Get lesson with related data
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      *,
      module:modules!inner(
        *,
        course:courses!inner(*)
      )
    `)
    .eq('slug', resolvedParams.lessonSlug)
    .single()

  if (error || !lesson) {
    console.error('❌ [LessonPage] Error:', error)
    notFound()
  }

  // Verify course slug matches
  if (lesson.module.course.slug !== resolvedParams.slug) {
    console.error('❌ [LessonPage] Course slug no coincide:', {
      expected: resolvedParams.slug,
      actual: lesson.module.course.slug
    })
    notFound()
  }

  console.log('✅ [LessonPage] Lección encontrada:', lesson.title)

  // Get all lessons in the same module (for navigation)
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, slug, order_index')
    .eq('module_id', lesson.module_id)
    .order('order_index', { ascending: true })

  const currentIndex = allLessons?.findIndex(l => l.id === lesson.id) ?? -1
  const previousLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons?.length ?? 0) - 1 ? allLessons?.[currentIndex + 1] : null

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const videoId = lesson.video_url ? getYouTubeId(lesson.video_url) : null

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
              href={`/cursos/${lesson.module.course.slug}`}
              className="text-white/70 hover:text-white transition flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver al curso
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
          <Link href="/cursos" className="hover:text-white transition">Cursos</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/cursos/${lesson.module.course.slug}`} className="hover:text-white transition">
            {lesson.module.course.title}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/70">{lesson.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            {videoId && (
              <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            )}

            {/* Lesson Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">{lesson.title}</h1>

              {lesson.description && (
                <p className="text-white/70 mb-4">{lesson.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-white/50">
                {lesson.video_duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{lesson.video_duration_minutes} minutos</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{lesson.module.title}</span>
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            {lesson.content && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Contenido de la lección</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/70 whitespace-pre-wrap">{lesson.content}</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              {previousLesson ? (
                <Link
                  href={`/cursos/${lesson.module.course.slug}/${previousLesson.slug}`}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs text-white/50">Anterior</div>
                    <div className="font-medium">{previousLesson.title}</div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Link
                  href={`/cursos/${lesson.module.course.slug}/${nextLesson.slug}`}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-lg text-white hover:shadow-lg transition ml-auto"
                >
                  <div className="text-right">
                    <div className="text-xs text-white/80">Siguiente</div>
                    <div className="font-medium">{nextLesson.title}</div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href={`/cursos/${lesson.module.course.slug}`}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-lg text-white hover:shadow-lg transition ml-auto"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Finalizar módulo
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar - Module Lessons */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4">{lesson.module.title}</h3>

              <div className="space-y-2">
                {allLessons?.map((l) => (
                  <Link
                    key={l.id}
                    href={`/cursos/${lesson.module.course.slug}/${l.slug}`}
                    className={`block p-3 rounded-lg transition ${
                      l.id === lesson.id
                        ? 'bg-[#ff6b35]/20 border border-[#ff6b35]/30 text-white'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium text-sm">{l.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
