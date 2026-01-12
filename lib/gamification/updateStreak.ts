import { createAdminClient } from '@/lib/supabase/admin'

interface StreakResult {
  currentStreak: number
  longestStreak: number
  streakIncreased: boolean
  streakReset: boolean
}

/**
 * Actualiza la racha de actividad del usuario.
 *
 * Lógica:
 * - Si last_activity_date fue AYER → incrementa streak
 * - Si last_activity_date fue HOY → no cambia (ya activo hoy)
 * - Si last_activity_date fue hace más de 1 día → reset a 1
 *
 * También actualiza longest_streak si la racha actual lo supera.
 */
export async function updateStreak(userId: string): Promise<StreakResult> {
  const admin = createAdminClient()

  // Obtener stats actuales
  const { data: stats } = await admin
    .from('user_gamification_stats')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const currentStreak = stats?.current_streak || 0
  const longestStreak = stats?.longest_streak || 0
  const lastActivityStr = stats?.last_activity_date

  let newStreak = 1
  let streakIncreased = false
  let streakReset = false

  if (lastActivityStr) {
    const lastActivity = new Date(lastActivityStr)
    lastActivity.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Ya tuvo actividad hoy, mantener streak
      newStreak = currentStreak
      console.log('🔥 [Streak] Mismo día, manteniendo streak:', newStreak)
    } else if (diffDays === 1) {
      // Actividad ayer, incrementar streak
      newStreak = currentStreak + 1
      streakIncreased = true
      console.log('🔥 [Streak] Día consecutivo! Streak:', currentStreak, '→', newStreak)
    } else {
      // Más de un día sin actividad, reset
      newStreak = 1
      streakReset = currentStreak > 1
      console.log('🔥 [Streak] Reset por inactividad. Días sin actividad:', diffDays)
    }
  } else {
    // Primera actividad
    newStreak = 1
    streakIncreased = true
    console.log('🔥 [Streak] Primera actividad registrada!')
  }

  // Actualizar longest_streak si es necesario
  const newLongestStreak = Math.max(newStreak, longestStreak)

  // Actualizar en la BD usando upsert
  const { error } = await admin
    .from('user_gamification_stats')
    .upsert({
      user_id: userId,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error('❌ [Streak] Error actualizando:', error)
  }

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    streakIncreased,
    streakReset,
  }
}

/**
 * Obtiene información de racha sin modificarla
 */
export async function getStreakInfo(userId: string) {
  const admin = createAdminClient()

  const { data: stats } = await admin
    .from('user_gamification_stats')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentStreak = stats?.current_streak || 0
  const longestStreak = stats?.longest_streak || 0
  const lastActivityStr = stats?.last_activity_date

  // Verificar si la racha sigue activa
  let isStreakActive = false
  if (lastActivityStr) {
    const lastActivity = new Date(lastActivityStr)
    lastActivity.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    isStreakActive = diffDays <= 1
  }

  return {
    currentStreak: isStreakActive ? currentStreak : 0,
    longestStreak,
    lastActivityDate: lastActivityStr,
    isStreakActive,
  }
}
