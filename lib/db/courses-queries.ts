/**
 * Course Database Queries
 *
 * ESTRUCTURA CONSISTENTE:
 * - SIEMPRE usar lesson.module.course (singular)
 * - NUNCA usar lesson.modules.courses (plural)
 * - Todas las queries retornan la misma estructura
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type {
  Course,
  CourseWithInstructor,
  CourseWithModules,
  Module,
  Lesson,
  LessonWithRelations,
} from '@/types/database'

// Re-exportar LessonWithRelations para conveniencia
export type { LessonWithRelations }

// =====================================================
// COURSE QUERIES
// =====================================================

/**
 * Get all published and coming_soon courses
 * @returns Lista de cursos visibles con información del instructor
 */
export async function getAllCourses(): Promise<CourseWithInstructor[]> {
  console.log('🔍 [getAllCourses] Obteniendo todos los cursos...')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:instructor_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .in('status', ['published', 'coming_soon'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [getAllCourses] Error:', error)
    logger.error('[getAllCourses] Error:', error)
    throw error
  }

  console.log(`✅ [getAllCourses] ${data?.length || 0} cursos encontrados`)
  return data || []
}

/**
 * Get a single course by slug with modules and lessons
 * @param slug - El slug del curso (ej: "bitcoin-desde-cero")
 * @returns Curso con módulos y lecciones, o null si no existe
 */
export async function getCourseBySlug(
  slug: string
): Promise<CourseWithModules | null> {
  console.log('🔍 [getCourseBySlug] Buscando curso:', { slug })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:instructor_id (
        id,
        full_name,
        avatar_url,
        bio
      ),
      modules (
        *,
        lessons (
          *
        )
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getCourseBySlug] Curso no encontrado:', slug)
      return null
    }
    console.error('❌ [getCourseBySlug] Error:', error)
    logger.error('[getCourseBySlug] Error:', error)
    throw error
  }

  console.log('✅ [getCourseBySlug] Curso encontrado:', {
    slug,
    title: data?.title,
    modules: data?.modules?.length || 0,
  })

  return data
}

/**
 * Get lesson by slug within a course
 * ESTRUCTURA GARANTIZADA: lesson.module.course (singular)
 *
 * @param courseSlug - El slug del curso (ej: "bitcoin-desde-cero")
 * @param lessonSlug - El slug de la lección (ej: "leccion-1-1")
 * @returns Lección con module.course, o null si no existe
 */
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonWithRelations | null> {
  console.log('🔍 [getLessonBySlug] Buscando lección:', {
    courseSlug,
    lessonSlug,
  })

  const supabase = await createClient()

  // PASO 1: Obtener el curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_premium')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()

  if (courseError || !course) {
    console.error('❌ [getLessonBySlug] Curso no encontrado:', {
      courseSlug,
      error: courseError,
    })
    return null
  }

  console.log('✅ [getLessonBySlug] Curso encontrado:', course.title)

  // PASO 2: Obtener módulos del curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', course.id)

  if (modulesError || !modules || modules.length === 0) {
    console.error('❌ [getLessonBySlug] No hay módulos para el curso:', {
      courseSlug,
      error: modulesError,
    })
    return null
  }

  console.log(`✅ [getLessonBySlug] ${modules.length} módulos encontrados`)

  const moduleIds = modules.map((m) => m.id)

  // PASO 3: Buscar la lección SOLO en los módulos de este curso
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', lessonSlug)
    .in('module_id', moduleIds)
    .single()

  if (lessonError || !lesson) {
    console.error('❌ [getLessonBySlug] Lección no encontrada:', {
      lessonSlug,
      courseSlug,
      error: lessonError,
    })
    return null
  }

  console.log('✅ [getLessonBySlug] Lección encontrada:', lesson.title)

  // PASO 4: Obtener el módulo completo
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', lesson.module_id)
    .single()

  if (moduleError || !module) {
    console.error('❌ [getLessonBySlug] Error obteniendo módulo:', moduleError)
    return null
  }

  console.log('✅ [getLessonBySlug] Módulo encontrado:', module.title)

  // RETORNAR ESTRUCTURA CONSISTENTE: lesson.module.course
  const result: LessonWithRelations = {
    ...lesson,
    module: {
      ...module,
      course: course as Course,
    },
  }

  console.log('✅ [getLessonBySlug] Estructura final:', {
    lesson: result.title,
    module: result.module.title,
    course: result.module.course.title,
  })

  return result
}

/**
 * Get all lessons for a course
 * ESTRUCTURA GARANTIZADA: lesson.module.course (singular)
 *
 * @param courseSlug - El slug del curso
 * @returns Array de lecciones con module.course
 */
