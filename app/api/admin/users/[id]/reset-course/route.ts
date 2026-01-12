import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateLevel } from '@/lib/gamification/levels'
import { DEFAULT_LEVEL_RULES } from '@/lib/settings/defaults'

interface ResetCourseRequest {
  courseId: string
  preserveNotes?: boolean
}

/**
 * POST /api/admin/users/[id]/reset-course
 * Reinicia el progreso de un curso para un usuario
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar que es admin
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: me, error: roleError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', authData.user.id)
      .single()

    if (roleError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    const { id: userId } = await params
    const body: ResetCourseRequest = await request.json()
    const { courseId, preserveNotes = false } = body

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      )
    }

    console.log('[Reset Course] Iniciando reset:', {
      userId: userId.substring(0, 8),
      courseId: courseId.substring(0, 8),
      adminEmail: me.email
    })

    const admin = createAdminClient()

    // 2. Obtener lecciones y módulos del curso
    const { data: modules } = await admin
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    const moduleIds = modules?.map(m => m.id) || []

    // Obtener lecciones de esos módulos
    let lessonIds: string[] = []
    if (moduleIds.length > 0) {
      const { data: lessons } = await admin
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      lessonIds = lessons?.map(l => l.id) || []
    }

    console.log('[Reset Course] Encontrados:', {
      modules: moduleIds.length,
      lessons: lessonIds.length
    })

    // 3. Calcular XP a descontar
    const { data: xpData } = await admin
      .from('xp_events')
      .select('xp_earned')
      .eq('user_id', userId)
      .eq('course_id', courseId)

    const xpToDeduct = xpData?.reduce((sum, e) => sum + (e.xp_earned || 0), 0) || 0
    console.log('[Reset Course] XP a descontar:', xpToDeduct)

    // 4. Verificar si el curso estaba completado
    const { data: enrollment } = await admin
      .from('course_enrollments')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    const wasCompleted = !!enrollment?.completed_at

    // 5. Verificar si tenía certificado
    const { data: certificate } = await admin
      .from('certificates')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    const hadCertificate = !!certificate

    // ============================================
    // EJECUTAR TRANSACCIÓN DE RESET
    // ============================================

    let lessonsReset = 0
    let quizAttemptsReset = 0

    // 6a. DELETE user_progress
    if (lessonIds.length > 0) {
      const { count } = await admin
        .from('user_progress')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      lessonsReset = count || 0
      console.log('[Reset Course] Progreso eliminado:', lessonsReset)
    }

    // 6b. DELETE xp_events del curso
    await admin
      .from('xp_events')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)

    console.log('[Reset Course] XP events eliminados')

    // 6c. DELETE quiz_attempts de módulos del curso
    if (moduleIds.length > 0) {
      const { count } = await admin
        .from('quiz_attempts')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .in('module_id', moduleIds)

      quizAttemptsReset = count || 0
      console.log('[Reset Course] Quiz attempts eliminados:', quizAttemptsReset)
    }

    // 6d. DELETE course_final_quiz_attempts
    await admin
      .from('course_final_quiz_attempts')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)

    console.log('[Reset Course] Final quiz attempts eliminados')

    // 6e. DELETE certificate
    if (hadCertificate) {
      await admin
        .from('certificates')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)

      console.log('[Reset Course] Certificado eliminado')
    }

    // 6f. UPDATE course_enrollments
    await admin
      .from('course_enrollments')
      .update({
        progress_percentage: 0,
        completed_at: null,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)

    console.log('[Reset Course] Enrollment reseteado')

    // 6g. UPDATE user_gamification_stats
    if (xpToDeduct > 0 || wasCompleted) {
      const { data: currentStats } = await admin
        .from('user_gamification_stats')
        .select('total_xp, courses_completed, lessons_completed, certificates_earned')
        .eq('user_id', userId)
        .single()

      if (currentStats) {
        const newTotalXp = Math.max(0, (currentStats.total_xp || 0) - xpToDeduct)
        const newCoursesCompleted = wasCompleted
          ? Math.max(0, (currentStats.courses_completed || 0) - 1)
          : currentStats.courses_completed
        const newLessonsCompleted = Math.max(0, (currentStats.lessons_completed || 0) - lessonsReset)
        const newCertificatesEarned = hadCertificate
          ? Math.max(0, (currentStats.certificates_earned || 0) - 1)
          : currentStats.certificates_earned

        // Recalcular nivel basado en nuevo XP
        const { level: newLevel, xpToNextLevel } = calculateLevel(newTotalXp, DEFAULT_LEVEL_RULES)

        await admin
          .from('user_gamification_stats')
          .update({
            total_xp: newTotalXp,
            courses_completed: newCoursesCompleted,
            lessons_completed: newLessonsCompleted,
            certificates_earned: newCertificatesEarned,
            current_level: newLevel,
            xp_to_next_level: xpToNextLevel,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log('[Reset Course] Stats actualizados:', { newTotalXp, newLevel })
      }
    }

    // 6h. OPCIONAL: Eliminar notas
    if (!preserveNotes) {
      await admin
        .from('user_lesson_notes')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)

      console.log('[Reset Course] Notas eliminadas')
    }

    // 7. Registrar evento de auditoría (XP negativo)
    if (xpToDeduct > 0) {
      await admin
        .from('xp_events')
        .insert({
          user_id: userId,
          event_type: 'admin_adjustment',
          xp_earned: -xpToDeduct,
          description: `Reset de curso por admin (${me.email})`,
          course_id: courseId,
        })

      console.log('[Reset Course] Evento de auditoria creado')
    }

    console.log('[Reset Course] Reset completado exitosamente')

    return NextResponse.json({
      success: true,
      xpDeducted: xpToDeduct,
      lessonsReset,
      quizAttemptsReset,
      certificateDeleted: hadCertificate,
    })

  } catch (error) {
    console.error('[Reset Course] Error:', error)
    return NextResponse.json(
      { error: 'Error al reiniciar el curso' },
      { status: 500 }
    )
  }
}
