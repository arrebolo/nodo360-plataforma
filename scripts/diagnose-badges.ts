/**
 * Script de diagnóstico para el sistema de badges
 * Ejecutar con: npx tsx scripts/diagnose-badges.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

async function diagnose() {
  console.log('\n🔍 DIAGNÓSTICO DEL SISTEMA DE BADGES\n')
  console.log('='.repeat(60))

  // 1. Verificar badges en la BD
  console.log('\n📋 1. BADGES EN LA BASE DE DATOS')
  console.log('-'.repeat(40))

  const { data: allBadges, error: badgesError } = await admin
    .from('badges')
    .select('id, title, slug, is_active, requirement_type, requirement_value, rarity')
    .order('title')

  if (badgesError) {
    console.error('❌ Error obteniendo badges:', badgesError.message)
    return
  }

  console.log(`Total de badges: ${allBadges?.length || 0}`)

  const activeBadges = allBadges?.filter(b => b.is_active) || []
  const withRequirements = allBadges?.filter(b => b.requirement_type) || []

  console.log(`Badges activos (is_active=true): ${activeBadges.length}`)
  console.log(`Badges con requirement_type: ${withRequirements.length}`)

  if (allBadges && allBadges.length > 0) {
    console.log('\nDetalle de badges:')
    allBadges.forEach(b => {
      const status = b.is_active ? '✅' : '❌'
      const req = b.requirement_type
        ? `${b.requirement_type}=${b.requirement_value}`
        : 'sin requirement'
      console.log(`  ${status} ${b.title} (${b.slug}) - ${req} [${b.rarity || 'sin rareza'}]`)
    })
  }

  // 2. Verificar usuario de prueba
  console.log('\n\n📊 2. STATS DEL USUARIO DE PRUEBA')
  console.log('-'.repeat(40))

  // Obtener primer admin o usuario con más XP
  const { data: topUser } = await admin
    .from('user_gamification_stats')
    .select('user_id, total_xp, current_level, current_streak, total_badges')
    .order('total_xp', { ascending: false })
    .limit(1)
    .single()

  if (!topUser) {
    console.log('❌ No hay usuarios con stats de gamificación')
  } else {
    console.log(`Usuario con más XP: ${topUser.user_id.substring(0, 8)}...`)
    console.log(`  Total XP: ${topUser.total_xp}`)
    console.log(`  Nivel: ${topUser.current_level}`)
    console.log(`  Racha: ${topUser.current_streak}`)
    console.log(`  Badges totales: ${topUser.total_badges}`)

    // Verificar badges otorgados a este usuario
    const { data: userBadges } = await admin
      .from('user_badges')
      .select('badge_id, unlocked_at')
      .eq('user_id', topUser.user_id)

    console.log(`\n  Badges obtenidos: ${userBadges?.length || 0}`)

    // Verificar lecciones completadas
    const { count: lessonsCompleted } = await admin
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', topUser.user_id)
      .eq('is_completed', true)

    console.log(`  Lecciones completadas: ${lessonsCompleted || 0}`)

    // Verificar cursos completados
    const { count: coursesCompleted } = await admin
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', topUser.user_id)
      .not('completed_at', 'is', null)

    console.log(`  Cursos completados: ${coursesCompleted || 0}`)

    // 3. Evaluar qué badges DEBERÍA tener
    console.log('\n\n🎯 3. BADGES QUE DEBERÍA TENER')
    console.log('-'.repeat(40))

    const earnedIds = new Set(userBadges?.map(ub => ub.badge_id) || [])

    for (const badge of activeBadges) {
      const hasIt = earnedIds.has(badge.id)
      let shouldHaveIt = false
      let reason = ''

      // Evaluar por requirement_type
      if (badge.requirement_type) {
        const reqType = badge.requirement_type.toLowerCase()
        const reqValue = badge.requirement_value || 0

        switch (reqType) {
          case 'lessons_completed':
          case 'lesson_count':
            shouldHaveIt = (lessonsCompleted || 0) >= reqValue
            reason = `lecciones: ${lessonsCompleted} >= ${reqValue}`
            break
          case 'courses_completed':
          case 'course_count':
            shouldHaveIt = (coursesCompleted || 0) >= reqValue
            reason = `cursos: ${coursesCompleted} >= ${reqValue}`
            break
          case 'level':
          case 'level_reached':
            shouldHaveIt = topUser.current_level >= reqValue
            reason = `nivel: ${topUser.current_level} >= ${reqValue}`
            break
          case 'xp':
          case 'total_xp':
            shouldHaveIt = topUser.total_xp >= reqValue
            reason = `xp: ${topUser.total_xp} >= ${reqValue}`
            break
          case 'streak':
          case 'streak_days':
            shouldHaveIt = (topUser.current_streak || 0) >= reqValue
            reason = `racha: ${topUser.current_streak} >= ${reqValue}`
            break
        }
      } else {
        // Evaluar por slug
        const s = badge.slug.toLowerCase()
        if (s.includes('first-lesson') || s.includes('primera-leccion')) {
          shouldHaveIt = (lessonsCompleted || 0) >= 1
          reason = `slug match, lecciones: ${lessonsCompleted} >= 1`
        } else if (s.includes('level-5') || s.includes('nivel-5')) {
          shouldHaveIt = topUser.current_level >= 5
          reason = `slug match, nivel: ${topUser.current_level} >= 5`
        } else if (s.includes('level-10') || s.includes('nivel-10')) {
          shouldHaveIt = topUser.current_level >= 10
          reason = `slug match, nivel: ${topUser.current_level} >= 10`
        } else {
          reason = 'slug no reconocido'
        }
      }

      if (shouldHaveIt && !hasIt) {
        console.log(`  ⚠️  FALTA: ${badge.title} (${reason})`)
      } else if (shouldHaveIt && hasIt) {
        console.log(`  ✅ TIENE: ${badge.title}`)
      }
    }
  }

  // 4. Recomendaciones
  console.log('\n\n💡 4. RECOMENDACIONES')
  console.log('-'.repeat(40))

  if (activeBadges.length === 0) {
    console.log('⚠️  No hay badges activos. Ejecutar en Supabase:')
    console.log('   UPDATE badges SET is_active = true;')
  }

  if (withRequirements.length === 0) {
    console.log('⚠️  No hay badges con requirement_type. Actualizar badges con:')
    console.log(`   UPDATE badges SET requirement_type = 'lessons_completed', requirement_value = 1 WHERE slug LIKE '%first-lesson%';`)
    console.log(`   UPDATE badges SET requirement_type = 'level_reached', requirement_value = 5 WHERE slug LIKE '%level-5%';`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('FIN DEL DIAGNÓSTICO\n')
}

diagnose().catch(console.error)
