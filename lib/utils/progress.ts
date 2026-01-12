/**
 * Sistema de progreso del usuario usando localStorage
 * Formato de keys:
 * - nodo360_lesson_{lessonId}_completed: { completed: boolean, completedAt: string }
 * - nodo360_course_{courseId}_progress: CourseProgressData
 * - nodo360_notes_{lessonId}: Note[]
 */

import type { CourseWithModules, Lesson } from '@/types/database'
import type { LessonState } from '@/types/course-system'

export interface Note {
  id: string
  text: string
  timestamp: string
  lessonId: string
}

export interface CourseProgressData {
  courseId: string
  lessonsCompleted: string[]
  isCompleted: boolean
  completedAt?: string
  lastAccessedLesson?: string
}

export interface CourseProgress {
  completed: number
  total: number
  percentage: number
  isCompleted: boolean
}

export interface LessonLocation {
  moduleId: string
  moduleSlug?: string
  lessonId: string
  lessonSlug: string
  moduleTitle?: string
  lessonTitle?: string
}

// ========================================
// ANALYTICS
// ========================================

export function trackEvent(eventName: string, data?: Record<string, any>): void {
  if (typeof window === 'undefined') return

  try {
    console.log('[Analytics]', eventName, data)

    // Dispatch custom event para que otros componentes puedan escuchar
    window.dispatchEvent(
      new CustomEvent('analytics-event', {
        detail: { eventName, data, timestamp: new Date().toISOString() }
      })
    )

    // Aquí se puede integrar con Google Analytics, Mixpanel, etc.
    // if (window.gtag) {
    //   window.gtag('event', eventName, data)
    // }
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

// ========================================
// LESSON COMPLETION
// ========================================

export function isLessonCompleted(lessonId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const key = `nodo360_lesson_${lessonId}_completed`
    const data = localStorage.getItem(key)

    if (!data) return false

    // Support legacy boolean format
    if (data === 'true') return true

    // New JSON format
    try {
      const parsed = JSON.parse(data)
      return parsed.completed === true
    } catch {
      return data === 'true'
    }
  } catch (error) {
    console.error('Error reading lesson completion:', error)
    return false
  }
}

export function markLessonCompleted(lessonId: string, courseId?: string, totalLessons?: number): CourseProgressData | null {
  if (typeof window === 'undefined') return null

  try {
    // 1. Marcar lección como completada
    const lessonKey = `nodo360_lesson_${lessonId}_completed`
    localStorage.setItem(lessonKey, JSON.stringify({
      completed: true,
      completedAt: new Date().toISOString()
    }))

    // 2. Actualizar progreso del curso si courseId está disponible
    let courseProgress: CourseProgressData | null = null

    if (courseId) {
      const courseKey = `nodo360_course_${courseId}_progress`
      courseProgress = getCourseProgressData(courseId)

      if (!courseProgress.lessonsCompleted.includes(lessonId)) {
        courseProgress.lessonsCompleted.push(lessonId)
      }

      courseProgress.lastAccessedLesson = lessonId

      // 3. Verificar si curso está completo
      if (totalLessons && courseProgress.lessonsCompleted.length >= totalLessons) {
        courseProgress.isCompleted = true
        courseProgress.completedAt = new Date().toISOString()

        // Analytics: Curso completado
        trackEvent('course_complete', {
          courseId,
          totalLessons,
          completedAt: courseProgress.completedAt
        })
      }

      localStorage.setItem(courseKey, JSON.stringify(courseProgress))
    }

    // Analytics: Lección completada
    trackEvent('lesson_complete', {
      lessonId,
      courseId,
      timestamp: new Date().toISOString()
    })

    // Dispatch event para que otros componentes puedan escuchar
    window.dispatchEvent(new CustomEvent('lesson-completed', { detail: { lessonId, courseId } }))
    window.dispatchEvent(new Event('progress-updated'))

    return courseProgress
  } catch (error) {
    console.error('Error marking lesson as completed:', error)
    return null
  }
}

export function markLessonIncomplete(lessonId: string, courseId?: string): void {
  if (typeof window === 'undefined') return

  try {
    // 1. Marcar lección como incompleta
    const lessonKey = `nodo360_lesson_${lessonId}_completed`
    localStorage.removeItem(lessonKey)

    // 2. Actualizar progreso del curso
    if (courseId) {
      const courseKey = `nodo360_course_${courseId}_progress`
      const courseProgress = getCourseProgressData(courseId)

      courseProgress.lessonsCompleted = courseProgress.lessonsCompleted.filter(id => id !== lessonId)
      courseProgress.isCompleted = false
      courseProgress.completedAt = undefined

      localStorage.setItem(courseKey, JSON.stringify(courseProgress))
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('lesson-uncompleted', { detail: { lessonId, courseId } }))
    window.dispatchEvent(new Event('progress-updated'))
  } catch (error) {
    console.error('Error marking lesson as incomplete:', error)
  }
}

// ========================================
// COURSE PROGRESS
// ========================================

export function getCourseProgressData(courseId: string): CourseProgressData {
  if (typeof window === 'undefined') {
    return {
      courseId,
      lessonsCompleted: [],
      isCompleted: false
    }
  }

  try {
    const key = `nodo360_course_${courseId}_progress`
    const data = localStorage.getItem(key)

    if (data) {
      return JSON.parse(data)
    }

    return {
      courseId,
      lessonsCompleted: [],
      isCompleted: false
    }
  } catch (error) {
    console.error('Error getting course progress data:', error)
    return {
      courseId,
      lessonsCompleted: [],
      isCompleted: false
    }
  }
}

export function getCourseProgress(
  lessonIds: string[],
  totalLessons: number
): CourseProgress {
  if (typeof window === 'undefined') {
    return { completed: 0, total: totalLessons, percentage: 0, isCompleted: false }
  }

  try {
    const completedCount = lessonIds.filter((id) => isLessonCompleted(id)).length
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    const isCompleted = totalLessons > 0 && completedCount >= totalLessons

    return {
      completed: completedCount,
      total: totalLessons,
      percentage,
      isCompleted
    }
  } catch (error) {
    console.error('Error calculating course progress:', error)
    return { completed: 0, total: totalLessons, percentage: 0, isCompleted: false }
  }
}

// ========================================
// NOTES
// ========================================

export function getLessonNotes(lessonId: string): Note[] {
  if (typeof window === 'undefined') return []

  try {
    const key = `nodo360_notes_${lessonId}`
    const stored = localStorage.getItem(key)
    if (!stored) return []

    const notes = JSON.parse(stored) as Note[]
    return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error('Error reading notes:', error)
    return []
  }
}

export function addLessonNote(lessonId: string, text: string): Note {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add note on server side')
  }

  try {
    const note: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      timestamp: new Date().toISOString(),
      lessonId,
    }

    const key = `nodo360_notes_${lessonId}`
    const existing = getLessonNotes(lessonId)
    const updated = [note, ...existing]

    localStorage.setItem(key, JSON.stringify(updated))

    // Dispatch event
    window.dispatchEvent(new CustomEvent('note-added', { detail: { lessonId, note } }))

    return note
  } catch (error) {
    console.error('Error adding note:', error)
    throw error
  }
}

