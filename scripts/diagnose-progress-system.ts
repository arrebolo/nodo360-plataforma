import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function diagnoseProgressSystem() {
  console.log('🔍 [Diagnóstico] Sistema de Progreso de Lecciones\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // 1. VERIFICAR SI EXISTE LA TABLA user_progress
    console.log('1️⃣  VERIFICAR TABLA: user_progress')
    console.log('─────────────────────────────────────────────────────────')

    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1)

    if (progressError) {
      if (progressError.message.includes('does not exist') || progressError.code === 'PGRST204') {
        console.log('❌ TABLA NO EXISTE: user_progress')
        console.log('   → La tabla user_progress no está creada en la BD')
        console.log('')
        console.log('═══════════════════════════════════════════════════════════')
        console.log('🎯 RESULTADO: A - TABLA VACÍA (necesita migración)')
        console.log('═══════════════════════════════════════════════════════════\n')
        console.log('💡 ACCIÓN REQUERIDA:')
        console.log('   1. Crear migración para tabla user_progress')
        console.log('   2. Implementar API de progreso')
        console.log('   3. Implementar botón de completar lección')
        console.log('   4. Arreglar cálculo de desbloqueo de módulos\n')
        return 'A'
      }

      console.error('❌ Error al consultar user_progress:', progressError.message)
      console.log('')
      return 'ERROR'
    }

    console.log('✅ Tabla user_progress existe')
    console.log('')

    // 2. VERIFICAR DATOS EN LA TABLA
    console.log('2️⃣  VERIFICAR DATOS EN user_progress')
    console.log('─────────────────────────────────────────────────────────')

    const { data: allProgress, error: countError } = await supabase
      .from('user_progress')
      .select('*')

    if (countError) {
      console.error('❌ Error al contar registros:', countError.message)
      console.log('')
      return 'ERROR'
    }

    const count = allProgress?.length || 0
    console.log(`📊 Total registros en user_progress: ${count}`)

    if (count === 0) {
      console.log('⚠️  Tabla existe pero está vacía')
      console.log('')
      console.log('═══════════════════════════════════════════════════════════')
      console.log('🎯 RESULTADO: B - TABLA EXISTE PERO SIN DATOS')
      console.log('═══════════════════════════════════════════════════════════\n')
      console.log('💡 ESTADO:')
      console.log('   ✅ Migración aplicada correctamente')
      console.log('   ⚠️  Ningún usuario ha completado lecciones aún')
      console.log('')
      console.log('💡 VERIFICAR:')
      console.log('   → API de progreso esté implementada')
      console.log('   → Botón de completar lección esté visible')
      console.log('   → Probar completar una lección manualmente\n')
      return 'B'
    }

    // 3. MOSTRAR PROGRESO EXISTENTE
    console.log(`✅ Encontrados ${count} registros de progreso`)
    console.log('')

    console.log('3️⃣  REGISTROS DE PROGRESO')
    console.log('─────────────────────────────────────────────────────────')

    const { data: progressWithDetails, error: detailsError } = await supabase
      .from('user_progress')
      .select(`
        id,
        user_id,
        lesson_id,
        is_completed,
        completed_at,
        watch_time_seconds,
        users!inner(email),
        lessons!inner(title, module_id)
      `)
      .order('completed_at', { ascending: false })
      .limit(10)

    if (detailsError) {
      console.error('❌ Error al obtener detalles:', detailsError.message)
    } else if (progressWithDetails && progressWithDetails.length > 0) {
      console.log('📚 Últimas 10 lecciones completadas:\n')
      progressWithDetails.forEach((p: any, index: number) => {
        console.log(`${index + 1}. ${p.lessons.title}`)
        console.log(`   Usuario: ${p.users.email}`)
        console.log(`   Completado: ${p.is_completed ? '✅' : '⏳'}`)
        console.log(`   Fecha: ${p.completed_at ? new Date(p.completed_at).toLocaleString() : 'N/A'}`)
        console.log(`   Watch time: ${p.watch_time_seconds || 0}s`)
        console.log('')
      })
    }

    // 4. VERIFICAR API DE PROGRESO
    console.log('4️⃣  VERIFICAR API DE PROGRESO')
    console.log('─────────────────────────────────────────────────────────')

    // Buscar archivo de API
    const fs = require('fs')
    const path = require('path')
    const apiPath = path.join(process.cwd(), 'app', 'api', 'progress', 'route.ts')

    if (fs.existsSync(apiPath)) {
      console.log('✅ API de progreso existe: app/api/progress/route.ts')
    } else {
      console.log('❌ API de progreso NO existe: app/api/progress/route.ts')
      console.log('   → Implementar POST y GET endpoints')
    }
    console.log('')

    // 5. VERIFICAR BOTÓN DE COMPLETAR
    console.log('5️⃣  VERIFICAR COMPONENTE CompleteLessonButton')
    console.log('─────────────────────────────────────────────────────────')

    const buttonPath = path.join(process.cwd(), 'components', 'lesson', 'CompleteLessonButton.tsx')

    if (fs.existsSync(buttonPath)) {
      console.log('✅ Componente existe: components/lesson/CompleteLessonButton.tsx')
    } else {
      console.log('❌ Componente NO existe: components/lesson/CompleteLessonButton.tsx')
      console.log('   → Crear componente de UI para marcar lecciones')
    }
    console.log('')

    // 6. VERIFICAR ESTADÍSTICAS POR USUARIO
    console.log('6️⃣  ESTADÍSTICAS POR USUARIO')
    console.log('─────────────────────────────────────────────────────────')

    const { data: userStats, error: statsError } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        is_completed,
        users!inner(email)
      `)

    if (!statsError && userStats) {
      const statsMap = new Map<string, { email: string; completed: number; total: number }>()

      userStats.forEach((p: any) => {
        const key = p.user_id
        if (!statsMap.has(key)) {
          statsMap.set(key, { email: p.users.email, completed: 0, total: 0 })
        }
        const stat = statsMap.get(key)!
        stat.total++
        if (p.is_completed) {
          stat.completed++
        }
      })

      console.log('📊 Progreso por usuario:\n')
      statsMap.forEach((stat, userId) => {
        const percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
        console.log(`${stat.email}:`)
        console.log(`   Lecciones completadas: ${stat.completed}/${stat.total} (${percentage}%)`)
        console.log('')
      })
    }

    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎯 RESULTADO: C - SISTEMA FUNCIONANDO')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log('✅ ESTADO:')
    console.log(`   → Tabla user_progress existe con ${count} registros`)
    console.log('   → Usuarios están completando lecciones')
    console.log('')
    console.log('💡 PRÓXIMOS PASOS:')
    console.log('   → Verificar que cálculo de desbloqueo funcione')
    console.log('   → Probar completar módulo completo')
    console.log('   → Verificar actualización de course_enrollments.progress_percentage\n')

    return 'C'

  } catch (error) {
    console.error('❌ [Diagnóstico] Error general:', error)
    return 'ERROR'
  }
}

diagnoseProgressSystem()


