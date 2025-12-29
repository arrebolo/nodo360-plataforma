'use client'

import LessonContent from '@/components/lesson/LessonContent'
import { LessonNotes } from '@/components/lesson/LessonNotes'

type LessonPlayerProps = {
  course: { id: string; slug: string; title: string }
  lesson: {
    id: string
    course_id: string
    module_id: string | null
    title: string
    description: string | null
    slug: string
    order_index: number | null
    video_url: string | null
    slides_url: string | null
    resources_url: string | null
    pdf_url: string | null
    content_json: any
  }
}

export default function LessonPlayer({ course, lesson }: LessonPlayerProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>
        {lesson.description ? <p className="text-sm opacity-80 mt-1">{lesson.description}</p> : null}
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          <LessonContent
            title={lesson.title}
            description={lesson.description}
            videoUrl={lesson.video_url}
            slidesUrl={lesson.slides_url}
            pdfUrl={lesson.pdf_url}
            fallbackImageUrl="/images/lesson-fallback.jpg"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recursos */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold mb-3">Recursos de la lección</div>
            <div className="text-xs opacity-80">
              Slides: {lesson.slides_url ? 'Sí' : 'No'} · PDF: {lesson.pdf_url ? 'Sí' : 'No'} · Recursos:{' '}
              {lesson.resources_url ? 'Sí' : 'No'}
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {lesson.slides_url ? (
                <a
                  href={lesson.slides_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block underline underline-offset-4 opacity-90 hover:opacity-100"
                >
                  Abrir slides
                </a>
              ) : null}

              {lesson.pdf_url ? (
                <a
                  href={lesson.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block underline underline-offset-4 opacity-90 hover:opacity-100"
                >
                  Abrir PDF
                </a>
              ) : null}

              {lesson.resources_url ? (
                <a
                  href={lesson.resources_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block underline underline-offset-4 opacity-90 hover:opacity-100"
                >
                  Abrir recursos
                </a>
              ) : null}
            </div>
          </div>

          {/* Notas */}
          <LessonNotes lessonId={lesson.id} />
        </div>
      </div>
    </div>
  )
}
