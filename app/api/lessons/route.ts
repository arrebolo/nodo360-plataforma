// app/api/lessons/complete/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateCertificateNumber(userId: string, courseId: string) {
  const shortUser = userId.split('-')[0]?.toUpperCase() || 'USR'
  const shortCourse = courseId.split('-')[0]?.toUpperCase() || 'CRS'
  const timestamp = Date.now().toString(36).toUpperCase()
  return `N360-${shortUser}-${shortCourse}-${timestamp}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { courseId, lessonId } = await request.json()

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'courseId y lessonId son obligatorios' },
        { status: 400 }
      )
    }

    // 1) Usuario autenticado
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = user.id

    // 2) Marcar lección como completada (upsert)
    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,lesson_id'
        }
      )

    if (upsertError) {
      console.error('[API/lessons/complete] Error upsert user_progress:', upsertError)
      return NextResponse.json(
        { error: 'No se pudo actualizar el progreso de la lección' },
        { status: 500 }
      )
    }

    // 3) Recalcular progreso del curso
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)

    if (lessonsError || !allLessons) {
      console.error('[API/lessons/complete] Error obteniendo lecciones del curso:', lessonsError)
      return NextResponse.json(
        { error: 'No se pudieron obtener las lecciones del curso' },
        { status: 500 }
      )
    }

    const lessonIds = allLessons.map(l => l.id)
    const totalLessons = lessonIds.length

    const { data: completedProgress, error: completedError } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('lesson_id', lessonIds)

    if (completedError || !completedProgress) {
      console.error('[API/lessons/complete] Error obteniendo progreso completado:', completedError)
    }

    const completedLessons = completedProgress?.length || 0
    const percentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

    // 4) Actualizar/crear inscripción en curso_enrollments
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (!existingEnrollment) {
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          progress_percentage: percentage,
          enrolled_at: new Date().toISOString()
        })

      if (enrollError) {
        console.error('[API/lessons/complete] Error creando enrollment:', enrollError)
      }
    } else {
      const { error: updateEnrollError } = await supabase
        .from('course_enrollments')
        .update({
          progress_percentage: percentage,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id)

      if (updateEnrollError) {
        console.error('[API/lessons/complete] Error actualizando enrollment:', updateEnrollError)
      }
    }

    // 5) Emitir certificado si progreso == 100%
    let certificateIssued = false
    let certificateNumber: string | null = null

    if (percentage === 100) {
      // Comprobar si ya existe certificado de curso (module_id NULL)
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .is('module_id', null)
        .maybeSingle()

      if (!existingCert) {
        // Traer datos del curso para el título
        const { data: course } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .maybeSingle()

        const title = course?.title || 'Certificado de curso'
        certificateNumber = generateCertificateNumber(userId, courseId)
        const verificationUrl = `/certificados/${encodeURIComponent(certificateNumber)}`

        const { error: certError } = await supabase
          .from('certificates')
          .insert({
            user_id: userId,
            course_id: courseId,
            module_id: null,
            certificate_number: certificateNumber,
            title,
            description: `Certificado por completar el curso "${title}" en Nodo360.`,
            issued_at: new Date().toISOString(),
            verification_url: verificationUrl
          })

        if (certError) {
          console.error('[API/lessons/complete] Error emitiendo certificado:', certError)
        } else {
          certificateIssued = true
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalLessons,
      completedLessons,
      percentage,
      certificateIssued,
      certificateNumber
    })
  } catch (error) {
    console.error('[API/lessons/complete] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
