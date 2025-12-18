// app/(public)/cursos/[courseSlug]/[lessonSlug]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCourseWithStructure } from '@/lib/db/courses-learning'
import NotesPanel from '@/components/lesson/NotesPanel'
import { NextLessonButton } from '@/components/learning/NextLessonButton'
import { LessonQuiz } from '@/components/course/LessonQuiz'
import { getModuleQuizQuestions } from '@/lib/db/quiz'

type PageProps = {
  params: Promise<{ courseSlug: string; lessonSlug: string }>
}

// Icono de candado realista
function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="#4B5563" stroke="#6B7280" strokeWidth="1"/>
      <path d="M7 11V7a5 5 0 0110 0v4" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill="#9CA3AF"/>
      <path d="M12 17.5v2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Icono de check
function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function getEmbedUrl(rawUrl?: string | null) {
  if (!rawUrl) return null
  const url = rawUrl.trim()

  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0]
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    const vParam = url.split('v=')[1]?.split('&')[0]
    if (vParam) {
      return `https://www.youtube.com/embed/${vParam}`
    }
    return url
  }

  // Vimeo
  if (url.includes('vimeo.com')) {
    const parts = url.split('/')
    const id = parts[parts.length - 1]
    return `https://player.vimeo.com/video/${id}`
  }

  return url
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseSlug, lessonSlug } = await params
  const courseData = await getCourseWithStructure(courseSlug)

  if (!courseData) {
    return { title: 'Leccion no encontrada | Nodo360' }
  }

  const allLessons = courseData.modules.flatMap((m) => m.lessons ?? [])
  const lesson = allLessons.find((l) => l.slug === lessonSlug)

  return {
    title: lesson
      ? `${lesson.title} | ${courseData.title} | Nodo360`
      : 'Leccion no encontrada | Nodo360',
  }
}