export function deleteLessonNote(lessonId: string, noteId: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = `nodo360_notes_${lessonId}`
    const existing = getLessonNotes(lessonId)
    const updated = existing.filter((note) => note.id !== noteId)

    if (updated.length === 0) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(updated))
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('note-deleted', { detail: { lessonId, noteId } }))
  } catch (error) {
    console.error('Error deleting note:', error)
  }
}

// ========================================
// LESSON STATE & GATING
// ========================================

/**
 * Get the state of a specific lesson within a course
 * Implements FSM: locked → available → in_progress → completed
 *
 * GATING RULES:
 * - First lesson always available
 * - Rest locked until previous lessons completed
 */
export function getLessonState(
  course: CourseWithModules,
  moduleSlug: string,
  lessonSlug: string
): LessonState {
  if (typeof window === 'undefined') return 'locked'

  try {
    // Find the lesson
    const foundModule = course.modules.find(m => {
      // Try to match by slug if available, otherwise by id
      return m.id === moduleSlug || (moduleSlug && moduleSlug.length > 0)
    })

    if (!foundModule) return 'locked'

    const lesson = foundModule.lessons.find(l => l.slug === lessonSlug)
    if (!lesson) return 'locked'

    // Check if completed
    if (isLessonCompleted(lesson.id)) {
      return 'completed'
    }

    // Get all lessons in order
    const allLessons = getAllLessonsInOrder(course)
    const currentIndex = allLessons.findIndex(l => l.id === lesson.id)

    if (currentIndex === -1) return 'locked'

    // First lesson is always available
    if (currentIndex === 0) {
      return 'available'
    }

    // Check if all previous lessons are completed
    const previousLessons = allLessons.slice(0, currentIndex)
    const allPreviousCompleted = previousLessons.every(l => isLessonCompleted(l.id))

    if (!allPreviousCompleted) {
      return 'locked'
    }

    // Check if lesson has been started (in progress)
    const progressData = getCourseProgressData(course.id)
    if (progressData.lastAccessedLesson === lesson.id) {
      return 'in_progress'
    }

    return 'available'
  } catch (error) {
    console.error('Error getting lesson state:', error)
    return 'locked'
  }
}

/**
 * Helper: Get all lessons in sequential order across all modules
 */
function getAllLessonsInOrder(course: CourseWithModules): Lesson[] {
  return course.modules
    .sort((a, b) => a.order_index - b.order_index)
    .flatMap(module =>
      [...module.lessons].sort((a, b) => a.order_index - b.order_index)
    )
}

/**
 * Check if a course is available (prerequisites met)
 * Para MVP sin prerequisitos, siempre retorna true
 * En el futuro se puede implementar prereq_course_id
 */
