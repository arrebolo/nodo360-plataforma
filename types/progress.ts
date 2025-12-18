// types/progress.ts
// Tipos para las respuestas del endpoint /api/progress

export type ProgressStatus =
  | 'OK'                    // Leccion marcada como completada
  | 'LESSON_COMPLETED'      // Leccion completada, curso en progreso
  | 'COURSE_COMPLETED'      // Curso completado, certificado emitido
  | 'NEEDS_FINAL_QUIZ'      // Curso completo pero falta quiz final

export interface ProgressResponse {
  success: boolean
  status?: ProgressStatus
  message?: string

  // Para redireccion a quiz final
  redirectTo?: string
  moduleId?: string
  moduleTitle?: string

  // Estado del curso
  course_completed?: boolean

  // Info del certificado (cuando se emite)
  certificate_issued?: boolean
  certificate_number?: string
  certificate_id?: string
  course_title?: string
  certificate?: {
    id: string
    number: string
    title: string
  } | null

  // XP y gamificacion
  xp_gained?: number
  new_total_xp?: number
  new_level?: number
}

export interface ProgressRequestBody {
  lessonId?: string
  courseId?: string
  courseSlug?: string
  forceCheck?: boolean  // Para forzar recalculo (tras aprobar quiz)
}
