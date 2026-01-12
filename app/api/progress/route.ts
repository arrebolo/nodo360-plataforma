import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { awardXP } from '@/lib/gamification/awardXP'
import { checkAndAwardBadges } from '@/lib/gamification/checkAndAwardBadges'
import { updateStreak } from '@/lib/gamification/updateStreak'
import { rateLimit, getClientIP, rateLimitExceeded } from '@/lib/ratelimit'

/**
 * POST /api/progress
 * Marca una lección como completada y otorga XP (dinámico por system_settings).
 * Body: { lessonId: string }
 */
export async function POST(request: NextRequest) {
  // Rate limiting moderado para progreso (usuarios autenticados)
  const ip = getClientIP(request)
  const { success } = await rateLimit(ip, 'api')

  if (!success) {
    return rateLimitExceeded()
  }

  console.log('[API POST /progress] Iniciando...')

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API POST /progress] No autenticado')
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const { lessonId } = await request.json()

    if (!lessonId) {
      console.error('❌ [API POST /progress] lessonId faltante')
      return NextResponse.json({ error: 'lessonId es requerido' }, { status: 400 })
    }

    console.log('📊 [API POST /progress] Guardando progreso:', {
      userId: user.id,
      lessonId
    })

    // 1) Comprobar si ya estaba completada (para evitar XP duplicado)
    const { data: existingProgress, error: existingError } = await supabase
      .from('user_progress')
      .select('is_completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existingError) {
      console.error('❌ [API POST /progress] Error leyendo progreso previo:', existingError)
      return NextResponse.json({ error: 'Error al leer progreso' }, { status: 500 })
    }

    const alreadyCompleted = existingProgress?.is_completed === true

    // 2) Guardar progreso (upsert)
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          watch_time_seconds: 0
        },
        { onConflict: 'user_id,lesson_id' }
      )

    if (progressError) {
      console.error('❌ [API POST /progress] Error al guardar:', progressError)
      return NextResponse.json({ error: 'Error al guardar progreso' }, { status: 500 })
    }

    console.log('✅ [API POST /progress] Progreso guardado correctamente')

    // ========================================
    // 3) NUEVO: Actualizar course_enrollments
    // ========================================
    try {
      // Obtener el course_id desde la lección
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', lessonId)
        .single()

      const courseId = lessonData?.course_id

      if (courseId) {
        // Contar total de lecciones del curso
        const { count: totalLessons } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', courseId)

        // Obtener IDs de lecciones del curso
        const { data: courseLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId)

        const lessonIds = courseLessons?.map(l => l.id) || []

        // Contar lecciones completadas por el usuario en este curso
        const { count: completedLessons } = await supabase
          .from('user_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('lesson_id', lessonIds)

        // Calcular porcentaje de progreso
        const progressPercentage = totalLessons && totalLessons > 0
          ? Math.round(((completedLessons || 0) / totalLessons) * 100)
          : 0

        const isCompleted = progressPercentage >= 100

        console.log('📊 [Progress] Actualizando enrollment:', {
          courseId: courseId.substring(0, 8),
          totalLessons,
          completedLessons,
          progressPercentage,
          isCompleted,
        })

        // Actualizar course_enrollments
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .update({
            progress_percentage: progressPercentage,
            completed_at: isCompleted ? new Date().toISOString() : null,
            last_accessed_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('course_id', courseId)

        if (enrollmentError) {
          console.error('⚠️ [Progress] Error actualizando enrollment:', enrollmentError)
        } else {
          console.log('✅ [Progress] Enrollment actualizado:', progressPercentage + '%')
        }
      }
    } catch (enrollmentUpdateError) {
      // No fallar la request principal por esto
      console.error('⚠️ [Progress] Error en actualizacion de enrollment:', enrollmentUpdateError)
    }

    // ========================================
    // 4) NUEVO: Actualizar racha de actividad
    // ========================================
    let streakResult = { currentStreak: 0, longestStreak: 0, streakIncreased: false, streakReset: false }
    try {
      streakResult = await updateStreak(user.id)
      console.log('🔥 [Progress] Streak actualizado:', streakResult)
    } catch (streakError) {
      console.error('⚠️ [Progress] Error actualizando streak:', streakError)
    }

    // 5) Si ya estaba completada, no otorgamos XP de nuevo
    if (alreadyCompleted) {
      return NextResponse.json({
        success: true,
        message: 'Lección ya estaba completada (sin XP adicional)',
        streak: streakResult.currentStreak,
      })
    }

    // 6) Otorgar XP centralizado (settings + niveles)
    const xpResult = await awardXP({
      userId: user.id,
      eventType: 'lesson_completed',
      context: { lessonId },
      description: `Lección completada: ${lessonId}`
    })

    // 7) Verificar y otorgar badges automáticamente
    let awardedBadges: Array<{ id: string; slug: string; title: string; xpAwarded: number }> = []
    try {
      // Verificar badges por lección completada (incluye nivel actual para badges de nivel)
      const badgeResult = await checkAndAwardBadges({
        userId: user.id,
        eventType: 'lesson_completed',
        metadata: {
          lessonId,
          streakDays: streakResult.currentStreak,
          newLevel: xpResult.level,
        },
      })
      if (badgeResult.success && badgeResult.awardedBadges.length > 0) {
        awardedBadges = badgeResult.awardedBadges
        console.log('🏅 [API POST /progress] Badges otorgados:', awardedBadges.map(b => b.title))
      }

      // Si la racha aumentó, verificar badges de streak
      if (streakResult.streakIncreased) {
        const streakBadgeResult = await checkAndAwardBadges({
          userId: user.id,
          eventType: 'streak_updated',
          metadata: { streakDays: streakResult.currentStreak, newLevel: xpResult.level },
        })
        if (streakBadgeResult.success && streakBadgeResult.awardedBadges.length > 0) {
          awardedBadges = [...awardedBadges, ...streakBadgeResult.awardedBadges]
          console.log('🏅 [API POST /progress] Badges de streak:', streakBadgeResult.awardedBadges.map(b => b.title))
        }
      }

      // Verificar explícitamente badges de nivel (siempre, porque el nivel pudo haber aumentado)
      const levelBadgeResult = await checkAndAwardBadges({
        userId: user.id,
        eventType: 'level_up',
        metadata: { newLevel: xpResult.level },
      })
      if (levelBadgeResult.success && levelBadgeResult.awardedBadges.length > 0) {
        awardedBadges = [...awardedBadges, ...levelBadgeResult.awardedBadges]
        console.log('🏅 [API POST /progress] Badges de nivel:', levelBadgeResult.awardedBadges.map(b => b.title))
      }
    } catch (badgeError) {
      // No fallar la request principal por error de badges
      console.error('⚠️ [API POST /progress] Error verificando badges:', badgeError)
    }

    return NextResponse.json({
      ok: true,
      success: true,
      message: 'Lección completada',
      ...xpResult,
      awardedBadges,
      streak: streakResult.currentStreak,
      streakIncreased: streakResult.streakIncreased,
    })
  } catch (error) {
    console.error('❌ [API POST /progress] Exception:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