export async function getAllLessonsForCourse(
  courseSlug: string
): Promise<LessonWithRelations[]> {
  console.log('🔍 [getAllLessonsForCourse] Obteniendo lecciones para:', {
    courseSlug,
  })

  const supabase = await createClient()

  // PASO 1: Obtener el curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_premium')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()

  if (courseError || !course) {
    console.error('❌ [getAllLessonsForCourse] Curso no encontrado:', {
      courseSlug,
      error: courseError,
    })
    return []
  }

  // PASO 2: Obtener módulos del curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  if (modulesError || !modules) {
    console.error('❌ [getAllLessonsForCourse] Error obteniendo módulos:', {
      error: modulesError,
    })
    return []
  }

  console.log(`✅ [getAllLessonsForCourse] ${modules.length} módulos encontrados`)

  const moduleIds = modules.map((m) => m.id)

  // PASO 3: Obtener todas las lecciones de estos módulos
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .in('module_id', moduleIds)
    .order('order_index', { ascending: true })

  if (lessonsError) {
    console.error('❌ [getAllLessonsForCourse] Error obteniendo lecciones:', {
      error: lessonsError,
    })
    throw lessonsError
  }

  console.log(`✅ [getAllLessonsForCourse] ${lessons?.length || 0} lecciones encontradas`)

  // PASO 4: Mapear lecciones con estructura consistente
  const lessonsWithRelations: LessonWithRelations[] = (lessons || []).map((lesson) => {
    const module = modules.find((m) => m.id === lesson.module_id)
    if (!module) {
      console.error('❌ [getAllLessonsForCourse] Módulo no encontrado para lección:', {
        lessonId: lesson.id,
        moduleId: lesson.module_id,
      })
      throw new Error(`Module not found for lesson ${lesson.id}`)
    }

    return {
      ...lesson,
      module: {
        ...module,
        course: course as Course,
      },
    }
  })

  console.log('✅ [getAllLessonsForCourse] Estructura final creada para', lessonsWithRelations.length, 'lecciones')

  return lessonsWithRelations
}

/**
 * Get next lesson in sequence
 * @param currentLessonId - ID de la lección actual
 * @returns Siguiente lección o null si es la última
 */
export async function getNextLesson(
  currentLessonId: string
): Promise<Lesson | null> {
  console.log('🔍 [getNextLesson] Buscando siguiente lección:', { currentLessonId })

  const supabase = await createClient()

  // Get current lesson
  const { data: currentLesson, error: currentError } = await supabase
    .from('lessons')
    .select('module_id, order_index')
    .eq('id', currentLessonId)
    .single()

  if (currentError) {
    console.error('❌ [getNextLesson] Error obteniendo lección actual:', currentError)
    throw currentError
  }

  // Try to get next lesson in same module
  const { data: nextInModule, error: nextError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', currentLesson.module_id)
    .gt('order_index', currentLesson.order_index)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!nextError && nextInModule) {
    console.log('✅ [getNextLesson] Siguiente lección en el mismo módulo:', nextInModule.title)
    return nextInModule
  }

  // If no next lesson in module, get first lesson of next module
  const { data: currentModule, error: moduleError } = await supabase
    .from('modules')
    .select('course_id, order_index')
    .eq('id', currentLesson.module_id)
    .single()

  if (moduleError) {
    console.error('❌ [getNextLesson] Error obteniendo módulo actual:', moduleError)
    throw moduleError
  }

  const { data: nextModule, error: nextModuleError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', currentModule.course_id)
    .gt('order_index', currentModule.order_index)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (nextModuleError || !nextModule) {
    console.log('ℹ️ [getNextLesson] No hay más lecciones')
    return null
  }

  const { data: firstLesson, error: firstError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', nextModule.id)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstError) {
    console.error('❌ [getNextLesson] Error obteniendo primera lección del siguiente módulo:', firstError)
    return null
  }

  if (firstLesson) {
    console.log('✅ [getNextLesson] Siguiente lección en el siguiente módulo:', firstLesson.title)
  }

  return firstLesson
}

/**
 * Get previous lesson in sequence
 * @param currentLessonId - ID de la lección actual
 * @returns Lección anterior o null si es la primera
 */
export async function getPreviousLesson(
  currentLessonId: string
): Promise<Lesson | null> {
  console.log('🔍 [getPreviousLesson] Buscando lección anterior:', { currentLessonId })

  const supabase = await createClient()

  // Get current lesson
  const { data: currentLesson, error: currentError } = await supabase
    .from('lessons')
    .select('module_id, order_index')
    .eq('id', currentLessonId)
    .single()

  if (currentError) {
    console.error('❌ [getPreviousLesson] Error obteniendo lección actual:', currentError)
    throw currentError
  }

  // Try to get previous lesson in same module
  const { data: prevInModule, error: prevError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', currentLesson.module_id)
    .lt('order_index', currentLesson.order_index)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!prevError && prevInModule) {
    console.log('✅ [getPreviousLesson] Lección anterior en el mismo módulo:', prevInModule.title)
    return prevInModule
  }

  // If no previous lesson in module, get last lesson of previous module
  const { data: currentModule, error: moduleError } = await supabase
    .from('modules')
    .select('course_id, order_index')
    .eq('id', currentLesson.module_id)
    .single()

  if (moduleError) {
    console.error('❌ [getPreviousLesson] Error obteniendo módulo actual:', moduleError)
    throw moduleError
  }

  const { data: prevModule, error: prevModuleError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', currentModule.course_id)
    .lt('order_index', currentModule.order_index)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (prevModuleError || !prevModule) {
    console.log('ℹ️ [getPreviousLesson] No hay lecciones anteriores')
    return null
  }

  const { data: lastLesson, error: lastError } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', prevModule.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastError) {
    console.error('❌ [getPreviousLesson] Error obteniendo última lección del módulo anterior:', lastError)
    return null
  }

  if (lastLesson) {
    console.log('✅ [getPreviousLesson] Lección anterior en el módulo anterior:', lastLesson.title)
  }

  return lastLesson
}


