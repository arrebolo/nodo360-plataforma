/**
 * Script para otorgar badges faltantes a usuarios que ya califican
 * Ejecutar con: npx tsx scripts/award-missing-badges.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

// XP rewards by rarity
const XP_BY_RARITY: Record<string, number> = {
  common: 10,
  rare: 25,
  epic: 50,
  legendary: 100,
}

async function awardMissingBadges() {
  console.log('\n🏅 OTORGANDO BADGES FALTANTES\n')
  console.log('='.repeat(60))

  // 1. Obtener todos los usuarios con stats
  const { data: allUsers, error: usersError } = await admin
    .from('user_gamification_stats')
    .select('user_id, total_xp, current_level, current_streak, total_badges')

  if (usersError || !allUsers) {
    console.error('❌ Error obteniendo usuarios:', usersError)
    return
  }

  console.log(`\n📊 Usuarios encontrados: ${allUsers.length}`)

  // 2. Obtener todos los badges activos
  const { data: allBadges, error: badgesError } = await admin
    .from('badges')
    .select('*')
    .eq('is_active', true)

  if (badgesError || !allBadges) {
    console.error('❌ Error obteniendo badges:', badgesError)
    return
  }

  console.log(`🏅 Badges activos: ${allBadges.length}`)

  if (allBadges.length === 0) {
    console.log('\n⚠️  No hay badges activos. Primero activa los badges en la BD.')
    console.log('   Ejecuta: UPDATE badges SET is_active = true;')
    return
  }

  let totalAwarded = 0

  // 3. Para cada usuario
  for (const user of allUsers) {
    const userId = user.user_id

    // Obtener badges que ya tiene
    const { data: userBadges } = await admin
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    const earnedIds = new Set(userBadges?.map(ub => ub.badge_id) || [])

    // Obtener contadores del usuario
    const { count: lessonsCompleted } = await admin
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)

    const { count: coursesCompleted } = await admin
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null)

    const { count: quizzesPassed } = await admin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('passed', true)

    const counters = {
      lessonsCompleted: lessonsCompleted || 0,
      coursesCompleted: coursesCompleted || 0,
      quizzesPassed: quizzesPassed || 0,
      level: user.current_level || 1,
      xp: user.total_xp || 0,
      streak: user.current_streak || 0,
    }

    // Evaluar cada badge
    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue

      const qualifies = evaluateBadge(badge, counters)

      if (qualifies) {
        // Otorgar el badge
        const { error: insertError } = await admin
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            unlocked_at: new Date().toISOString(),
          })

        if (insertError) {
          if (insertError.code === '23505') continue // Duplicado
          console.error(`  ❌ Error insertando badge ${badge.slug}:`, insertError.message)
          continue
        }

        const xpReward = XP_BY_RARITY[badge.rarity || 'common'] || 10

        // Actualizar stats
        await admin
          .from('user_gamification_stats')
          .update({
            total_badges: (user.total_badges || 0) + 1,
            total_xp: (user.total_xp || 0) + xpReward,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        // Registrar evento XP
        await admin.from('xp_events').insert({
          user_id: userId,
          event_type: 'badge_earned',
          xp_earned: xpReward,
          description: `Badge retroactivo: ${badge.title}`,
          created_at: new Date().toISOString(),
        })

        console.log(`  ✅ ${userId.substring(0, 8)}... → ${badge.title} (+${xpReward} XP)`)
        totalAwarded++
        earnedIds.add(badge.id)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Total badges otorgados: ${totalAwarded}\n`)
}

function evaluateBadge(
  badge: { requirement_type: string | null; requirement_value: number | null; slug: string },
  counters: {
    lessonsCompleted: number
    coursesCompleted: number
    quizzesPassed: number
    level: number
    xp: number
    streak: number
  }
): boolean {
  const reqType = badge.requirement_type?.toLowerCase()
  const reqValue = badge.requirement_value || 0

  if (reqType) {
    switch (reqType) {
      case 'lessons_completed':
      case 'lesson_count':
        return counters.lessonsCompleted >= reqValue
      case 'courses_completed':
      case 'course_count':
        return counters.coursesCompleted >= reqValue
      case 'quizzes_passed':
      case 'quiz_count':
        return counters.quizzesPassed >= reqValue
      case 'level':
      case 'level_reached':
        return counters.level >= reqValue
      case 'xp':
      case 'total_xp':
        return counters.xp >= reqValue
      case 'streak':
      case 'streak_days':
        return counters.streak >= reqValue
    }
  }

  // Fallback: evaluar por slug
  const s = badge.slug.toLowerCase()

  // Lecciones
  if (s.includes('first-lesson') || s.includes('primera-leccion')) return counters.lessonsCompleted >= 1
  if (s.includes('10-lesson') || s.includes('10-lecciones')) return counters.lessonsCompleted >= 10
  if (s.includes('50-lesson') || s.includes('50-lecciones')) return counters.lessonsCompleted >= 50
  if (s.includes('100-lesson') || s.includes('100-lecciones')) return counters.lessonsCompleted >= 100

  // Cursos
  if (s.includes('first-course') || s.includes('primer-curso')) return counters.coursesCompleted >= 1
  if (s.includes('3-curso') || s.includes('3-course')) return counters.coursesCompleted >= 3
  if (s.includes('5-curso') || s.includes('5-course')) return counters.coursesCompleted >= 5

  // Niveles
  if (s.includes('level-5') || s.includes('nivel-5')) return counters.level >= 5
  if (s.includes('level-10') || s.includes('nivel-10')) return counters.level >= 10
  if (s.includes('level-25') || s.includes('nivel-25')) return counters.level >= 25
  if (s.includes('level-50') || s.includes('nivel-50')) return counters.level >= 50

  // Rachas
  if (s.includes('streak-7') || s.includes('racha-7')) return counters.streak >= 7
  if (s.includes('streak-30') || s.includes('racha-30')) return counters.streak >= 30

  return false
}

awardMissingBadges().catch(console.error)
