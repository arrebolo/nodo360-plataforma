'use client'

import React from 'react'

/**
 * @deprecated This component is no longer used.
 * The lesson page now uses LessonPlayer directly with server-fetched data.
 * See: app/cursos/[slug]/[lessonSlug]/page.tsx
 */

type LessonPageCourse = {
  id: string
  slug: string
  title?: string | null
}

type Lesson = {
  id: string
  slug: string
  title?: string | null
  description?: string | null
  video_url?: string | null
  slides_url?: string | null
  pdf_url?: string | null
  resources_url?: string | null
  content_json?: unknown
  attachments?: unknown
  is_free_preview?: boolean | null
}

export function LessonPageWrapper({
  course,
  lesson,
  userId,
}: {
  course: LessonPageCourse
  lesson: Lesson
  userId: string | null
}) {
  // This is a deprecated component - redirect to the lesson page
  return (
    <div className="p-8 text-center">
      <p className="text-neutral-500">
        Este componente esta deprecado. Usa la nueva pagina de leccion.
      </p>
      <a
        href={`/cursos/${course.slug}/${lesson.slug}`}
        className="text-orange-600 underline"
      >
        Ir a la leccion
      </a>
    </div>
  )
}

export default LessonPageWrapper


