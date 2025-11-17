/**
 * Course Database Queries - CLIENT SIDE
 * Usa createClient de @supabase/supabase-js para queries del lado del cliente
 */

import { createClient } from '@supabase/supabase-js'
import type {
  Course,
  CourseWithInstructor,
  CourseWithModules,
  Module,
  Lesson,
  LessonWithRelations,
} from '@/types/database'

// Cliente de Supabase para el navegador
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getAllCourses(): Promise<CourseWithInstructor[]> {
  console.log('🔍 [getAllCourses-client] Obteniendo todos los cursos...')

  const supabase = getSupabaseClient()

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
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [getAllCourses-client] Error:', error)
    throw error
  }

  console.log(`✅ [getAllCourses-client] ${data?.length || 0} cursos encontrados`)
  return data || []
}

export async function getCourseBySlug(slug: string): Promise<CourseWithModules | null> {
  console.log('🔍 [getCourseBySlug-client] Buscando curso:', { slug })

  const supabase = getSupabaseClient()

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
      console.log('⚠️ [getCourseBySlug-client] Curso no encontrado:', slug)
      return null
    }
    console.error('❌ [getCourseBySlug-client] Error:', error)
    throw error
  }

  console.log('✅ [getCourseBySlug-client] Curso encontrado:', data.title)
  return data
}

export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonWithRelations | null> {
  console.log('🔍 [getLessonBySlug-client] Buscando lección:', {
    courseSlug,
    lessonSlug,
  })

  const supabase = getSupabaseClient()

  // PASO 1: Obtener el curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_premium')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()

  if (courseError || !course) {
    console.error('❌ [getLessonBySlug-client] Curso no encontrado:', courseError)
    return null
  }

  // PASO 2: Obtener módulos del curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id)

  if (modulesError || !modules) {
    console.error('❌ [getLessonBySlug-client] Error obteniendo módulos:', modulesError)
    return null
  }

  const moduleIds = modules.map((m) => m.id)

  // PASO 3: Buscar la lección
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', lessonSlug)
    .in('module_id', moduleIds)
    .single()

  if (lessonError || !lesson) {
    console.error('❌ [getLessonBySlug-client] Lección no encontrada:', lessonError)
    return null
  }

  // PASO 4: Obtener el módulo completo
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', lesson.module_id)
    .single()

  if (moduleError || !module) {
    console.error('❌ [getLessonBySlug-client] Error obteniendo módulo:', moduleError)
    return null
  }

  console.log('✅ [getLessonBySlug-client] Lección encontrada')

  // Retornar estructura consistente
  return {
    ...lesson,
    module: {
      ...module,
      course: course as Course,
    },
  }
}

export async function getAllLessonsForCourse(
  courseSlug: string
): Promise<LessonWithRelations[]> {
  console.log('🔍 [getAllLessonsForCourse-client] Obteniendo lecciones para:', courseSlug)

  const supabase = getSupabaseClient()

  // PASO 1: Obtener el curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_premium')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()

  if (courseError || !course) {
    console.error('❌ [getAllLessonsForCourse-client] Curso no encontrado:', courseError)
    return []
  }

  // PASO 2: Obtener módulos del curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  if (modulesError || !modules) {
    console.error('❌ [getAllLessonsForCourse-client] Error obteniendo módulos:', modulesError)
    return []
  }

  const moduleIds = modules.map((m) => m.id)

  // PASO 3: Obtener todas las lecciones
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .in('module_id', moduleIds)
    .order('order_index', { ascending: true })

  if (lessonsError) {
    console.error('❌ [getAllLessonsForCourse-client] Error obteniendo lecciones:', lessonsError)
    throw lessonsError
  }

  console.log(`✅ [getAllLessonsForCourse-client] ${lessons?.length || 0} lecciones encontradas`)

  // PASO 4: Mapear con estructura consistente
  return (lessons || []).map((lesson) => {
    const module = modules.find((m) => m.id === lesson.module_id)!
    return {
      ...lesson,
      module: {
        ...module,
        course: course as Course,
      },
    }
  })
}
