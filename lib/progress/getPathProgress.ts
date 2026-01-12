import { createClient } from '@/lib/supabase/server'

interface PathProgress {
  path: {
    id: string
    slug: string
    title: string
    description: string
    icon: string
    colorFrom: string
    colorTo: string
  }
  totalCourses: number
  completedCourses: number
  totalLessons: number
  completedLessons: number
  percentage: number
  nextCourse: {
    id: string
    slug: string
    title: string
  } | null
}

/**
 * Obtiene el progreso de la ruta activa del usuario
 * Calcula progreso basado en lecciones completadas
 */
export async function getActivePathProgress(userId: string): Promise<PathProgress | null> {
  console.log('🔍 [getActivePathProgress] Obteniendo progreso de ruta...')

  const supabase = await createClient()

  try {
    // 1. Obtener ruta activa del usuario
    const { data: activePath, error: pathError } = await supabase
      .from('user_selected_paths')
      .select(`
        id,
        learning_paths!inner(
          id,
          slug,
          title,
          description,
          icon,
          color_from,
          color_to
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (pathError) {
      console.error('❌ [getActivePathProgress] Error obteniendo ruta:', pathError)
      return null
    }

    if (!activePath) {
      console.log('ℹ️  [getActivePathProgress] Usuario no tiene ruta activa')
      return null
    }

    const path = activePath.learning_paths as any

    console.log('✅ [getActivePathProgress] Ruta activa:', path.title)

    // 2. Obtener cursos de la ruta en orden
    const { data: pathCourses, error: coursesError } = await supabase
      .from('path_courses')
      .select(`
        order_index,
        is_required,
        courses!inner(
          id,
          slug,
          title
        )
      `)
      .eq('path_id', path.id)
      .order('order_index')

    if (coursesError) {
      console.error('❌ [getActivePathProgress] Error obteniendo cursos:', coursesError)
      return null
    }

    if (!pathCourses || pathCourses.length === 0) {
      console.log('⚠️  [getActivePathProgress] Ruta no tiene cursos asignados')
      return {
        path: {
          id: path.id,
          slug: path.slug,
          title: path.title,
          description: path.description,
          icon: path.icon,
          colorFrom: path.color_from,
          colorTo: path.color_to
        },
        totalCourses: 0,
        completedCourses: 0,
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        nextCourse: null
      }
    }

    const totalCourses = pathCourses.length

    // 3. Obtener inscripciones del usuario en estos cursos
    const courseIds = pathCourses.map(pc => (pc.courses as any).id)

    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('user_id', userId)
      .in('course_id', courseIds)

    const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])

    // 4. Calcular progreso por curso
    let totalLessons = 0
    let completedLessons = 0
    let completedCourses = 0
    let nextCourse: { id: string; slug: string; title: string } | null = null

    for (const pathCourse of pathCourses) {
      const course = pathCourse.courses as any

      // Obtener lecciones del curso
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', course.id)

      const moduleIds = modules?.map(m => m.id) || []

      if (moduleIds.length === 0) {
        continue
      }

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      const lessonIds = lessons?.map(l => l.id) || []
      totalLessons += lessonIds.length

      if (lessonIds.length === 0) {
        continue
      }

      // Obtener progreso del usuario en estas lecciones
      const { count: completed } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
        .eq('is_completed', true)

      completedLessons += completed || 0

      // Si completó todas las lecciones del curso
      if (completed === lessonIds.length) {
        completedCourses++
      }

      // Encontrar siguiente curso (primer curso no inscrito o incompleto)
      if (!nextCourse) {
        const isEnrolled = enrolledCourseIds.has(course.id)
        const isComplete = completed === lessonIds.length

        if (!isEnrolled || !isComplete) {
          nextCourse = {
            id: course.id,
            slug: course.slug,
            title: course.title
          }
        }
      }
    }

    const percentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    console.log('📊 [getActivePathProgress] Progreso calculado:', {
      completedCourses,
      totalCourses,
      completedLessons,
      totalLessons,
      percentage
    })

    return {
      path: {
        id: path.id,
        slug: path.slug,
        title: path.title,
        description: path.description,
        icon: path.icon,
        colorFrom: path.color_from,
        colorTo: path.color_to
      },
      totalCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      percentage,
      nextCourse
    }
  } catch (error) {
    console.error('❌ [getActivePathProgress] Exception:', error)
    return null
  }
}


