// lib/db/lessons-learning.ts
import { createClient } from '@/lib/supabase/server'

// ============================================
// TIPOS
// ============================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | null

export interface LessonResource {
  label: string
  type: 'link' | 'video' | 'pdf'
  url?: string
}

export interface LessonWithContext {
  // Datos del curso
  courseId: string
  courseSlug: string
  courseTitle: string
  isPremium: boolean
  level: CourseLevel
  routeLabel: string | null

  // Datos del módulo
  moduleId: string
  moduleTitle: string

  // Datos de la lección
  lessonId: string
  lessonSlug: string
  lessonTitle: string
  estimatedMinutes: number | null
  videoUrl: string | null
  slidesUrl: string | null
  resourcesUrl: string | null
  content: string[]

  // Navegación
  stepInfo: string
  currentStep: number
  totalSteps: number
  prevLessonSlug: string | null
  nextLessonSlug: string | null

  // Recursos
  resources: LessonResource[]
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export async function getLessonWithContext(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonWithContext | null> {
  console.log('🔍 [getLessonWithContext] Buscando lección:', lessonSlug, 'en curso:', courseSlug)

  const supabase = await createClient()

  // 1) Obtener curso por slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      is_premium,
      is_free,
      level
    `)
    .eq('slug', courseSlug)
    .single()

  if (courseError || !course) {
    console.error('❌ [getLessonWithContext] Curso no encontrado:', courseError?.message)
    return null
  }

  // 2) Obtener módulos del curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id)

  if (modulesError || !modules?.length) {
    console.error('❌ [getLessonWithContext] Módulos no encontrados:', modulesError?.message)
    return null
  }

  const moduleIds = modules.map(m => m.id)

  // 3) Obtener lección por slug (buscando en los módulos del curso)
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      slug,
      title,
      description,
      video_url,
      slides_url,
      resources_url,
      video_duration_minutes,
      order_index,
      module_id
    `)
    .eq('slug', lessonSlug)
    .in('module_id', moduleIds)
    .single()

  if (lessonError || !lesson) {
    console.error('❌ [getLessonWithContext] Lección no encontrada:', lessonError?.message)
    return null
  }

  // 4) Obtener datos del módulo
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('id', lesson.module_id)
    .single()

  if (moduleError || !moduleData) {
    console.error('❌ [getLessonWithContext] Módulo no encontrado:', moduleError?.message)
    return null
  }

  // 5) Obtener todas las lecciones del módulo para navegación
  const { data: moduleLessons, error: moduleLessonsError } = await supabase
    .from('lessons')
    .select('id, slug, order_index')
    .eq('module_id', lesson.module_id)
    .order('order_index', { ascending: true })

  if (moduleLessonsError) {
    console.error('❌ [getLessonWithContext] Error lecciones módulo:', moduleLessonsError.message)
  }

  const lessonsInModule = moduleLessons || []
  const currentIndex = lessonsInModule.findIndex(l => l.id === lesson.id)
  const totalSteps = lessonsInModule.length
  const currentStep = currentIndex + 1

  // Navegación anterior/siguiente
  let prevLessonSlug: string | null = null
  let nextLessonSlug: string | null = null

  if (currentIndex > 0) {
    prevLessonSlug = lessonsInModule[currentIndex - 1].slug
  }
  if (currentIndex < lessonsInModule.length - 1) {
    nextLessonSlug = lessonsInModule[currentIndex + 1].slug
  }

  // 6) Obtener ruta/familia del curso (si existe)
  let routeLabel: string | null = null
  const { data: pathCourses } = await supabase
    .from('learning_path_courses')
    .select('learning_path_id')
    .eq('course_id', course.id)
    .limit(1)

  if (pathCourses && pathCourses.length > 0) {
    const { data: learningPath } = await supabase
      .from('learning_paths')
      .select('name')
      .eq('id', pathCourses[0].learning_path_id)
      .single()

    if (learningPath) {
      routeLabel = learningPath.name
    }
  }

  // 7) Preparar contenido (si existe descripción, dividir en párrafos)
  const content = lesson.description
    ? lesson.description.split('\n\n').filter(Boolean)
    : ['Contenido de la lección no disponible. Mira el video para continuar con el aprendizaje.']

  // 8) Recursos de ejemplo (en el futuro se pueden obtener de BD)
  const resources: LessonResource[] = [
    { label: 'Artículo relacionado', type: 'link' },
    { label: 'Video resumen', type: 'video' },
  ]

  const stepInfo = `Paso ${currentStep} de ${totalSteps} en este módulo`

  console.log(`✅ [getLessonWithContext] Lección encontrada: ${lesson.title} (${stepInfo})`)

  return {
    // Curso
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    isPremium: course.is_premium ?? !course.is_free,
    level: course.level as CourseLevel,
    routeLabel,

    // Módulo
    moduleId: moduleData.id,
    moduleTitle: moduleData.title,

    // Lección
    lessonId: lesson.id,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title,
    estimatedMinutes: lesson.video_duration_minutes,
    videoUrl: lesson.video_url,
    slidesUrl: lesson.slides_url,
    resourcesUrl: lesson.resources_url,
    content,

    // Navegación
    stepInfo,
    currentStep,
    totalSteps,
    prevLessonSlug,
    nextLessonSlug,

    // Recursos
    resources,
  }
}