export function isCourseAvailable(course: CourseWithModules): boolean {
  // MVP: todos los cursos están disponibles
  // TODO: Implementar verificación de prereq_course_id cuando se agregue al schema
  return true

  // Implementación futura:
  // if (!course.prereq_course_id) return true
  // const prereqProgress = getCourseProgressData(course.prereq_course_id)
  // return prereqProgress.isCompleted
}

/**
 * Get next lesson in course sequence
 */
export function getNextLesson(
  course: CourseWithModules,
  currentModuleSlug: string,
  currentLessonSlug: string
): LessonLocation | null {
  try {
    const allLessons = getAllLessonsInOrder(course)
    const currentIndex = allLessons.findIndex(l => l.slug === currentLessonSlug)

    if (currentIndex === -1 || currentIndex === allLessons.length - 1) {
      return null
    }

    const nextLesson = allLessons[currentIndex + 1]
    const nextModule = course.modules.find(m =>
      m.lessons.some(l => l.id === nextLesson.id)
    )

    if (!nextModule) return null

    return {
      moduleId: nextModule.id,
      lessonId: nextLesson.id,
      lessonSlug: nextLesson.slug,
      moduleTitle: nextModule.title,
      lessonTitle: nextLesson.title
    }
  } catch (error) {
    console.error('Error getting next lesson:', error)
    return null
  }
}

/**
 * Get previous lesson in course sequence
 */
export function getPreviousLesson(
  course: CourseWithModules,
  currentModuleSlug: string,
  currentLessonSlug: string
): LessonLocation | null {
  try {
    const allLessons = getAllLessonsInOrder(course)
    const currentIndex = allLessons.findIndex(l => l.slug === currentLessonSlug)

    if (currentIndex <= 0) {
      return null
    }

    const prevLesson = allLessons[currentIndex - 1]
    const prevModule = course.modules.find(m =>
      m.lessons.some(l => l.id === prevLesson.id)
    )

    if (!prevModule) return null

    return {
      moduleId: prevModule.id,
      lessonId: prevLesson.id,
      lessonSlug: prevLesson.slug,
      moduleTitle: prevModule.title,
      lessonTitle: prevLesson.title
    }
  } catch (error) {
    console.error('Error getting previous lesson:', error)
    return null
  }
}

/**
 * Get first available (unlocked) lesson in course
 */
export function getFirstAvailableLesson(course: CourseWithModules): LessonLocation | null {
  try {
    const allLessons = getAllLessonsInOrder(course)

    // Find first incomplete lesson
    for (const lesson of allLessons) {
      if (!isLessonCompleted(lesson.id)) {
        const lessonModule = course.modules.find(m =>
          m.lessons.some(l => l.id === lesson.id)
        )

        if (!lessonModule) continue

        return {
          moduleId: lessonModule.id,
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          moduleTitle: lessonModule.title,
          lessonTitle: lesson.title
        }
      }
    }

    // All lessons completed, return first lesson
    if (allLessons.length > 0) {
      const firstLesson = allLessons[0]
      const firstModule = course.modules.find(m =>
        m.lessons.some(l => l.id === firstLesson.id)
      )

      if (firstModule) {
        return {
          moduleId: firstModule.id,
          lessonId: firstLesson.id,
          lessonSlug: firstLesson.slug,
          moduleTitle: firstModule.title,
          lessonTitle: firstLesson.title
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting first available lesson:', error)
    return null
  }
}

/**
 * Mark lesson as started (in progress)
 */
export function markLessonStarted(lessonId: string, courseId: string): void {
  if (typeof window === 'undefined') return

  try {
    const courseProgress = getCourseProgressData(courseId)
    courseProgress.lastAccessedLesson = lessonId

    const courseKey = `nodo360_course_${courseId}_progress`
    localStorage.setItem(courseKey, JSON.stringify(courseProgress))

    // Analytics: Lección iniciada
    trackEvent('lesson_start', {
      lessonId,
      courseId,
      timestamp: new Date().toISOString()
    })

    // Dispatch event
    window.dispatchEvent(new CustomEvent('lesson-started', { detail: { lessonId, courseId } }))
    window.dispatchEvent(new Event('progress-updated'))
  } catch (error) {
    console.error('Error marking lesson as started:', error)
  }
}

/**
 * Track locked access attempt (for analytics)
 */
export function trackLockedAccessAttempt(
  lessonId: string,
  courseId: string,
  reason: string
): void {
  trackEvent('locked_access_attempt', {
    lessonId,
    courseId,
    reason,
    timestamp: new Date().toISOString()
  })
}

// ========================================
// UTILITIES
// ========================================

export function resetAllProgress(): void {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    const nodoKeys = keys.filter((key) => key.startsWith('nodo360_'))

    nodoKeys.forEach((key) => {
      localStorage.removeItem(key)
    })

    console.log(`Reset ${nodoKeys.length} progress items`)
    window.dispatchEvent(new Event('progress-updated'))
  } catch (error) {
    console.error('Error resetting progress:', error)
  }
}


