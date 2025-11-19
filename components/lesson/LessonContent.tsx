'use client'

import { LessonPlayer } from '@/components/lesson/LessonPlayer'
import type { LessonWithRelations } from '@/types/database'

interface LessonContentProps {
  lesson: LessonWithRelations
}

export function LessonContent({ lesson }: LessonContentProps) {
  const courseId = lesson.module.course.id

  return <LessonPlayer lesson={lesson} courseId={courseId} />
}
