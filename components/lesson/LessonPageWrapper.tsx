'use client'

import React from 'react'

// ✅ default export
import AccessGuard from './AccessGuard'
import LessonShell from './LessonShell'

// ✅ named exports (confirmado por errores)
import { LessonPlayer } from './LessonPlayer'
import { LessonResourcesPanel } from './LessonResourcesPanel'
import { LessonNotesPanel } from './LessonNotesPanel'

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
  content_json?: any
  attachments?: any
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
  return (
    <AccessGuard
      courseId={course.id}
      courseSlug={course.slug}
      lessonId={lesson.id}
      userId={userId}
    >
      <LessonShell course={course} lesson={lesson}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Contenido principal */}
          <div className="space-y-6">
            <LessonPlayer course={course} lesson={lesson} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LessonResourcesPanel course={course} lesson={lesson} />
            <LessonNotesPanel course={course} lesson={lesson} userId={userId} />
          </div>
        </div>
      </LessonShell>
    </AccessGuard>
  )
}
