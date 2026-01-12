/**
 * Reglas de validación para publicación de cursos
 *
 * Hard-blocks: Impiden la publicación
 * Soft-blocks: Permiten publicar con advertencia
 */

import { createClient } from '@/lib/supabase/server'
import { isValidSlug } from '@/lib/utils/normalize'

export interface PublishError {
  code: string
  message: string
  field?: string
}

export interface PublishCheckResult {
  canPublish: boolean
  hardErrors: PublishError[]
  warnings: PublishError[]
  summary: {
    totalModules: number
    totalLessons: number
    hasInstructor: boolean
    hasThumbnail: boolean
    hasDescription: boolean
  }
}

/**
 * Verifica si un curso cumple los requisitos para ser publicado
 */
export async function checkCoursePublishability(courseId: string): Promise<PublishCheckResult> {
  const supabase = await createClient()

  const hardErrors: PublishError[] = []
  const warnings: PublishError[] = []

  // 1. Obtener curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      long_description,
      status,
      instructor_id,
      thumbnail_url,
      banner_url,
      level,
      is_free
    `)
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return {
      canPublish: false,
      hardErrors: [{ code: 'COURSE_NOT_FOUND', message: 'El curso no existe o no tienes acceso.' }],
      warnings: [],
      summary: { totalModules: 0, totalLessons: 0, hasInstructor: false, hasThumbnail: false, hasDescription: false }
    }
  }

  // 2. Obtener módulos
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (modulesError) {
    hardErrors.push({ code: 'MODULES_QUERY_FAILED', message: 'Error al cargar los módulos.' })
  }

  // 3. Obtener lecciones de todos los módulos
  let lessons: { id: string; module_id: string; title: string }[] = []

  if (modules && modules.length > 0) {
    const moduleIds = modules.map(m => m.id)
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, module_id, title')
      .in('module_id', moduleIds)

    if (lessonsError) {
      hardErrors.push({ code: 'LESSONS_QUERY_FAILED', message: 'Error al cargar las lecciones.' })
    } else {
      lessons = lessonsData || []
    }
  }

  // 4. Verificar slug único
  const { data: existingSlug } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', course.slug)
    .neq('id', courseId)
    .single()

  // =====================
  // HARD ERRORS (bloquean publicación)
  // =====================

  // Título válido
  if (!course.title || course.title.trim().length < 5) {
    hardErrors.push({
      code: 'TITLE_TOO_SHORT',
      message: 'El título debe tener al menos 5 caracteres.',
      field: 'title'
    })
  }

  // Slug válido
  if (!course.slug || !isValidSlug(course.slug)) {
    hardErrors.push({
      code: 'SLUG_INVALID',
      message: 'El slug no es válido. Usa solo letras minúsculas, números y guiones.',
      field: 'slug'
    })
  }

  // Slug único
  if (existingSlug) {
    hardErrors.push({
      code: 'SLUG_DUPLICATE',
      message: 'Ya existe otro curso con este slug. Elige uno diferente.',
      field: 'slug'
    })
  }

  // Instructor obligatorio
  if (!course.instructor_id) {
    hardErrors.push({
      code: 'INSTRUCTOR_REQUIRED',
      message: 'El curso debe tener un instructor asignado.',
      field: 'instructor_id'
    })
  }

  // Al menos 1 módulo
  if (!modules || modules.length === 0) {
    hardErrors.push({
      code: 'NO_MODULES',
      message: 'El curso debe tener al menos un módulo.',
      field: 'modules'
    })
  }

  // Cada módulo debe tener al menos 1 lección
  if (modules && modules.length > 0) {
    const lessonCountByModule = new Map<string, number>()
    for (const lesson of lessons) {
      lessonCountByModule.set(lesson.module_id, (lessonCountByModule.get(lesson.module_id) || 0) + 1)
    }

    for (const mod of modules) {
      const lessonCount = lessonCountByModule.get(mod.id) || 0
      if (lessonCount === 0) {
        hardErrors.push({
          code: 'MODULE_EMPTY',
          message: `El módulo "${mod.title}" no tiene lecciones.`,
          field: `module_${mod.id}`
        })
      }
    }
  }

  // Descripción corta obligatoria
  if (!course.description || course.description.trim().length < 20) {
    hardErrors.push({
      code: 'DESCRIPTION_TOO_SHORT',
      message: 'La descripción corta debe tener al menos 20 caracteres.',
      field: 'description'
    })
  }

  // Nivel definido
  if (!course.level) {
    hardErrors.push({
      code: 'LEVEL_REQUIRED',
      message: 'Debes seleccionar un nivel para el curso.',
      field: 'level'
    })
  }

  // =====================
  // WARNINGS (permiten publicar con confirmación)
  // =====================

  // Thumbnail recomendado
  if (!course.thumbnail_url) {
    warnings.push({
      code: 'MISSING_THUMBNAIL',
      message: 'No has añadido una imagen de portada. El curso se mostrará sin imagen en el catálogo.',
      field: 'thumbnail_url'
    })
  }

  // Banner recomendado
  if (!course.banner_url) {
    warnings.push({
      code: 'MISSING_BANNER',
      message: 'No has añadido una imagen de cabecera.',
      field: 'banner_url'
    })
  }

  // Descripción larga recomendada
  if (!course.long_description || course.long_description.trim().length < 100) {
    warnings.push({
      code: 'SHORT_LONG_DESCRIPTION',
      message: 'La descripción larga es muy corta. Una descripción más detallada ayuda a los estudiantes a decidir.',
      field: 'long_description'
    })
  }

  // Pocas lecciones (menos de 3)
  if (lessons.length < 3) {
    warnings.push({
      code: 'FEW_LESSONS',
      message: `El curso solo tiene ${lessons.length} lección(es). Considera añadir más contenido.`,
      field: 'lessons'
    })
  }

  // =====================
  // RESULTADO
  // =====================

  return {
    canPublish: hardErrors.length === 0,
    hardErrors,
    warnings,
    summary: {
      totalModules: modules?.length || 0,
      totalLessons: lessons.length,
      hasInstructor: !!course.instructor_id,
      hasThumbnail: !!course.thumbnail_url,
      hasDescription: !!course.long_description && course.long_description.length >= 100
    }
  }
}

/**
 * Formatea los errores para mostrar en UI
 */
export function formatPublishErrors(result: PublishCheckResult): string[] {
  const messages: string[] = []

  if (result.hardErrors.length > 0) {
    messages.push('No se puede publicar:')
    result.hardErrors.forEach(e => messages.push(`   - ${e.message}`))
  }

  if (result.warnings.length > 0) {
    messages.push('Advertencias:')
    result.warnings.forEach(w => messages.push(`   - ${w.message}`))
  }

  return messages
}