export default async function LessonPage(props: PageProps) {
  const { courseSlug, lessonSlug } = await props.params
  const supabase = await createClient()

  // 1) Obtener estructura del curso
  const courseData = await getCourseWithStructure(courseSlug)

  if (!courseData) {
    console.error('[LessonPage] Curso no encontrado:', courseSlug)
    notFound()
  }

  // courseData tiene: id, slug, title, modules, progress, etc.
  const { modules } = courseData

  // 2) Aplanar todas las lecciones
  const allLessons = modules.flatMap((m) => m.lessons ?? [])

  // 3) Buscar la lección actual por slug
  const lessonBasic = allLessons.find((l) => l.slug === lessonSlug)

  if (!lessonBasic) {
    console.error('[LessonPage] Lección no encontrada:', lessonSlug)
    notFound()
  }

  // 4) Obtener detalles completos de la lección (video, slides, pdf, recursos)
  const { data: lessonDetails, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      slug,
      title,
      description,
      video_url,
      slides_url,
      pdf_url,
      resources_url,
      video_duration_minutes,
      order_index,
      module_id
    `)
    .eq('id', lessonBasic.id)
    .single()

  if (lessonError || !lessonDetails) {
    console.error('[LessonPage] Error obteniendo detalles:', lessonError?.message)
    notFound()
  }

  // 5) Ordenar lecciones para navegación prev/next
  const sortedLessons = [...allLessons].sort((a, b) => {
    return (a.order_index ?? 0) - (b.order_index ?? 0)
  })

  const idx = sortedLessons.findIndex((l) => l.id === lessonBasic.id)
  const prevLesson = idx > 0 ? sortedLessons[idx - 1] : null
  const nextLesson = idx < sortedLessons.length - 1 ? sortedLessons[idx + 1] : null

  // 6) Encontrar módulo actual
  const currentModule = modules.find((m) =>
    m.lessons.some((l) => l.id === lessonBasic.id)
  )

  // 7) Detectar si es la última lección del módulo actual
  const moduleLessons = currentModule?.lessons ?? []
  const sortedModuleLessons = [...moduleLessons].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  )
  const isLastLessonOfModule =
    sortedModuleLessons.length > 0 &&
    sortedModuleLessons[sortedModuleLessons.length - 1].id === lessonBasic.id

  // 8) Cargar preguntas del quiz si es última lección del módulo
  let quizQuestions: Awaited<ReturnType<typeof getModuleQuizQuestions>> = []
  if (isLastLessonOfModule && currentModule) {
    quizQuestions = await getModuleQuizQuestions(supabase, currentModule.id)
  }

  return (
    <div className="min-h-screen w-full flex bg-[#0f0f0f] text-white">

      {/* ───────────────────────────── */}
      {/* SIDEBAR DE LA LECCIÓN (IZQ)  */}
      {/* ───────────────────────────── */}
      <aside className="hidden lg:block w-64 border-r border-white/10 p-5 sticky top-0 h-screen overflow-y-auto">
        <Link
          href={`/cursos/${courseData.slug}`}
          className="text-sm text-amber-400 hover:text-amber-300 mb-4 block"
        >
          ← Volver al curso
        </Link>

        <h3 className="text-lg font-semibold mb-4">{courseData.title}</h3>

        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module.id}>
              <h4 className="text-sm mb-2 font-bold text-orange-400">
                {module.title}
              </h4>

              <ul className="space-y-1">
                {(module.lessons ?? []).map((lessonItem: any) => {
                  // Detectar si la leccion esta bloqueada
                  const isLocked = Boolean(
                    lessonItem.isLocked ||
                    lessonItem.is_locked ||
                    lessonItem.status === 'locked'
                  )

                  const isCurrent = lessonItem.slug === lessonDetails.slug

                  const baseClasses = 'block px-3 py-1 rounded text-sm transition-colors'

                  const stateClasses = isCurrent
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                    : isLocked
                      ? 'text-neutral-500 cursor-not-allowed opacity-50'
                      : 'text-neutral-300 hover:bg-white/10'

                  // Determinar el icono segun estado
                  const icon = isLocked ? (
                    <LockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : isCurrent ? (
                    <span className="text-amber-400 text-xs">▶</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 flex-shrink-0" />
                  )

                  const content = (
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="truncate">{lessonItem.title}</span>
                    </div>
                  )

                  // Si esta bloqueada, NO enlazamos
                  if (isLocked) {
                    return (
                      <li key={lessonItem.id}>
                        <div className={`${baseClasses} ${stateClasses}`}>
                          {content}
                        </div>
                      </li>
                    )
                  }

                  // Si esta desbloqueada, enlace normal
                  return (
                    <li key={lessonItem.id}>
                      <Link
                        href={`/cursos/${courseData.slug}/${lessonItem.slug}`}
                        className={`${baseClasses} ${stateClasses}`}
                      >
                        {content}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* ───────────────────────────── */}
      {/* CONTENIDO PRINCIPAL (DERECHA) */}
      {/* ───────────────────────────── */}
      <main className="flex-1 p-6 max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-xs text-neutral-400 mb-4">
          <Link href="/cursos" className="hover:text-amber-300">Cursos</Link>
          <span className="mx-2">/</span>
          <Link href={`/cursos/${courseData.slug}`} className="hover:text-amber-300">{courseData.title}</Link>
          {currentModule && (
            <>
              <span className="mx-2">/</span>
              <span className="text-neutral-500">{currentModule.title}</span>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-amber-200">{lessonDetails.title}</span>
        </nav>

        <h1 className="text-2xl font-bold mb-4">{lessonDetails.title}</h1>

        {/* VIDEO PLAYER */}
        {lessonDetails.video_url ? (
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-6 bg-black">
            <iframe
              src={getEmbedUrl(lessonDetails.video_url) || ''}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-6 bg-neutral-900 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <span className="text-4xl block mb-2">🎬</span>
              <p>No hay vídeo configurado</p>
            </div>
          </div>
        )}

        {/* ===== RECURSOS DE LA LECCIÓN ===== */}
        {(lessonDetails.slides_url || lessonDetails.pdf_url || lessonDetails.resources_url) && (
          <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span>📎</span> Recursos de esta lección
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Slides/Presentación */}
              {lessonDetails.slides_url && (
                <a
                  href={lessonDetails.slides_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <span className="text-xl">📊</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">Slides</p>
                    <p className="text-xs text-neutral-400">Ver presentación</p>
                  </div>
                  <span className="text-neutral-500 text-sm">↗</span>
                </a>
              )}

              {/* PDF/Documento */}
              {lessonDetails.pdf_url && (
                <a
                  href={lessonDetails.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                    <span className="text-xl">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">PDF</p>
                    <p className="text-xs text-neutral-400">Descargar documento</p>
                  </div>
                  <span className="text-neutral-500 text-sm">↗</span>
                </a>
              )}

              {/* Recursos adicionales */}
              {lessonDetails.resources_url && (
                <a
                  href={lessonDetails.resources_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <span className="text-xl">📁</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">Recursos</p>
                    <p className="text-xs text-neutral-400">Material adicional</p>
                  </div>
                  <span className="text-neutral-500 text-sm">↗</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* DESCRIPCIÓN */}
        {lessonDetails.description && (
          <div className="my-6 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Descripción
            </h2>
            <div className="text-neutral-300 text-sm leading-relaxed space-y-3">
              {lessonDetails.description.split('\n\n').filter(Boolean).map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* PANEL DE NOTAS */}
        <div className="my-6 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Mis Notas
          </h2>
          <NotesPanel lessonId={lessonDetails.id} />
        </div>

        {/* QUIZ DEL MÓDULO (solo en última lección del módulo si hay preguntas) */}
        {isLastLessonOfModule && quizQuestions.length > 0 && currentModule && (
          <LessonQuiz
            moduleId={currentModule.id}
            moduleTitle={currentModule.title}
            questions={quizQuestions}
          />
        )}

        {/* NAVEGACIÓN */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-4 mt-6">
          {prevLesson ? (
            <Link
              href={`/cursos/${courseData.slug}/${prevLesson.slug}`}
              className="text-sm text-neutral-300 hover:text-amber-300"
            >
              ← Lección anterior
            </Link>
          ) : <div />}

          <NextLessonButton
            courseSlug={courseData.slug}
            lessonSlug={lessonDetails.slug}
            isLastLesson={!nextLesson}
          />
        </div>
      </main>
    </div>
  )
}
