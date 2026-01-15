/**
 * Types for the Lesson Player system
 * Server-side data fetching with client-side optimistic UI
 */

import type { LessonContent } from './lesson-content'

// Base lesson info
export type LessonInfo = {
  id: string
  slug: string
  title: string
  description: string | null
  video_url: string | null
  order_index: number
  // Resource fields (optional)
  slides_url?: string | null
  slides_type?: 'google_slides' | 'canva' | 'pdf' | 'other' | null
  pdf_url?: string | null
  resources_url?: string | null
  // Content fields
  content?: string | null  // HTML content from TipTap editor
  content_json?: LessonContent | null  // Block-based content (legacy)
}

// Module with its lessons
export type ModuleWithLessons = {
  id: string
  title: string
  order_index: number
  description?: string | null
  lessons: Array<{
    id: string
    slug: string
    title: string
    order_index: number
  }>
}

// Course basic info
export type CourseInfo = {
  id: string
  slug: string
  title: string
}

// Module basic info
export type ModuleInfo = {
  id: string
  title: string
  order_index: number
  description?: string | null
}

// Navigation state
export type LessonNavigation = {
  prevLesson: { slug: string; title: string } | null
  nextLesson: { slug: string; title: string } | null
  totalLessons: number
  currentIndex: number
}

// Progress state
export type LessonProgress = {
  completedLessonIds: string[]
  currentLessonId: string
}

// Quiz status for course completion flow
export type QuizStatus = {
  hasQuiz: boolean
  questionCount: number
  userPassed: boolean
  bestScore: number | null
}

// Main props for LessonPlayer
export type LessonPlayerProps = {
  userId: string | null
  course: CourseInfo
  lesson: LessonInfo
  module: ModuleInfo
  modules: ModuleWithLessons[]
  progress: LessonProgress
  navigation: LessonNavigation
  quizStatus?: QuizStatus
}

// Props for sub-components
export type LessonVideoProps = {
  videoUrl: string | null
  title: string
  thumbnailUrl?: string
}

export type LessonContentProps = {
  description: string | null
  lessonId: string
  userId: string | null
  hasResources?: boolean
}

export type LessonNotesProps = {
  lessonId: string
  userId: string | null
  initialContent?: string
}

export type LessonHeaderProps = {
  course: CourseInfo
  module: ModuleInfo
  lesson: LessonInfo
  navigation: LessonNavigation
}

export type LessonSidebarProps = {
  courseSlug: string
  modules: ModuleWithLessons[]
  currentLessonId: string
  completedLessonIds: string[]
  onLessonSelect?: (lessonSlug: string) => void
}

export type LessonFooterProps = {
  courseSlug: string
  lessonId: string
  isCompleted: boolean
  navigation: LessonNavigation
  onMarkComplete: () => Promise<void>
  isLoading?: boolean
}


