// lib/db/courses-learning.ts
import { createClient } from '@/lib/supabase/server'

// ============================================
// TIPOS
// ============================================

export type LessonStatus = 'completed' | 'current' | 'pending' | 'locked'
export type ModuleStatus = 'completed' | 'progress' | 'locked'

export interface LessonItem {
  id: string
  slug: string
  title: string
  status: LessonStatus
  order_index: number
  video_duration_minutes?: number | null
  is_free_preview?: boolean
}

export interface ModuleItem {
  id: string
  title: string
  status: ModuleStatus
  order_index: number
  lessons: LessonItem[]
  hasQuiz?: boolean
}

export interface CourseWithStructure {
  id: string
  slug: string
  title: string
  subtitle: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | null
  is_premium: boolean
  is_free: boolean
  duration_label: string | null
  route_label: string | null
  progress: number // 0-1
  modules: ModuleItem[]
  currentLessonSlug: string | null
}

// Tipo extendido para landing page
export interface CourseForLanding extends CourseWithStructure {
  description: string | null
  long_description: string | null
  thumbnail_url: string | null
  banner_url: string | null
  status: string
  price: number | null
  is_certifiable: boolean
  total_modules: number
  total_lessons: number
  total_duration_minutes: number | null
  enrolled_count: number
  learning_objectives: string[] | null
  requirements: string[] | null
  target_audience: string | null
  meta_title: string | null
  meta_description: string | null
  userEnrollment: {
    is_enrolled: boolean
    progress_percent: number
    current_lesson_slug: string | null
  } | null
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export async function getCourseWithStructure(
  courseSlug: string
): Promise<CourseWithStructure | null> {
  console.log('🔍 [getCourseWithStructure] Buscando curso:', courseSlug)

  const supabase = await createClient()

  // 1) Obtener curso por slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      description,
      long_description,
      level,
      is_premium,
      is_free,
      duration_label,
      thumbnail_url
    `)
    .eq('slug', courseSlug)
    .single()

  if (courseError || !course) {
    console.error('❌ [getCourseWithStructure] Curso no encontrado:', courseError?.message)
    return null
  }

  console.log('✅ [getCourseWithStructure] Curso encontrado:', course.title)

  // 2) Obtener módulos del curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      order_index
    `)
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error('❌ [getCourseWithStructure] Error módulos:', modulesError.message)
    return null
  }

  // 3) Obtener todas las lecciones de esos módulos
  const moduleIds = modules?.map(m => m.id) || []

  let lessons: { id: string; slug: string; title: string; module_id: string; order_index: number }[] = []

  if (moduleIds.length > 0) {
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        slug,
        title,
        module_id,
        order_index
      `)
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true })

    if (lessonsError) {
      console.error('❌ [getCourseWithStructure] Error lecciones:', lessonsError.message)
    }

    lessons = lessonsData || []
  }

  // 4) Obtener progreso del usuario (si está autenticado)
  const { data: { user } } = await supabase.auth.getUser()
  let completedLessonIds = new Set<string>()

  if (user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('is_completed', true)

    if (progress) {
      completedLessonIds = new Set(progress.map(p => p.lesson_id))
    }
  }

  // 5) Obtener ruta/familia del curso (si existe)
  let routeLabel: string | null = null
  const { data: pathCourses } = await supabase
    .from('learning_path_courses')
    .select(`
      learning_path_id
    `)
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

  // 6) Construir estructura de módulos con estados
  const allLessons = lessons
  const totalLessons = allLessons.length
  const completedCount = allLessons.filter(l => completedLessonIds.has(l.id)).length

  let foundCurrentLesson = false
  let currentLessonSlug: string | null = null

  const modulesWithStatus: ModuleItem[] = (modules || []).map(module => {
    const moduleLessons = allLessons
      .filter(l => l.module_id === module.id)
      .sort((a, b) => a.order_index - b.order_index)

    const lessonsWithStatus: LessonItem[] = moduleLessons.map(lesson => {
      const isCompleted = completedLessonIds.has(lesson.id)

      let status: LessonStatus = 'pending'

      if (isCompleted) {
        status = 'completed'
      } else if (!foundCurrentLesson) {
        status = 'current'
        foundCurrentLesson = true
        currentLessonSlug = lesson.slug
      }

      return {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        status,
        order_index: lesson.order_index,
      }
    })

    // Determinar estado del módulo
    const allCompleted = lessonsWithStatus.every(l => l.status === 'completed')
    const hasProgress = lessonsWithStatus.some(l => l.status === 'completed' || l.status === 'current')

    let moduleStatus: ModuleStatus = 'locked'
    if (allCompleted) {
      moduleStatus = 'completed'
    } else if (hasProgress) {
      moduleStatus = 'progress'
    } else if (lessonsWithStatus.some(l => l.status === 'current')) {
      moduleStatus = 'progress'
    }

    return {
      id: module.id,
      title: module.title,
      status: moduleStatus,
      order_index: module.order_index,
      lessons: lessonsWithStatus,
    }
  })

  // Ajustar estados de bloqueo
  let previousModuleCompleted = true
  for (const module of modulesWithStatus) {
    if (!previousModuleCompleted && module.status !== 'completed') {
      module.status = 'locked'
      module.lessons.forEach(l => {
        if (l.status !== 'completed') {
          l.status = 'locked'
        }
      })
    }
    previousModuleCompleted = module.status === 'completed'
  }

  // Calcular progreso
  const progress = totalLessons > 0 ? completedCount / totalLessons : 0

  console.log(`✅ [getCourseWithStructure] ${modulesWithStatus.length} módulos, ${totalLessons} lecciones, ${Math.round(progress * 100)}% progreso`)

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.description,
    level: course.level as CourseWithStructure['level'],
    is_premium: course.is_premium ?? false,
    is_free: course.is_free ?? true,
    duration_label: course.duration_label,
    route_label: routeLabel,
    progress,
    modules: modulesWithStatus,
    currentLessonSlug,
  }
}

// ============================================
// FUNCIÓN PARA LANDING PAGE
// ============================================

export async function getCourseForLanding(
  courseSlug: string,
  userId?: string
): Promise<CourseForLanding | null> {
  console.log('🔍 [getCourseForLanding] Buscando curso:', courseSlug)

  const supabase = await createClient()

  // 1) Obtener curso completo por slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      subtitle,
      description,
      long_description,
      level,
      status,
      is_premium,
      is_free,
      is_certifiable,
      price,
      thumbnail_url,
      banner_url,
      duration_label,
      total_modules,
      total_lessons,
      total_duration_minutes,
      enrolled_count,
      learning_objectives,
      requirements,
      target_audience,
      meta_title,
      meta_description
    `)
    .eq('slug', courseSlug)
    .single()

  if (courseError || !course) {
    console.error('❌ [getCourseForLanding] Curso no encontrado:', courseError?.message)
    return null
  }

  console.log('✅ [getCourseForLanding] Curso encontrado:', course.title)

  // 2) Obtener módulos con lecciones
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      order_index,
      requires_quiz,
      lessons:lessons(
        id,
        slug,
        title,
        order_index,
        video_duration_minutes,
        is_free_preview
      )
    `)
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error('❌ [getCourseForLanding] Error módulos:', modulesError.message)
  }

  // 3) Verificar enrollment y progreso del usuario
  let userEnrollment: CourseForLanding['userEnrollment'] = null
  let completedLessonIds = new Set<string>()

  if (userId) {
    // Verificar si está inscrito
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id, progress_percentage')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (enrollment) {
      // Obtener progreso de lecciones
      const { data: progress } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('is_completed', true)

      if (progress) {
        completedLessonIds = new Set(progress.map(p => p.lesson_id))
      }

      userEnrollment = {
        is_enrolled: true,
        progress_percent: enrollment.progress_percentage || 0,
        current_lesson_slug: null, // Se calculará abajo
      }
    }
  }

  // 4) Obtener ruta/familia del curso (si existe)
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

  // 5) Procesar módulos con estados
  const allLessons: any[] = []
  let foundCurrentLesson = false
  let currentLessonSlug: string | null = null

  const modulesWithStatus: ModuleItem[] = (modules || []).map((module: any) => {
    const moduleLessons = (module.lessons || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)

    const lessonsWithStatus: LessonItem[] = moduleLessons.map((lesson: any) => {
      allLessons.push(lesson)
      const isCompleted = completedLessonIds.has(lesson.id)

      let status: LessonStatus = 'pending'

      if (isCompleted) {
        status = 'completed'
      } else if (!foundCurrentLesson && userEnrollment?.is_enrolled) {
        status = 'current'
        foundCurrentLesson = true
        currentLessonSlug = lesson.slug
      }

      return {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        status,
        order_index: lesson.order_index,
        video_duration_minutes: lesson.video_duration_minutes,
        is_free_preview: lesson.is_free_preview,
      }
    })

    // Estado del módulo
    const allCompleted = lessonsWithStatus.every(l => l.status === 'completed')
    const hasProgress = lessonsWithStatus.some(l => l.status === 'completed' || l.status === 'current')

    let moduleStatus: ModuleStatus = 'locked'
    if (allCompleted) {
      moduleStatus = 'completed'
    } else if (hasProgress) {
      moduleStatus = 'progress'
    }

    return {
      id: module.id,
      title: module.title,
      status: moduleStatus,
      order_index: module.order_index,
      lessons: lessonsWithStatus,
      hasQuiz: module.requires_quiz,
    }
  })

  // Ajustar bloqueo de módulos
  let previousModuleCompleted = true
  for (const module of modulesWithStatus) {
    if (!previousModuleCompleted && module.status !== 'completed') {
      module.status = 'locked'
      module.lessons.forEach(l => {
        if (l.status !== 'completed') {
          l.status = 'locked'
        }
      })
    }
    previousModuleCompleted = module.status === 'completed'
  }

  // Actualizar currentLessonSlug en userEnrollment
  if (userEnrollment) {
    userEnrollment.current_lesson_slug = currentLessonSlug
  }

  // Calcular progreso
  const totalLessons = allLessons.length
  const completedCount = allLessons.filter(l => completedLessonIds.has(l.id)).length
  const progress = totalLessons > 0 ? completedCount / totalLessons : 0

  console.log(`✅ [getCourseForLanding] ${modulesWithStatus.length} módulos, ${totalLessons} lecciones, enrolled: ${!!userEnrollment}`)

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    long_description: course.long_description,
    level: course.level as CourseForLanding['level'],
    status: course.status || 'published',
    is_premium: course.is_premium ?? false,
    is_free: course.is_free ?? true,
    is_certifiable: course.is_certifiable ?? false,
    price: course.price,
    thumbnail_url: course.thumbnail_url,
    banner_url: course.banner_url,
    duration_label: course.duration_label,
    total_modules: course.total_modules ?? modulesWithStatus.length,
    total_lessons: course.total_lessons ?? totalLessons,
    total_duration_minutes: course.total_duration_minutes,
    enrolled_count: course.enrolled_count ?? 0,
    learning_objectives: course.learning_objectives,
    requirements: course.requirements,
    target_audience: course.target_audience,
    meta_title: course.meta_title,
    meta_description: course.meta_description,
    route_label: routeLabel,
    progress,
    modules: modulesWithStatus,
    currentLessonSlug,
    userEnrollment,
  }
}
