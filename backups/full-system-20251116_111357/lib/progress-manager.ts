/**
 * Sistema de Progreso del Estudiante
 *
 * Gestiona el progreso de las lecciones usando localStorage (temporal).
 * Se migrará a Supabase cuando se implemente autenticación.
 */

export interface LessonProgress {
  lessonId: string
  lessonSlug: string
  courseSlug: string
  isCompleted: boolean
  completedAt?: string
  timeSpent?: number
}

export class ProgressManager {
  private static STORAGE_KEY = 'nodo360_lesson_progress'

  /**
   * Obtener todo el progreso del usuario
   */
  static getAllProgress(): LessonProgress[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  /**
   * Obtener progreso de una lección específica
   */
  static getLessonProgress(courseSlug: string, lessonSlug: string): LessonProgress | null {
    const allProgress = this.getAllProgress()
    return allProgress.find(
      p => p.courseSlug === courseSlug && p.lessonSlug === lessonSlug
    ) || null
  }

  /**
   * Verificar si una lección está completada
   */
  static isLessonCompleted(courseSlug: string, lessonSlug: string): boolean {
    if (typeof window === 'undefined') return false

    const progress = this.getLessonProgress(courseSlug, lessonSlug)
    const isCompleted = progress?.isCompleted || false

    console.log(`📊 isLessonCompleted("${lessonSlug}"):`, isCompleted)

    return isCompleted
  }

  /**
   * Marcar lección como completada
   */
  static markLessonCompleted(
    courseSlug: string,
    lessonSlug: string,
    lessonId: string
  ): void {
    const allProgress = this.getAllProgress()
    const existingIndex = allProgress.findIndex(
      p => p.courseSlug === courseSlug && p.lessonSlug === lessonSlug
    )

    const newProgress: LessonProgress = {
      lessonId,
      lessonSlug,
      courseSlug,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      allProgress[existingIndex] = newProgress
    } else {
      allProgress.push(newProgress)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProgress))

    // Disparar evento personalizado para notificar a otros componentes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lessonCompleted', {
        detail: { courseSlug, lessonSlug, lessonId }
      }))
    }
  }

  /**
   * Obtener todas las lecciones completadas de un curso
   */
  static getCompletedLessonsInCourse(courseSlug: string): string[] {
    const allProgress = this.getAllProgress()
    return allProgress
      .filter(p => p.courseSlug === courseSlug && p.isCompleted)
      .map(p => p.lessonSlug)
  }

  /**
   * Verificar si el usuario puede acceder a una lección
   * Implementa la lógica de bloqueo secuencial
   *
   * ✅ ACTUALIZADO: Solo verifica la lección INMEDIATAMENTE anterior
   * (más flexible, permite gaps en order_index)
   */
  static canAccessLesson(
    courseSlug: string,
    lessonSlug: string,
    lessons: Array<{ slug: string; order_index: number }>
  ): boolean {
    // Ordenar lecciones por order_index
    const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index)
    const currentLessonIndex = sortedLessons.findIndex(l => l.slug === lessonSlug)

    // Si no se encuentra la lección, denegar acceso
    if (currentLessonIndex === -1) {
      console.log(`❌ Lección "${lessonSlug}" no encontrada en la lista`)
      return false
    }

    // Primera lección SIEMPRE accesible
    if (currentLessonIndex === 0) {
      console.log(`✅ "${lessonSlug}" es la primera lección, siempre accesible`)
      return true
    }

    // Para las demás, verificar SOLO la lección inmediatamente anterior
    const previousLesson = sortedLessons[currentLessonIndex - 1]
    const isPreviousCompleted = this.isLessonCompleted(courseSlug, previousLesson.slug)

    console.log(`🔍 Verificando acceso a "${lessonSlug}":`, {
      currentIndex: currentLessonIndex,
      previousLessonSlug: previousLesson.slug,
      isPreviousCompleted,
      canAccess: isPreviousCompleted
    })

    // SOLO es accesible si la anterior está completada
    return isPreviousCompleted
  }

  /**
   * Obtener la siguiente lección disponible
   */
  static getNextAvailableLesson(
    courseSlug: string,
    lessons: Array<{ slug: string; order_index: number }>
  ): string | null {
    const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index)

    for (const lesson of sortedLessons) {
      if (!this.isLessonCompleted(courseSlug, lesson.slug)) {
        return lesson.slug // Primera no completada
      }
    }

    return null // Todas completadas
  }

  /**
   * Obtener porcentaje de progreso de un curso
   */
  static getCourseProgress(
    courseSlug: string,
    lessons: Array<{ slug: string }>
  ): number {
    if (lessons.length === 0) return 0

    const completedCount = lessons.filter(lesson =>
      this.isLessonCompleted(courseSlug, lesson.slug)
    ).length

    return Math.round((completedCount / lessons.length) * 100)
  }

  /**
   * Resetear progreso (para testing)
   */
  static resetProgress(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('progressReset'))
    }
  }

  /**
   * Resetear progreso de un curso específico
   */
  static resetCourseProgress(courseSlug: string): void {
    const allProgress = this.getAllProgress()
    const filtered = allProgress.filter(p => p.courseSlug !== courseSlug)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent('progressReset', { detail: { courseSlug } }))
  }
}
