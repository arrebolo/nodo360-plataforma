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

async function initializeGamificationForExistingUsers() {
  console.log('🎮 Inicializando Gamificación para Usuarios Existentes...\n')

  try {
    // 1. Obtener todos los usuarios
    console.log('1️⃣ Obteniendo usuarios...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message)
      return
    }

    console.log(`✅ Usuarios encontrados: ${users.length}\n`)

    // 2. Para cada usuario, inicializar stats
    for (const user of users) {
      console.log(`\n👤 Procesando usuario: ${user.email || user.full_name || user.id}`)

      // 2.1 Verificar si ya tiene stats
      const { data: existingStats } = await supabase
        .from('user_gamification_stats')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingStats) {
        console.log('   ⏭️  Ya tiene stats, saltando...')
        continue
      }

      // 2.2 Crear stats iniciales
      console.log('   📊 Creando stats de gamificación...')
      const { error: statsError } = await supabase
        .from('user_gamification_stats')
        .insert({
          user_id: user.id,
          total_xp: 0,
          current_level: 1,
          xp_to_next_level: 100,
          total_badges: 0,
          current_streak: 0,
          longest_streak: 0
        })

      if (statsError) {
        console.error('   ❌ Error creando stats:', statsError.message)
        continue
      }

      console.log('   ✅ Stats creadas')

      // 2.3 Obtener lecciones completadas
      const { data: completedLessons, error: lessonsError } = await supabase
        .from('user_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .order('completed_at', { ascending: true })

      if (lessonsError) {
        console.error('   ❌ Error obteniendo lecciones:', lessonsError.message)
        continue
      }

      if (!completedLessons || completedLessons.length === 0) {
        console.log('   ℹ️  No tiene lecciones completadas')
        continue
      }

      console.log(`   📚 Lecciones completadas: ${completedLessons.length}`)

      // 2.4 Otorgar XP retroactivo por cada lección
      console.log('   🎯 Otorgando XP retroactivo...')
      let totalXpGranted = 0

      for (const lesson of completedLessons) {
        const { error: xpError } = await supabase
          .from('xp_events')
          .insert({
            user_id: user.id,
            event_type: 'lesson_completed',
            xp_earned: 10,
            related_id: lesson.lesson_id,
            description: 'Lección completada (retroactivo)',
            created_at: lesson.completed_at || new Date().toISOString()
          })

        if (xpError) {
          console.error(`   ⚠️  Error otorgando XP:`, xpError.message)
        } else {
          totalXpGranted += 10
        }
      }

      console.log(`   💎 XP total otorgado: ${totalXpGranted}`)

      // 2.5 Esperar a que los triggers actualicen las stats
      await new Promise(resolve => setTimeout(resolve, 500))

      // 2.6 Verificar stats actualizadas
      const { data: updatedStats } = await supabase
        .from('user_gamification_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (updatedStats) {
        console.log(`   📊 Stats actualizadas:`)
        console.log(`      Total XP: ${updatedStats.total_xp}`)
        console.log(`      Nivel: ${updatedStats.current_level}`)
        console.log(`      Badges: ${updatedStats.total_badges}`)
      }

      // 2.7 Verificar badges desbloqueados
      const { data: badges } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (
            title,
            icon
          )
        `)
        .eq('user_id', user.id)

      if (badges && badges.length > 0) {
        console.log(`   🏆 Badges desbloqueados: ${badges.length}`)
        badges.forEach((b: any) => {
          console.log(`      ${b.badges.icon} ${b.badges.title}`)
        })
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ PROCESO COMPLETADO')
    console.log('\n📊 Resumen:')
    console.log(`   Usuarios procesados: ${users.length}`)
    console.log('\n🎉 ¡Gamificación activa!\n')

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error))
  }
}

// Ejecutar
initializeGamificationForExistingUsers()
  .then(() => {
    console.log('✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })