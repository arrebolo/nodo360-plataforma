import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testUnlockLogic() {
  console.log('🔍 [Test] Verificando lógica de desbloqueo de módulos...\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Obtener usuario con inscripción
  const { data: enrollments, error: enrollError } = await supabase
    .from('course_enrollments')
    .select(`
      user_id,
      course_id,
      users!inner(email),
      courses!inner(slug, title)
    `)
    .limit(5)

  if (enrollError || !enrollments || enrollments.length === 0) {
    console.error('❌ No hay inscripciones:', enrollError)
    return
  }

  const enrollment = enrollments[0]
  const userId = enrollment.user_id
  const courseId = enrollment.course_id

  console.log('👤 Usuario:', enrollment.users.email)
  console.log('📚 Curso:', enrollment.courses.title)
  console.log('🔗 Slug:', enrollment.courses.slug)
  console.log('')

  // 2. Obtener módulos del curso
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      order_index,
      requires_quiz,
      lessons:lessons(id, title, slug)
    `)
    .eq('course_id', courseId)
    .order('order_index')

  if (modulesError || !modules || modules.length === 0) {
    console.error('❌ No hay módulos:', modulesError)
    return
  }

  console.log(`📋 Total módulos: ${modules.length}\n`)
  console.log('═══════════════════════════════════════════════════════════')

  // 3. SIMULAR LA LÓGICA CORRECTA
  type ModuleState = {
    id: string
    title: string
    order: number
    completed: number
    total: number
    percentage: number
    isCompleted: boolean
    isUnlocked: boolean
    requiresQuiz: boolean
    quizStatus?: string
  }

  const modulesState: ModuleState[] = []

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i]
    const lessonIds = mod.lessons.map((l: any) => l.id)

    console.log(`\n📊 Procesando Módulo ${i + 1}: ${mod.title}`)
    console.log('─────────────────────────────────────────────────────────')
    console.log(`   Lecciones totales: ${lessonIds.length}`)
    console.log(`   Requiere quiz: ${mod.requires_quiz ? 'Sí' : 'No'}`)

    // Obtener progreso de lecciones
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .eq('is_completed', true)

    if (progressError) {
      console.error(`   ❌ Error obteniendo progreso:`, progressError)
    }

    const completed = progress?.length || 0
    const total = lessonIds.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const isCompleted = percentage === 100

    console.log(`   📈 Progreso: ${completed}/${total} lecciones (${percentage}%)`)
    console.log(`   ${isCompleted ? '✅' : '⭕'} Estado lecciones: ${isCompleted ? 'COMPLETO' : 'INCOMPLETO'}`)

    // Verificar quiz si es requerido
    let quizStatus = 'not_attempted'
    if (mod.requires_quiz) {
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score, passed')
        .eq('user_id', userId)
        .eq('module_id', mod.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (quizAttempts && quizAttempts.length > 0) {
        quizStatus = quizAttempts[0].passed ? 'passed' : 'attempted'
      }
      console.log(`   📝 Quiz: ${quizStatus}`)
    }

    // Calcular desbloqueo (LÓGICA CORRECTA)
    let isUnlocked = false

    if (i === 0) {
      // Módulo 1: Siempre desbloqueado
      isUnlocked = true
      console.log(`   🔓 Desbloqueo: SIEMPRE (primer módulo)`)
    } else {
      // Módulo N: Verificar módulo anterior
      const prevModule = modulesState[i - 1]

      console.log(`   📋 Módulo anterior: ${prevModule.title}`)
      console.log(`   📊 Progreso anterior: ${prevModule.percentage}%`)

      if (prevModule.requiresQuiz) {
        // Anterior requiere quiz → debe estar completo (lecciones + quiz)
        const prevQuizPassed = prevModule.quizStatus === 'passed'
        isUnlocked = prevModule.isCompleted && prevQuizPassed

        console.log(`   📝 Anterior requiere quiz: ${prevModule.quizStatus}`)
        console.log(`   ${isUnlocked ? '🔓' : '🔒'} Desbloqueo: ${isUnlocked ? 'SÍ' : 'NO'} (anterior ${prevModule.isCompleted ? 'completo' : 'incompleto'}, quiz ${prevQuizPassed ? 'aprobado' : 'no aprobado'})`)
      } else {
        // Anterior NO requiere quiz → solo verificar lecciones
        isUnlocked = prevModule.isCompleted

        console.log(`   ℹ️ Anterior NO requiere quiz`)
        console.log(`   ${isUnlocked ? '🔓' : '🔒'} Desbloqueo: ${isUnlocked ? 'SÍ' : 'NO'} (anterior ${prevModule.isCompleted ? 'completo' : 'incompleto al ' + prevModule.percentage + '%'})`)
      }
    }

    modulesState.push({
      id: mod.id,
      title: mod.title,
      order: i + 1,
      completed,
      total,
      percentage,
      isCompleted,
      isUnlocked,
      requiresQuiz: mod.requires_quiz,
      quizStatus
    })
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('📊 RESUMEN FINAL')
  console.log('═══════════════════════════════════════════════════════════\n')

  modulesState.forEach(m => {
    const lockIcon = m.isUnlocked ? '🔓' : '🔒'
    const statusIcon = m.isCompleted ? '✅' : '📊'
    const quizInfo = m.requiresQuiz ? ` | Quiz: ${m.quizStatus}` : ''
    console.log(`${lockIcon} ${statusIcon} Módulo ${m.order}: ${m.title} (${m.percentage}%${quizInfo})`)
  })

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('🎯 VERIFICACIÓN DE LÓGICA')
  console.log('═══════════════════════════════════════════════════════════\n')

  let allCorrect = true

  // Verificar que módulo 1 esté desbloqueado
  if (!modulesState[0].isUnlocked) {
    console.log('❌ ERROR: Módulo 1 NO está desbloqueado (debería estarlo siempre)')
    allCorrect = false
  } else {
    console.log('✅ Módulo 1 desbloqueado correctamente')
  }

  // Verificar lógica de módulos siguientes
  for (let i = 1; i < modulesState.length; i++) {
    const current = modulesState[i]
    const previous = modulesState[i - 1]

    const shouldBeUnlocked = previous.requiresQuiz
      ? (previous.isCompleted && previous.quizStatus === 'passed')
      : previous.isCompleted

    if (current.isUnlocked !== shouldBeUnlocked) {
      console.log(`❌ ERROR: Módulo ${i + 1}:`)
      console.log(`   Estado actual: ${current.isUnlocked ? 'Desbloqueado' : 'Bloqueado'}`)
      console.log(`   Debería ser: ${shouldBeUnlocked ? 'Desbloqueado' : 'Bloqueado'}`)
      console.log(`   Razón: Módulo anterior ${previous.isCompleted ? 'completo' : 'incompleto'}${previous.requiresQuiz ? `, quiz ${previous.quizStatus}` : ''}`)
      allCorrect = false
    } else {
      console.log(`✅ Módulo ${i + 1} tiene estado correcto: ${current.isUnlocked ? 'Desbloqueado' : 'Bloqueado'}`)
    }
  }

  console.log('')
  if (allCorrect) {
    console.log('🎉 ✅ LÓGICA CORRECTA - Todos los módulos tienen el estado esperado')
  } else {
    console.log('⚠️ ❌ LÓGICA INCORRECTA - Hay módulos con estado incorrecto')
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('💡 PRÓXIMOS PASOS')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log('1. Reiniciar servidor: npm run dev')
  console.log('2. Ir a página del curso en navegador')
  console.log('3. Verificar que módulos se desbloquean según la lógica')
  console.log('4. Revisar console del navegador para ver logs detallados')
  console.log('')
}

testUnlockLogic()


