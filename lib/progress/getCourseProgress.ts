import { createClient } from '@/lib/supabase/server'

// ============================================
// TIPOS
// ============================================

interface LessonWithState {
  id: string
  title: string
  slug: string
  order_index: number
  video_url: string | null
  video_duration_minutes: number | null
  is_free_preview: boolean
  isCompleted: boolean
  isUnlocked: boolean
}

interface ModuleWithState {
  id: string
  title: string
  description: string | null
  order_index: number
  lessons: LessonWithState[]
  isCompleted: boolean
  isUnlocked: boolean
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

interface CourseProgress {
  modules: ModuleWithState[]
  globalProgress: {
    totalLessons: number
    completedLessons: number
    percentage: number
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Calcula el progreso completo de un curso para un usuario
 *
 * REGLAS DE DESBLOQUEO:
 * - Módulo 1: siempre desbloqueado
 * - Módulo N: desbloqueado si módulo N-1 está 100% completo
 * - Lección 1 de módulo: desbloqueada si módulo desbloqueado
 * - Lección N: desbloqueada si lección N-1 completada
 *
 * @param courseId - ID del curso
 * @param userId - ID del usuario
 * @returns Estado completo del curso con desbloqueos calculados
 */
export async function getCourseProgressForUser(
  courseId: string,
  userId: string
): Promise<CourseProgress> {
  console.log('🔍 [getCourseProgressForUser] Iniciando...', { courseId, userId })

  const supabase = await createClient()

  try {
    // 1. Obtener módulos y lecciones del curso
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        order_index,
        lessons:lessons(
          id,
          title,
          slug,
          order_index,
          video_url,
          video_duration_minutes,
          is_free_preview
        )
      `)
      .eq('course_id', courseId)
      .order('order_index')

    if (modulesError || !modules) {
      console.error('❌ [getCourseProgressForUser] Error modules:', modulesError)
      return {
        modules: [],
        globalProgress: { totalLessons: 0, completedLessons: 0, percentage: 0 }
      }
    }

    // Ordenar lecciones dentro de cada módulo
    const sortedModules = modules.map(m => ({
      ...m,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
    }))

    console.log('📚 [getCourseProgressForUser] Módulos encontrados:', sortedModules.length)

    // 2. Obtener progreso del usuario para TODAS las lecciones
    const allLessonIds = sortedModules.flatMap(m =>
      (m.lessons || []).map((l: any) => l.id)
    )

    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', userId)
      .in('lesson_id', allLessonIds)
      .eq('is_completed', true)

    if (progressError) {
      console.error('❌ [getCourseProgressForUser] Error progress:', progressError)
    }

    const completedLessonsSet = new Set(progress?.map(p => p.lesson_id) || [])
    console.log('✅ [getCourseProgressForUser] Lecciones completadas:', completedLessonsSet.size)

    // 3. Calcular estado de cada módulo y lección
    const modulesWithState: ModuleWithState[] = []
    let totalLessons = 0
    let totalCompleted = 0

    for (let i = 0; i < sortedModules.length; i++) {
      const mod = sortedModules[i]
      const lessons = mod.lessons || []

      console.log(`\n📊 Procesando Módulo ${i + 1}: ${mod.title}`)

      // Estado de lecciones (aplicando reglas secuenciales)
      const lessonsWithState: LessonWithState[] = lessons.map((lesson: any, lessonIdx: number) => {
        const isCompleted = completedLessonsSet.has(lesson.id)

        // Lección 1: desbloqueada (se ajustará con estado del módulo)
        // Lección N: desbloqueada si lección N-1 completada
        let isUnlocked = false
        if (lessonIdx === 0) {
          isUnlocked = true // Se ajustará después con módulo
        } else {
          const prevLesson = lessons[lessonIdx - 1]
          isUnlocked = completedLessonsSet.has(prevLesson.id)
        }

        if (isCompleted) totalCompleted++
        totalLessons++

        return {
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          order_index: lesson.order_index,
          video_url: lesson.video_url,
          video_duration_minutes: lesson.video_duration_minutes,
          is_free_preview: lesson.is_free_preview,
          isCompleted,
          isUnlocked // Se ajustará después
        }
      })

      // Calcular progreso del módulo
      const completedInModule = lessonsWithState.filter(l => l.isCompleted).length
      const totalInModule = lessonsWithState.length
      const percentage = totalInModule > 0
        ? Math.round((completedInModule / totalInModule) * 100)
        : 0
      const isModuleCompleted = totalInModule > 0 && completedInModule === totalInModule

      console.log(`   Progreso: ${completedInModule}/${totalInModule} (${percentage}%)`)
      console.log(`   Completo: ${isModuleCompleted}`)

      // REGLA DE DESBLOQUEO DE MÓDULO
      const isFirstModule = i === 0
      const prevModule = i > 0 ? modulesWithState[i - 1] : null
      const prevCompleted = prevModule?.isCompleted ?? false
      const isModuleUnlocked = isFirstModule || prevCompleted

      console.log(`   ${isModuleUnlocked ? '🔓 Desbloqueado' : '🔒 Bloqueado'}: ${
        isFirstModule
          ? 'Primer módulo'
          : `Módulo anterior ${prevCompleted ? 'completo' : 'incompleto'}`
      }`)

      // Ajustar desbloqueo de lecciones según estado del módulo
      const lessonsFinal = lessonsWithState.map((l, idx) => ({
        ...l,
        // Primera lección desbloqueada si módulo desbloqueado
        // Lección N desbloqueada si módulo desbloqueado Y lección N-1 completada
        isUnlocked: isModuleUnlocked && (idx === 0 ? true : l.isUnlocked)
      }))

      modulesWithState.push({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        order_index: mod.order_index,
        lessons: lessonsFinal,
        isCompleted: isModuleCompleted,
        isUnlocked: isModuleUnlocked,
        progress: {
          completed: completedInModule,
          total: totalInModule,
          percentage
        }
      })
    }

    const globalPercentage = totalLessons > 0
      ? Math.round((totalCompleted / totalLessons) * 100)
      : 0

    console.log('\n✅ [getCourseProgressForUser] Cálculo completado')
    console.log('📊 Progreso global:', {
      totalLessons,
      completedLessons: totalCompleted,
      percentage: globalPercentage
    })

    return {
      modules: modulesWithState,
      globalProgress: {
        totalLessons,
        completedLessons: totalCompleted,
        percentage: globalPercentage
      }
    }
  } catch (error) {
    console.error('❌ [getCourseProgressForUser] Exception:', error)
    return {
      modules: [],
      globalProgress: { totalLessons: 0, completedLessons: 0, percentage: 0 }
    }
  }
}

/**
 * El temario del curso, sin nadie detras.
 *
 * Mismos modulos y lecciones que getCourseProgressForUser, pero sin progreso:
 * nada completado y todo abierto. Es lo que se le ensena a quien no ha entrado
 * y a quien ha entrado pero no se ha matriculado.
 *
 * POR QUE TODO ABIERTO
 *   El escalonado (el modulo N se abre al completar el N-1) se apoya en el
 *   progreso, y sin cuenta no hay progreso que consultar. Pintar candados que
 *   no se pueden abrir de ninguna manera solo sirve para esconder el indice a
 *   quien esta decidiendo si el curso le interesa. Lo que hay aqui son titulos
 *   de leccion, no su contenido.
 */
export async function getCourseSyllabus(courseId: string): Promise<CourseProgress> {
  const supabase = await createClient()

  const { data: modules, error } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      description,
      order_index,
      lessons:lessons(
        id,
        title,
        slug,
        order_index,
        video_url,
        video_duration_minutes,
        is_free_preview
      )
    `)
    .eq('course_id', courseId)
    .order('order_index')

  if (error || !modules) {
    console.error('❌ [getCourseSyllabus] Error modules:', error?.message)
    return {
      modules: [],
      globalProgress: { totalLessons: 0, completedLessons: 0, percentage: 0 },
    }
  }

  let totalLessons = 0

  const modulesWithState: ModuleWithState[] = modules.map((mod) => {
    const lessons: LessonWithState[] = ((mod.lessons || []) as any[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson) => {
        totalLessons++
        return {
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          order_index: lesson.order_index,
          video_url: lesson.video_url,
          video_duration_minutes: lesson.video_duration_minutes,
          is_free_preview: lesson.is_free_preview,
          isCompleted: false,
          isUnlocked: true,
        }
      })

    return {
      id: mod.id,
      title: mod.title,
      description: mod.description,
      order_index: mod.order_index,
      lessons,
      isCompleted: false,
      isUnlocked: true,
      progress: { completed: 0, total: lessons.length, percentage: 0 },
    }
  })

  return {
    modules: modulesWithState,
    globalProgress: { totalLessons, completedLessons: 0, percentage: 0 },
  }
}

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type { CourseProgress, ModuleWithState, LessonWithState }


