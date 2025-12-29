/**
 * Sistema completo de tipos para cursos según especificación
 */

import type React from 'react'

export type CourseType = 'free' | 'premium'
export type CourseLevel = 'basico' | 'intermedio' | 'avanzado'
export type LessonState = 'locked' | 'available' | 'in_progress' | 'completed'
export type CourseTab = 'resumen' | 'modulos' | 'material' | 'preguntas'

export interface Lesson {
  id: string
  slug: string
  title: string
  description?: string
  index: number // orden dentro del módulo
  durationMin: number
  videoUrl?: string
  contentUrl?: string
  captionsUrl?: string
  transcriptUrl?: string
  locked?: boolean
}

export interface Module {
  id: string
  slug: string
  title: string
  description?: string
  index: number // orden dentro del curso
  lessons: Lesson[]
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  type: CourseType
  level: CourseLevel
  durationMin: number // total estimado
  image?: string
  thumbnailUrl?: string
  prereqCourseId?: string // gating entre cursos
  modules: Module[]
  totalLessons?: number
}

export interface UserCourseProgress {
  completedLessonIds: string[]
  lastViewed?: {
    moduleSlug: string
    lessonSlug: string
  }
  completedAt?: string
}

export interface UserProgress {
  userId: string
  courses: {
    [courseId: string]: UserCourseProgress
  }
}

// Props de componentes

export interface CourseCardProps {
  course: Course
  progress?: number // 0-100
  locked: boolean
  onOpen: (slug: string) => void
}

export interface CourseTabsProps {
  active: CourseTab
  onChange: (tab: CourseTab) => void
}

export interface CourseProgressBarProps {
  value: number
  ariaLabel?: string
}

export interface ModuleListProps {
  modules: Module[]
  progressMap: Record<string, LessonState> // lessonId -> state
  onNavigate: (mSlug: string, lSlug: string) => void
  currentLessonSlug?: string
}

export interface LessonItemProps {
  lesson: Lesson
  state: LessonState
  onClick?: () => void
}

export interface LessonPlayerProps {
  lesson: Lesson
  onStart?: () => void
  onComplete?: () => void
  captionsUrl?: string
  transcriptUrl?: string
}

export interface NextButtonProps {
  disabled?: boolean
  onNext: () => Promise<void> // marca y navega
}

export interface PrevButtonProps {
  disabled?: boolean
  onPrev: () => void
}

export interface LockBadgeProps {
  locked: boolean
  reason?: string
}

export interface RelatedLink {
  title: string
  source: string
  url: string
  type: 'interno' | 'externo'
}

export interface RelatedLinksProps {
  items: RelatedLink[]
}

export interface MiniButtonProps {
  label: string
  icon: React.ReactNode
  onClick: () => void
  ariaLabel: string
}

export interface UserProgressWidgetProps {
  courseSlug: string
  percent: number
  nextLesson?: {
    moduleSlug: string
    lessonSlug: string
    title: string
  }
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

// Funciones de utilidad

export function courseProgress(course: Course, up: UserProgress): number {
  const total = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const done = up.courses[course.id]?.completedLessonIds.length ?? 0
  return total ? Math.round((done / total) * 100) : 0
}

export function getLessonState(
  lesson: Lesson,
  completedIds: string[],
  previousLessons: Lesson[]
): LessonState {
  // Si la lección ya está completada
  if (completedIds.includes(lesson.id)) {
    return 'completed'
  }

  // Verificar si todas las lecciones anteriores están completadas
  const allPreviousCompleted = previousLessons.every(l =>
    completedIds.includes(l.id)
  )

  if (!allPreviousCompleted) {
    return 'locked'
  }

  // Si hay al menos una lección anterior completada o es la primera
  const hasStarted = previousLessons.length === 0 || completedIds.length > 0

  return hasStarted ? 'available' : 'locked'
}

export function getNextLesson(
  course: Course,
  currentModuleSlug: string,
  currentLessonSlug: string
): { module: Module; lesson: Lesson } | null {
  const flat = course.modules.flatMap(m =>
    m.lessons.map(l => ({ module: m, lesson: l }))
  )

  const currentIndex = flat.findIndex(
    x => x.module.slug === currentModuleSlug && x.lesson.slug === currentLessonSlug
  )

  if (currentIndex === -1 || currentIndex === flat.length - 1) {
    return null
  }

  return flat[currentIndex + 1]
}

export function getPrevLesson(
  course: Course,
  currentModuleSlug: string,
  currentLessonSlug: string
): { module: Module; lesson: Lesson } | null {
  const flat = course.modules.flatMap(m =>
    m.lessons.map(l => ({ module: m, lesson: l }))
  )

  const currentIndex = flat.findIndex(
    x => x.module.slug === currentModuleSlug && x.lesson.slug === currentLessonSlug
  )

  if (currentIndex <= 0) {
    return null
  }

  return flat[currentIndex - 1]
}
