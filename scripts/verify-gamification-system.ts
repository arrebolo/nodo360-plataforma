/**
 * Script: Verificar Sistema de Gamificación
 *
 * Verifica que las tablas y triggers de gamificación estén aplicados
 *
 * USO:
 * npx tsx scripts/verify-gamification-system.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyGamificationSystem() {
  console.log('🔍 Verificando Sistema de Gamificación...\n')

  try {
    // 1. Verificar tablas
    console.log('1️⃣ Verificando tablas...')
    const tables = [
      'user_gamification_stats',
      'xp_events',
      'badges',
      'user_badges'
    ]

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.error(`❌ Tabla ${table}: ERROR - ${error.message}`)
      } else {
        console.log(`✅ Tabla ${table}: Existe y es accesible`)
      }
    }

    // 2. Verificar badges iniciales
    console.log('\n2️⃣ Verificando badges...')
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .order('order_index')

    if (badgesError) {
      console.error('❌ Error obteniendo badges:', badgesError.message)
    } else if (!badges || badges.length === 0) {
      console.error('❌ No hay badges en la base de datos')
      console.error('   Acción: Ejecutar migration 004_gamification_system.sql')
    } else {
      console.log(`✅ Badges encontrados: ${badges.length}`)
      console.log('\n   Badges disponibles:')
      badges.slice(0, 5).forEach(b => {
        console.log(`   ${b.icon} ${b.title} - ${b.description}`)
      })
      if (badges.length > 5) {
        console.log(`   ... y ${badges.length - 5} más`)
      }
    }

    // 3. Verificar usuario de prueba
    console.log('\n3️⃣ Verificando usuario de prueba...')
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)

    if (!users || users.length === 0) {
      console.error('❌ No hay usuarios en la base de datos')
      return
    }

    const testUser = users[0]
    console.log(`✅ Usuario de prueba: ${testUser.email}`)

    // 4. Verificar stats del usuario
    console.log('\n4️⃣ Verificando stats del usuario...')
    const { data: stats, error: statsError } = await supabase
      .from('user_gamification_stats')
      .select('*')
      .eq('user_id', testUser.id)
      .single()

    if (statsError) {
      console.error('❌ Usuario no tiene stats de gamificación')
      console.error('   Error:', statsError.message)
      console.error('   Acción: El trigger create_user_stats debería haberlas creado')
    } else {
      console.log('✅ Stats del usuario:')
      console.log(`   Total XP: ${stats.total_xp}`)
      console.log(`   Nivel: ${stats.current_level}`)
      console.log(`   XP para siguiente nivel: ${stats.xp_to_next_level}`)
      console.log(`   Total badges: ${stats.total_badges}`)
      console.log(`   Racha actual: ${stats.current_streak} días`)
      console.log(`   Racha más larga: ${stats.longest_streak} días`)
    }

    // 5. Verificar eventos de XP
    console.log('\n5️⃣ Verificando eventos de XP...')
    const { data: xpEvents, error: xpError } = await supabase
      .from('xp_events')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (xpError) {
      console.error('❌ Error obteniendo eventos de XP:', xpError.message)
    } else if (!xpEvents || xpEvents.length === 0) {
      console.log('⚠️  Usuario no tiene eventos de XP registrados')
      console.log('   Esto es normal si no ha completado lecciones')
    } else {
      console.log(`✅ Eventos de XP: ${xpEvents.length} (mostrando últimos 5)`)
      xpEvents.forEach(event => {
        const date = new Date(event.created_at).toLocaleString('es-ES')
        console.log(`   ${date} - ${event.event_type}: +${event.xp_earned} XP`)
      })
    }

    // 6. Verificar badges del usuario
    console.log('\n6️⃣ Verificando badges desbloqueados...')
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (
          title,
          icon,
          rarity
        )
      `)
      .eq('user_id', testUser.id)

    if (!userBadges || userBadges.length === 0) {
      console.log('⚠️  Usuario no tiene badges desbloqueados')
      console.log('   Esto es normal si no ha cumplido requisitos')
    } else {
      console.log(`✅ Badges desbloqueados: ${userBadges.length}`)
      userBadges.forEach((ub: any) => {
        const date = new Date(ub.unlocked_at).toLocaleDateString('es-ES')
        console.log(`   ${ub.badges.icon} ${ub.badges.title} (${ub.badges.rarity}) - ${date}`)
      })
    }

    // 7. DIAGNÓSTICO FINAL
    console.log('\n' + '='.repeat(60))
    console.log('📊 DIAGNÓSTICO FINAL')
    console.log('='.repeat(60))

    const hasAllTables = tables.every(async table => {
      const { error } = await supabase.from(table).select('*').limit(1)
      return !error
    })

    if (!badges || badges.length === 0) {
      console.log('\n❌ PROBLEMA: No hay badges en la base de datos')
      console.log('   SOLUCIÓN:')
      console.log('   1. Ir a Supabase Dashboard → SQL Editor')
      console.log('   2. Ejecutar: supabase/migrations/004_gamification_system.sql')
      console.log('   3. Volver a ejecutar este script\n')
    } else if (!stats) {
      console.log('\n❌ PROBLEMA: Usuario no tiene stats de gamificación')
      console.log('   SOLUCIÓN:')
      console.log('   El trigger debería crear stats automáticamente')
      console.log('   Verificar que el trigger create_user_stats existe')
    } else if (stats.total_xp === 0 && (!xpEvents || xpEvents.length === 0)) {
      console.log('\n⚠️  ADVERTENCIA: Sistema configurado pero usuario sin XP')
      console.log('   RAZÓN: Usuario no ha completado ninguna lección')
      console.log('   PRUEBA:')
      console.log('   1. Completar una lección en la app')
      console.log('   2. Verificar que aparece evento de XP')
      console.log('   3. Si no aparece, el trigger award_xp_on_lesson_complete no funciona\n')
    } else {
      console.log('\n✅ SISTEMA DE GAMIFICACIÓN FUNCIONANDO CORRECTAMENTE')
      console.log(`   - ${stats.total_xp} XP ganado`)
      console.log(`   - ${xpEvents?.length || 0} eventos registrados`)
      console.log(`   - ${userBadges?.length || 0} badges desbloqueados\n`)
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error))
  }
}

verifyGamificationSystem()
