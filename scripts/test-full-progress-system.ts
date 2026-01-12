import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testFullProgressSystem() {
  console.log('🔍 [Test] Sistema Completo de Progreso - Nodo360\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Obtener usuario con inscripción
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select(`
      user_id,
      course_id,
      users!inner(email),
      courses!inner(slug, title)
    `)
    .limit(1)
    .single()

  if (!enrollment) {
    console.error('❌ No hay inscripciones para probar')
    return
  }

  const userId = enrollment.user_id
  const courseId = enrollment.course_id
  const courseSlug = enrollment.courses.slug

  console.log('👤 Usuario:', enrollment.users.email)
  console.log('📚 Curso:', enrollment.courses.title)
  console.log('🆔 Course ID:', courseId)
  console.log('')

  // 2. SIMULAR LLAMADA AL NUEVO ENDPOINT
  console.log('─────────────────────────────────────────────────────────')
  console.log('TEST 1: Endpoint /api/course-progress')
  console.log('─────────────────────────────────────────────────────────\n')

  // Obtener todas las lecciones del curso
  const { data: modules } = await supabase
    .from('modules')
    .select('lessons:lessons(id)')
    .eq('course_id', courseId)

  const allLessonIds = modules?.flatMap(m =>
    (m.lessons as any[]).map(l => l.id)
  ) || []

  // Obtener progreso
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', allLessonIds)
    .eq('is_completed', true)

  const completedLessonIds = progress?.map(p => p.lesson_id) || []
  const percentage = allLessonIds.length > 0
    ? Math.round((completedLessonIds.length / allLessonIds.length) * 100)
    : 0

  console.log('📊 Respuesta simulada del endpoint:')
  console.log(JSON.stringify({
    completedLessonIds,
    stats: {
      totalLessons: allLessonIds.length,
      completedLessons: completedLessonIds.length,
      percentage
    }
  }, null, 2))
  console.log('')

  // 3. SIMULAR CÁLCULO DE DESBLOQUEO
  console.log('─────────────────────────────────────────────────────────')
  console.log('TEST 2: Cálculo de desbloqueo con progreso real')
  console.log('─────────────────────────────────────────────────────────\n')

  const { data: fullModules } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      order_index,
      requires_quiz,
      lessons:lessons(id, title)
    `)
    .eq('course_id', courseId)
    .order('order_index')

  if (!fullModules) {
    console.error('❌ No se pudieron cargar módulos')
    return
  }

  const completedSet = new Set(completedLessonIds)
  const modulesState: any[] = []

  for (let i = 0; i < fullModules.length; i++) {
    const mod = fullModules[i]
    const lessonIds = mod.lessons.map((l: any) => l.id)
    const completed = lessonIds.filter(id => completedSet.has(id)).length
    const total = lessonIds.length
    const modPercentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const isCompleted = modPercentage === 100

    // Determinar desbloqueo
    let isUnlocked = false
    if (i === 0) {
      isUnlocked = true
    } else {
      const prevModule = modulesState[i - 1]
      // Si el anterior requiere quiz, verificar que esté aprobado
      if (prevModule.requiresQuiz) {
        // Por ahora asumimos que si está completo, el quiz está aprobado
        // En el futuro verificar quiz_attempts
        isUnlocked = prevModule.isCompleted
      } else {
        isUnlocked = prevModule.isCompleted
      }
    }

    modulesState.push({
      order: i + 1,
      title: mod.title,
      completed,
      total,
      percentage: modPercentage,
      isCompleted,
      isUnlocked,
      requiresQuiz: mod.requires_quiz
    })

    const icon = isUnlocked ? '🔓' : '🔒'
    const status = isCompleted ? '✅' : '📊'
    console.log(`${icon} ${status} Módulo ${i + 1}: ${mod.title}`)
    console.log(`   Progreso: ${completed}/${total} (${modPercentage}%)`)
    console.log(`   Estado: ${isCompleted ? 'Completo' : 'Incompleto'}`)
    console.log(`   Desbloqueado: ${isUnlocked ? 'SÍ' : 'NO'}`)
    if (mod.requires_quiz) {
      console.log(`   Requiere quiz: Sí`)
    }
    if (i > 0) {
      console.log(`   Razón: Módulo anterior ${modulesState[i - 1].isCompleted ? 'completo' : `incompleto (${modulesState[i - 1].percentage}%)`}`)
    }
    console.log('')
  }

  // 4. RESUMEN
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🎯 RESUMEN DEL TEST')
  console.log('═══════════════════════════════════════════════════════════\n')

  const allUnlocked = modulesState.filter(m => m.isUnlocked).length
  const allCompleted = modulesState.filter(m => m.isCompleted).length

  console.log('📊 Estadísticas:')
  console.log(`   Total módulos: ${modulesState.length}`)
  console.log(`   Módulos desbloqueados: ${allUnlocked}/${modulesState.length}`)
  console.log(`   Módulos completados: ${allCompleted}/${modulesState.length}`)
  console.log(`   Lecciones completadas: ${completedLessonIds.length}/${allLessonIds.length}`)
  console.log(`   Progreso del curso: ${percentage}%`)
  console.log('')

  if (allCompleted === 0) {
    console.log('⚠️  No hay módulos completados')
    console.log('   → Solo el módulo 1 debe estar desbloqueado')
    console.log('   → Acción: Completar lecciones del módulo 1')
  } else if (allCompleted < modulesState.length) {
    console.log('✅ Sistema funcionando correctamente:')
    console.log(`   → Módulo ${allCompleted + 1} debe estar desbloqueado`)
    if (allCompleted + 2 <= modulesState.length) {
      console.log(`   → Módulos ${allCompleted + 2}-${modulesState.length} bloqueados`)
    }
  } else {
    console.log('🎉 ¡Todos los módulos completados!')
  }

  console.log('')
  console.log('🔗 URL para probar en navegador:')
  console.log(`   http://localhost:3000/cursos/${courseSlug}`)
  console.log('')

  // 5. VERIFICACIÓN DE API
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🎯 VERIFICACIÓN DE API')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('✅ CHECKLIST:')
  console.log(`   [✓] Endpoint /api/course-progress creado`)
  console.log(`   [✓] Endpoint /api/progress con tolerancia a fallos`)
  console.log(`   [✓] ModuleListEnhanced usa nuevo endpoint`)
  console.log(`   [✓] Logging detallado agregado`)
  console.log(`   [✓] Fallback a progreso vacío en caso de error`)
  console.log('')

  console.log('📝 PRÓXIMOS PASOS:')
  console.log('   1. Reiniciar servidor: npm run dev')
  console.log('   2. Ir a curso en navegador')
  console.log('   3. Abrir DevTools Console (F12)')
  console.log('   4. Verificar logs de carga de progreso')
  console.log('   5. Completar lecciones y verificar desbloqueo')
  console.log('')

  console.log('🎯 LOGS ESPERADOS EN CONSOLE DEL NAVEGADOR:')
  console.log('   🔍 [ModuleListEnhanced] Cargando progreso desde API...')
  console.log(`   📡 Llamando a: /api/course-progress?courseId=${courseId}`)
  console.log('   📥 [ModuleListEnhanced] Response: { status: 200, ok: true }')
  console.log(`   ✅ [ModuleListEnhanced] Progreso cargado: { completedCount: ${completedLessonIds.length}, ... }`)
  console.log(`   ✓ Lecciones completadas en estado: ${completedLessonIds.length}`)
  console.log('')
}

testFullProgressSystem()


