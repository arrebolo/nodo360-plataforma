import { notFound } from 'next/navigation'
import { getLessonBySlug, getNextLesson, getPreviousLesson, getAllLessonsForCourse } from '@/lib/db/queries'
import { hasJsonContent, isCoursePremium } from '@/lib/lesson-helpers'
import { LessonRenderer } from '@/components/lesson'
import { PremiumLessonRenderer } from '@/components/lesson/premium'
import { OldLessonLayoutFull } from '@/components/lesson/OldLessonLayoutFull'
import { LessonPageWrapper } from '@/components/lesson/LessonPageWrapper'
import type { Metadata } from 'next'

// ISR: Regenera la página cada hora
export const revalidate = 3600

interface LessonPageProps {
  params: { slug: string; lessonSlug: string }
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const lesson = await getLessonBySlug(resolvedParams.slug, resolvedParams.lessonSlug)

  if (!lesson) {
    return {
      title: 'Lección no encontrada | Nodo360',
    }
  }

  return {
    title: `${lesson.title} | ${lesson.module.course.title} | Nodo360`,
    description: lesson.description || `Aprende ${lesson.title} en Nodo360`,
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const resolvedParams = await params

  // Paralelizar queries para mejor performance
  const [lesson, allCourseLessons] = await Promise.all([
    getLessonBySlug(resolvedParams.slug, resolvedParams.lessonSlug),
    getAllLessonsForCourse(resolvedParams.slug)
  ])

  if (!lesson) {
    notFound()
  }

  const course = lesson.module.course
  const isPremium = isCoursePremium(course)
  const sortedLessons = allCourseLessons
    .map(l => ({ slug: l.slug, order_index: l.order_index }))
    .sort((a, b) => a.order_index - b.order_index)

  // Encontrar la siguiente lección
  const currentLessonIndex = sortedLessons.findIndex(l => l.slug === lesson.slug)
  const nextLessonSlug = currentLessonIndex >= 0 && currentLessonIndex < sortedLessons.length - 1
    ? sortedLessons[currentLessonIndex + 1].slug
    : undefined

  // NUEVO SISTEMA: Si tiene content_json, usar nuevo renderer
  if (hasJsonContent(lesson)) {
    if (isPremium) {
      // Versión Premium
      return (
        <LessonPageWrapper
          courseSlug={resolvedParams.slug}
          lessonSlug={lesson.slug}
          lessonId={lesson.id}
          isPremium={isPremium}
          allLessons={sortedLessons}
          nextLessonSlug={nextLessonSlug}
        >
          <PremiumLessonRenderer
            content={lesson.content_json!}
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            courseTitle={course.title}
            completedLessons={0}
            totalLessons={allCourseLessons.length}
            initialProgress={0}
          />
        </LessonPageWrapper>
      )
    } else {
      // Versión Gratuita
      return (
        <LessonPageWrapper
          courseSlug={resolvedParams.slug}
          lessonSlug={lesson.slug}
          lessonId={lesson.id}
          isPremium={isPremium}
          allLessons={sortedLessons}
          nextLessonSlug={nextLessonSlug}
        >
          <LessonRenderer
            content={lesson.content_json!}
            progress={0}
          />
        </LessonPageWrapper>
      )
    }
  }

  // FALLBACK: HTML antiguo (backward compatibility)
  // Get previous and next lessons for navigation
  const nextLesson = await getNextLesson(lesson.id)
  const previousLesson = await getPreviousLesson(lesson.id)

  return (
    <OldLessonLayoutFull
      lesson={lesson}
      courseSlug={resolvedParams.slug}
      previousLesson={previousLesson}
      nextLesson={nextLesson}
    />
  )
}
