import type { LessonContent } from '@/types/lesson-content'

/**
 * Verifica si una lección tiene el nuevo formato JSON
 * @param lesson - Objeto de lección de la base de datos
 * @returns true si tiene content_json válido
 */
export function hasJsonContent(lesson: any): boolean {
  if (!lesson) return false

  const contentJson = lesson.content_json

  if (contentJson === null || contentJson === undefined) {
    return false
  }

  // Verificar que sea un objeto
  if (typeof contentJson !== 'object') {
    return false
  }

  // Verificar que tenga los campos mínimos requeridos
  if (!contentJson.version || !contentJson.blocks) {
    return false
  }

  // Verificar que blocks sea un array
  if (!Array.isArray(contentJson.blocks)) {
    return false
  }

  return true
}

/**
 * Valida que el JSON tenga la estructura correcta de LessonContent
 * @param json - JSON a validar
 * @returns true si es válido
 */
export function validateLessonContentJson(json: any): json is LessonContent {
  if (typeof json !== 'object' || json === null) {
    return false
  }

  // Verificar versión
  if (json.version !== '1.0') {
    return false
  }

  // Verificar que blocks exista y sea array
  if (!Array.isArray(json.blocks)) {
    return false
  }

  // Verificar que cada block tenga id y type
  for (const block of json.blocks) {
    if (!block.id || !block.type) {
      return false
    }
  }

  return true
}

/**
 * Obtiene el progreso del usuario para una lección específica
 * @param userId - ID del usuario
 * @param lessonId - ID de la lección
 * @returns Progreso entre 0 y 100
 *
 * @todo Implementar con Supabase cuando esté lista la tabla user_progress
 */
export async function getUserLessonProgress(
  userId: string,
  lessonId: string
): Promise<number> {
  // TODO: Implementar query a Supabase
  // const { data } = await supabase
  //   .from('user_progress')
  //   .select('progress_percentage')
  //   .eq('user_id', userId)
  //   .eq('lesson_id', lessonId)
  //   .single()
  //
  // return data?.progress_percentage || 0

  // Por ahora retornar 0
  return 0
}

/**
 * Obtiene el progreso del usuario en un curso completo
 * @param userId - ID del usuario
 * @param courseId - ID del curso
 * @returns Objeto con lecciones completadas y total
 *
 * @todo Implementar con Supabase cuando esté lista la tabla user_progress
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<{ completed: number; total: number }> {
  // TODO: Implementar query a Supabase
  // const { data: lessonsData } = await supabase
  //   .from('lessons')
  //   .select('id', { count: 'exact' })
  //   .eq('module.course_id', courseId)
  //
  // const { data: progressData } = await supabase
  //   .from('user_progress')
  //   .select('lesson_id', { count: 'exact' })
  //   .eq('user_id', userId)
  //   .eq('completed', true)
  //   .in('lesson_id', lessonsData.map(l => l.id))
  //
  // return {
  //   completed: progressData?.length || 0,
  //   total: lessonsData?.length || 0
  // }

  // Por ahora retornar valores de ejemplo
  return {
    completed: 0,
    total: 10
  }
}

/**
 * Determina si un curso es premium basándose en sus datos
 * @param course - Datos del curso
 * @returns true si es premium
 */
export function isCoursePremium(course: any): boolean {
  if (!course) return false
  return course.is_premium === true
}

/**
 * Obtiene el tiempo estimado de lectura total de una lección
 * @param content - Contenido JSON de la lección
 * @returns Minutos estimados, o null si no está disponible
 */
export function getEstimatedReadingTime(content: LessonContent | null): number | null {
  if (!content) return null
  return content.estimatedReadingTime || null
}

/**
 * Cuenta los bloques de un tipo específico en una lección
 * @param content - Contenido JSON de la lección
 * @param blockType - Tipo de bloque a contar (e.g., 'video', 'quiz')
 * @returns Cantidad de bloques de ese tipo
 */
export function countBlocksByType(
  content: LessonContent | null,
  blockType: string
): number {
  if (!content || !content.blocks) return 0

  return content.blocks.filter(block => block.type === blockType).length
}

/**
 * Extrae todos los videos de una lección
 * @param content - Contenido JSON de la lección
 * @returns Array de bloques de video
 */
export function extractVideos(content: LessonContent | null) {
  if (!content || !content.blocks) return []

  return content.blocks.filter(block => block.type === 'video')
}

/**
 * Extrae todos los quizzes de una lección
 * @param content - Contenido JSON de la lección
 * @returns Array de bloques de quiz
 */
export function extractQuizzes(content: LessonContent | null) {
  if (!content || !content.blocks) return []

  return content.blocks.filter(block => block.type === 'quiz')
}

/**
 * Genera un preview texto de la lección para SEO/meta tags
 * @param content - Contenido JSON de la lección
 * @param maxLength - Longitud máxima del preview
 * @returns String de preview
 */
export function generateLessonPreview(
  content: LessonContent | null,
  maxLength: number = 160
): string {
  if (!content || !content.blocks) {
    return ''
  }

  // Buscar el primer párrafo
  const firstParagraph = content.blocks.find(block => block.type === 'paragraph')

  if (firstParagraph && 'text' in firstParagraph) {
    const text = firstParagraph.text
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }

  return ''
}

/**
 * Verifica si una lección tiene contenido premium (para control de acceso)
 * @param lesson - Datos de la lección
 * @param course - Datos del curso
 * @returns true si requiere acceso premium
 */
export function requiresPremiumAccess(lesson: any, course: any): boolean {
  // Si el curso es premium, la lección también lo es
  if (isCoursePremium(course)) {
    return true
  }

  // Si la lección NO es free preview, requiere acceso
  if (lesson.is_free_preview === false) {
    return true
  }

  return false
}
