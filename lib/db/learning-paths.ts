import { createClient } from '@/lib/supabase/server'

export interface CourseInPath {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: string
  is_free: boolean
  is_premium: boolean
  lessons_count: number
  progress_percent: number
  is_enrolled: boolean
  first_incomplete_lesson_slug: string | null
  position: number
}

export interface LearningPathWithProgress {
  id: string
  slug: string
  name: string
  emoji: string | null
  short_description: string | null
  long_description: string | null
  is_active: boolean
  position: number
  courses: CourseInPath[]
  route_progress_percent: number
  first_incomplete_course_slug: string | null
  first_incomplete_lesson_slug: string | null
  total_lessons: number
  completed_lessons: number
}

export async function getLearningPathWithProgress(
  pathSlug: string,
  userId: string | null
): Promise<LearningPathWithProgress | null> {
  const supabase = await createClient()

  console.log('🔍 [getLearningPathWithProgress] Iniciando:', { pathSlug, userId })

  // 1. Obtener la ruta con sus cursos ordenados
  const { data: path, error: pathError } = await supabase
    .from('learning_paths')
    .select(`
      id,
      slug,
      name,
      emoji,
      short_description,
      long_description,
      is_active,
      position,
      learning_path_courses (
        position,
        course:course_id (
          id,
          slug,
          title,
          description,
          thumbnail_url,
          status,
          is_free,
          is_premium
        )
      )
    `)
    .eq('slug', pathSlug)
    .single()

  if (pathError || !path) {
    console.error('❌ [getLearningPathWithProgress] Error obteniendo ruta:', pathError)
    return null
  }

  // DEBUG: Ver qué devuelve la query
  console.log('🔍 [DEBUG] Raw path.learning_path_courses:', JSON.stringify(path.learning_path_courses, null, 2))

  // 2. Ordenar cursos por posición
  const sortedPathCourses = (path.learning_path_courses ?? [])
    .sort((a, b) => a.position - b.position)

  // 3. Para cada curso, obtener lecciones y progreso
  const coursesWithProgress: CourseInPath[] = []
  let firstIncompleteCourseSlug: string | null = null
  let firstIncompleteLessonSlug: string | null = null
  let totalLessons = 0
  let completedLessons = 0

  for (const pathCourse of sortedPathCourses) {
    const course = pathCourse.course as any
    if (!course) continue

    // Obtener módulos con lecciones del curso
    const { data: modulesWithLessons } = await supabase
      .from('modules')
      .select(`
        id,
        order_index,
        lessons (
          id,
          slug,
          order_index
        )
      `)
      .eq('course_id', course.id)
      .order('order_index', { ascending: true })

    // Aplanar lecciones ordenadas por módulo y luego por orden de lección
    const allLessons = (modulesWithLessons ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap((m) =>
        (m.lessons ?? []).sort((a, b) => a.order_index - b.order_index)
      )

    const lessonsCount = allLessons.length
    totalLessons += lessonsCount

    let courseProgress = 0
    let isEnrolled = false
    let firstIncompleteLessonInCourse: string | null = null

    if (userId && lessonsCount > 0) {
      // Verificar inscripción
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .maybeSingle()

      isEnrolled = !!enrollment

      // Obtener progreso de lecciones
      const lessonIds = allLessons.map((l) => l.id)
      const { data: progress } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      const completedInCourse = (progress ?? []).filter((p) => p.is_completed).length
      completedLessons += completedInCourse
      courseProgress = Math.round((completedInCourse / lessonsCount) * 100)

      // Encontrar primera lección incompleta en este curso
      const completedLessonIds = new Set(
        (progress ?? []).filter((p) => p.is_completed).map((p) => p.lesson_id)
      )

      for (const lesson of allLessons) {
        if (!completedLessonIds.has(lesson.id)) {
          firstIncompleteLessonInCourse = lesson.slug
          break
        }
      }
    } else if (lessonsCount > 0) {
      // Usuario no logueado: primera lección es la incompleta
      firstIncompleteLessonInCourse = allLessons[0]?.slug ?? null
    }

    // Guardar primer curso/lección incompletos de la ruta
    if (
      firstIncompleteCourseSlug === null &&
      courseProgress < 100 &&
      course.status === 'published'
    ) {
      firstIncompleteCourseSlug = course.slug
      firstIncompleteLessonSlug = firstIncompleteLessonInCourse
    }

    coursesWithProgress.push({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      thumbnail_url: course.thumbnail_url,
      status: course.status ?? 'published',
      is_free: course.is_free ?? true,
      is_premium: course.is_premium ?? false,
      lessons_count: lessonsCount,
      progress_percent: courseProgress,
      is_enrolled: isEnrolled,
      first_incomplete_lesson_slug: firstIncompleteLessonInCourse,
      position: pathCourse.position,
    })
  }

  // 4. Calcular progreso ponderado de la ruta (por número de lecciones)
  let routeProgressPercent = 0
  if (totalLessons > 0 && userId) {
    let weightedSum = 0
    let totalWeight = 0

    for (const course of coursesWithProgress) {
      weightedSum += course.progress_percent * course.lessons_count
      totalWeight += course.lessons_count
    }

    routeProgressPercent = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }

  console.log('✅ [getLearningPathWithProgress] Completado:', {
    ruta: path.name,
    cursos: coursesWithProgress.length,
    progreso: routeProgressPercent,
    totalLessons,
    completedLessons,
  })

  return {
    id: path.id,
    slug: path.slug,
    name: path.name,
    emoji: path.emoji,
    short_description: path.short_description,
    long_description: path.long_description,
    is_active: path.is_active,
    position: path.position,
    courses: coursesWithProgress,
    route_progress_percent: routeProgressPercent,
    first_incomplete_course_slug: firstIncompleteCourseSlug,
    first_incomplete_lesson_slug: firstIncompleteLessonSlug,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
  }
}
