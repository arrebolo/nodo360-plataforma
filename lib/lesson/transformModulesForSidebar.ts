// lib/lesson/transformModulesForSidebar.ts
import type {
  SidebarModule,
  SidebarLesson,
  LessonStatus,
  ModuleStatus,
} from '@/components/lesson/LessonSidebar'
import type { ModuleItem, LessonItem } from '@/lib/db/courses-learning'

/**
 * Transforma los modulos de CourseWithStructure al formato del Sidebar
 * Mantiene los estados de progreso calculados por getCourseWithStructure
 */
export function transformModulesForSidebar(
  modules: ModuleItem[]
): SidebarModule[] {
  return modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    status: mod.status as ModuleStatus,
    lessons: mod.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      status: lesson.status as LessonStatus,
      duration: null, // Se podria extender para incluir duracion
    })),
  }))
}

/**
 * Calcula el progreso del curso basado en lecciones completadas
 */
export function calculateProgress(modules: ModuleItem[]): number {
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.status === 'completed').length,
    0
  )
  return totalLessons > 0 ? completedLessons / totalLessons : 0
}
