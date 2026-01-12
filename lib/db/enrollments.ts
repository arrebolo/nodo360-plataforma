import { createClient } from '@/lib/supabase/server'
import { CourseEnrollment, EnrollmentWithCourse } from '@/types/database'

/**
 * Inscribe a un usuario en un curso
 * @param userId - ID del usuario
 * @param courseId - ID del curso
 * @returns Objeto con data y error
 */
export async function enrollUserInCourse(
  userId: string,
  courseId: string
): Promise<{ data: CourseEnrollment | null; error: string | null }> {
  console.log('🔍 [enrollUserInCourse] Inscribiendo usuario:', { userId, courseId })

  try {
    const supabase = await createClient()

    // 1. Verificar si ya está inscrito
    const { data: existing, error: checkError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ [enrollUserInCourse] Error verificando inscripción:', checkError)
      console.error('❌ [enrollUserInCourse] Error details:', JSON.stringify(checkError, null, 2))
    }

    if (existing) {
      console.log('ℹ️  [enrollUserInCourse] Usuario ya inscrito')
      return { data: null, error: 'Ya estás inscrito en este curso' }
    }

    // 2. Crear inscripción
    console.log('📝 [enrollUserInCourse] Datos a insertar:', {
      user_id: userId,
      course_id: courseId,
      progress_percentage: 0,
      enrolled_at: new Date().toISOString(),
    })

    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [enrollUserInCourse] Error al insertar:', error)
      console.error('❌ [enrollUserInCourse] Error code:', error.code)
      console.error('❌ [enrollUserInCourse] Error message:', error.message)
      console.error('❌ [enrollUserInCourse] Error details:', JSON.stringify(error, null, 2))
      return {
        data: null,
        error: `Error al inscribirse: ${error.message || 'Error desconocido'}`
      }
    }

    console.log('✅ [enrollUserInCourse] Inscripción exitosa:', data.id)
    return { data, error: null }
  } catch (error) {
    console.error('❌ [enrollUserInCourse] Exception:', error)
    return { data: null, error: 'Error inesperado al inscribirse' }
  }
}

/**
 * Obtiene todos los cursos en los que está inscrito un usuario
 * CON PROGRESO REAL calculado desde user_progress
 * @param userId - ID del usuario
 * @returns Array de inscripciones con información del curso y progreso real
 */
export async function getUserEnrollments(
  userId: string
): Promise<EnrollmentWithCourse[]> {
  console.log('🔍 [getUserEnrollments] Usuario:', userId)

  try {
    const supabase = await createClient()

    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        enrolled_at,
        last_accessed_at,
        completed_at,
        progress_percentage,
        course:courses!course_id (
          id,
          slug,
          title,
          description,
          level,
          thumbnail_url,
          banner_url,
          total_modules,
          total_lessons,
          total_duration_minutes,
          is_free,
          status
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('❌ [getUserEnrollments] Error:', error)
      console.error('❌ [getUserEnrollments] Error details:', JSON.stringify(error, null, 2))
      return []
    }

    if (!enrollments || enrollments.length === 0) {
      console.log('ℹ️  [getUserEnrollments] No hay inscripciones')
      return []
    }

    // Para cada inscripción, calcular progreso REAL
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const courseId = enrollment.course.id

        // Obtener TODAS las lecciones del curso
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', courseId)

        const moduleIds = modules?.map(m => m.id) || []

        if (moduleIds.length === 0) {
          console.log(`⚠️  [getUserEnrollments] Curso ${enrollment.course.title} no tiene módulos`)
          return {
            ...enrollment,
            realProgress: {
              completedLessons: 0,
              totalLessons: 0,
              percentage: 0
            }
          }
        }

        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .in('module_id', moduleIds)

        const lessonIds = lessons?.map(l => l.id) || []
        const totalLessons = lessonIds.length

        if (totalLessons === 0) {
          console.log(`⚠️  [getUserEnrollments] Curso ${enrollment.course.title} no tiene lecciones`)
          return {
            ...enrollment,
            realProgress: {
              completedLessons: 0,
              totalLessons: 0,
              percentage: 0
            }
          }
        }

        // Obtener lecciones completadas por el usuario
        const { count: completedLessons } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
          .eq('is_completed', true)

        const percentage = totalLessons > 0
          ? Math.round((completedLessons || 0) / totalLessons * 100)
          : 0

        console.log(`📊 [getUserEnrollments] ${enrollment.course.title}: ${completedLessons}/${totalLessons} (${percentage}%)`)

        return {
          ...enrollment,
          realProgress: {
            completedLessons: completedLessons || 0,
            totalLessons,
            percentage
          }
        }
      })
    )

    console.log('✅ [getUserEnrollments] Progreso calculado para:', enrollmentsWithProgress.length, 'cursos')
    return enrollmentsWithProgress as EnrollmentWithCourse[]
  } catch (error) {
    console.error('❌ [getUserEnrollments] Exception:', error)
    return []
  }
}

/**
 * Verifica si un usuario está inscrito en un curso
 * @param userId - ID del usuario
 * @param courseId - ID del curso
 * @returns true si está inscrito, false si no
 */
export async function isUserEnrolled(
  userId: string,
  courseId: string
): Promise<boolean> {
  console.log('🔍 [isUserEnrolled] Verificando:', { userId, courseId })

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    const isEnrolled = !!data && !error
    console.log(isEnrolled ? '✅ Usuario inscrito' : 'ℹ️  Usuario NO inscrito')
    return isEnrolled
  } catch (error) {
    console.error('❌ [isUserEnrolled] Exception:', error)
    return false
  }
}

/**
 * Desinscribe a un usuario de un curso
 * @param userId - ID del usuario
 * @param courseId - ID del curso
 * @returns Objeto con success y error
 */
export async function unenrollUser(
  userId: string,
  courseId: string
): Promise<{ success: boolean; error: string | null }> {
  console.log('🔍 [unenrollUser] Desinscribiendo:', { userId, courseId })

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)

    if (error) {
      console.error('❌ [unenrollUser] Error:', error)
      return { success: false, error: 'Error al desinscribirse del curso' }
    }

    console.log('✅ [unenrollUser] Desinscripción exitosa')
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [unenrollUser] Exception:', error)
    return { success: false, error: 'Error inesperado al desinscribirse' }
  }
}

/**
 * Actualiza la última vez que el usuario accedió al curso
 * @param userId - ID del usuario
 * @param courseId - ID del curso
 */
export async function updateLastAccessed(
  userId: string,
  courseId: string
): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase
      .from('course_enrollments')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('course_id', courseId)

    console.log('✅ [updateLastAccessed] Actualizado')
  } catch (error) {
    console.error('❌ [updateLastAccessed] Exception:', error)
  }
}


