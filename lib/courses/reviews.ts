/**
 * Course Reviews (2-approval system)
 * Server-side functions for mentor course reviews
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { CourseReviewVote } from '@/types/database'

/**
 * Fetch reviews for a course with mentor name
 */
export async function getCourseReviews(courseId: string) {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('course_reviews')
    .select(`
      id,
      course_id,
      mentor_id,
      vote,
      comment,
      created_at,
      updated_at,
      users!course_reviews_mentor_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getCourseReviews] Error:', error)
    return []
  }

  return data || []
}

/**
 * Submit a review for a course
 * Validates that comment is required for request_changes
 */
export async function submitReview(
  courseId: string,
  mentorId: string,
  vote: CourseReviewVote,
  comment?: string | null
) {
  const supabase = createAdminClient() as any

  // Validate comment is required for request_changes
  if (vote === 'request_changes' && (!comment || comment.trim().length < 10)) {
    return {
      success: false,
      error: 'Debes proporcionar un comentario (mínimo 10 caracteres) al solicitar cambios',
    }
  }

  const { data, error } = await supabase
    .from('course_reviews')
    .insert({
      course_id: courseId,
      mentor_id: mentorId,
      vote,
      comment: comment?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violation = already voted
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Ya has votado en este curso',
      }
    }
    console.error('[submitReview] Error:', error)
    return {
      success: false,
      error: 'Error al enviar la revisión: ' + error.message,
    }
  }

  // PEDIR CAMBIOS DEVUELVE EL CURSO A SU AUTOR.
  //
  // Hasta aquí esto solo insertaba el voto: el curso se quedaba en
  // 'pending_review'. El instructor recibía un correo diciéndole que corrigiera y
  // reenviara, y al intentarlo, submit-review se lo rechazaba, porque solo acepta
  // el reenvío desde 'draft', 'rejected' o 'changes_requested'. Un callejón sin
  // salida, y con el curso parado en una cola donde ya nadie iba a mirarlo.
  //
  // El estado y el aviso van AQUI y no en quien llama, porque quien llama son dos:
  // la pantalla del mentor y /api/mentor/courses/review. La ruta no enviaba ni
  // correo ni notificación, así que por ahí el instructor no se enteraba de nada.
  // Un único sitio, y ninguna vía se queda a medias.
  //
  // El orden importa: primero el voto, que es el que lleva la restricción de
  // «ya has votado»; solo después se mueve el curso. Al revés, un segundo voto
  // rechazado habría dejado el estado cambiado de todas formas.
  if (vote === 'request_changes') {
    const comentario = (comment ?? '').trim()

    const { error: errorDeEstado } = await supabase
      .from('courses')
      .update({
        status: 'changes_requested',
        rejection_reason: comentario,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (errorDeEstado) {
      console.error('[submitReview] No se pudo devolver el curso a su autor:', errorDeEstado)
      return {
        success: false,
        error: 'El voto se registró pero el curso no volvió a su autor: ' + errorDeEstado.message,
      }
    }

    await avisarDeLosCambios(courseId, comentario)
  }

  return { success: true, data }
}

/**
 * El correo y la notificación de «cambios solicitados».
 *
 * No bloquea: que falle un correo no puede dejar el curso a medio camino. El
 * cambio de estado ya está hecho cuando se llega aquí, que es lo que el instructor
 * necesita para poder corregir y reenviar.
 */
async function avisarDeLosCambios(courseId: string, comentario: string) {
  try {
    const supabase = createAdminClient() as any

    const { data: course } = await supabase
      .from('courses')
      .select(`
        title,
        users!courses_instructor_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq('id', courseId)
      .single()

    if (!course?.users) {
      console.error('[avisarDeLosCambios] Sin instructor al que avisar:', courseId)
      return
    }

    const instructor = course.users as {
      id: string
      email: string
      full_name: string | null
    }

    const [{ sendCourseChangesRequestedEmail }, { broadcastCourseChangesRequested }] =
      await Promise.all([
        import('@/lib/email/course-changes-requested'),
        import('@/lib/notifications/broadcast'),
      ])

    await Promise.allSettled([
      sendCourseChangesRequestedEmail({
        to: instructor.email,
        instructorName: instructor.full_name || 'Instructor',
        courseName: course.title,
        courseId,
        mentorComments: [comentario],
      }),
      broadcastCourseChangesRequested(instructor.id, course.title, comentario),
    ])
  } catch (e) {
    console.error('[avisarDeLosCambios] Error avisando al instructor:', e)
  }
}

/**
 * Get courses pending review for mentors
 */
export async function getCoursesForMentorReview() {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      level,
      is_free,
      price,
      thumbnail_url,
      created_at,
      updated_at,
      users!courses_instructor_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('[getCoursesForMentorReview] Error:', error)
    return []
  }

  return data || []
}

/**
 * Check if a mentor can still review a course (hasn't voted yet)
 */
export async function canMentorReview(courseId: string, mentorId: string) {
  const supabase = createAdminClient() as any

  const { count, error } = await supabase
    .from('course_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('mentor_id', mentorId)

  if (error) {
    console.error('[canMentorReview] Error:', error)
    return false
  }

  return (count || 0) === 0
}

/**
 * Delete all reviews for a course (used when instructor resubmits)
 */
export async function resetCourseReviews(courseId: string) {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('course_reviews')
    .delete()
    .eq('course_id', courseId)

  if (error) {
    console.error('[resetCourseReviews] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get review counts for multiple courses
 */
export async function getReviewCounts(courseIds: string[]) {
  if (courseIds.length === 0) return {}

  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('course_reviews')
    .select('course_id, vote')
    .in('course_id', courseIds)

  if (error) {
    console.error('[getReviewCounts] Error:', error)
    return {}
  }

  const counts: Record<string, { approve: number; request_changes: number }> = {}

  for (const review of data || []) {
    if (!counts[review.course_id]) {
      counts[review.course_id] = { approve: 0, request_changes: 0 }
    }
    if (review.vote === 'approve') {
      counts[review.course_id].approve++
    } else {
      counts[review.course_id].request_changes++
    }
  }

  return counts
}
