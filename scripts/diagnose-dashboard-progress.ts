import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DE PROGRESO - Dashboard\n')
  console.log('=' .repeat(60))

  // 1. Obtener TODOS los cursos
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title, total_modules, total_lessons')
    .order('created_at')

  if (!courses || courses.length === 0) {
    console.error('❌ No hay cursos en la base de datos')
    return
  }

  console.log(`\n📚 Cursos encontrados: ${courses.length}\n`)

  // Diagnosticar cada curso
  for (const course of courses) {
    await diagnoseCourse(course)
    console.log('\n' + '-'.repeat(60) + '\n')
  }

  console.log('=' .repeat(60))
  console.log('✅ DIAGNÓSTICO COMPLETADO')
}

async function diagnoseCourse(course: any) {
  console.log(`\n📚 Curso: ${course.title}`)
  console.log(`   Slug: ${course.slug}`)
  console.log(`   ID: ${course.id}`)
  console.log(`\n📊 Valores en tabla 'courses':`)
  console.log(`   total_modules: ${course.total_modules}`)
  console.log(`   total_lessons: ${course.total_lessons}`)

  // 2. Contar módulos REALES
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', course.id)
    .order('order_index')

  if (modulesError) {
    console.error('❌ Error al obtener módulos:', modulesError)
    return
  }

  console.log(`\n🔍 Módulos REALES en base de datos:`)
  console.log(`   Total: ${modules?.length || 0}`)

  if (modules) {
    modules.forEach((mod, idx) => {
      console.log(`   ${idx + 1}. ${mod.title} (order_index: ${mod.order_index})`)
    })
  }

  // 3. Contar lecciones REALES
  const moduleIds = modules?.map(m => m.id) || []
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, module_id')
    .in('module_id', moduleIds)
    .order('module_id, order_index')

  console.log(`\n📖 Lecciones REALES en base de datos:`)
  console.log(`   Total: ${lessons?.length || 0}`)

  if (modules && lessons) {
    modules.forEach(mod => {
      const modLessons = lessons.filter(l => l.module_id === mod.id)
      console.log(`   ${mod.title}: ${modLessons.length} lecciones`)
      modLessons.forEach((lesson, idx) => {
        console.log(`      ${idx + 1}. ${lesson.title}`)
      })
    })
  }

  // 4. Obtener primer usuario inscrito
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('user_id, users:user_id(email)')
    .eq('course_id', course.id)
    .limit(1)
    .single()

  if (!enrollment) {
    console.log('\n⚠️  No hay usuarios inscritos en este curso')
    console.log('\n✅ DIAGNÓSTICO COMPLETADO - No se puede verificar progreso sin usuarios inscritos')
    return
  }

  const userId = enrollment.user_id
  console.log(`\n👤 Usuario de prueba: ${(enrollment.users as any)?.email || 'N/A'}`)

  // 5. Obtener progreso del usuario
  const lessonIds = lessons?.map(l => l.id) || []
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
    .eq('is_completed', true)

  console.log(`\n📊 Progreso del usuario:`)
  console.log(`   Lecciones completadas: ${progress?.length || 0}`)
  console.log(`   Lecciones totales: ${lessons?.length || 0}`)
  console.log(`   Porcentaje: ${Math.round(((progress?.length || 0) / (lessons?.length || 1)) * 100)}%`)

  // 6. Comparación
  console.log(`\n🔍 COMPARACIÓN:`)
  console.log(`\n   Módulos:`)
  console.log(`      Campo 'total_modules': ${course.total_modules}`)
  console.log(`      Módulos reales: ${modules?.length || 0}`)
  console.log(`      ✅ ${course.total_modules === modules?.length ? 'CORRECTO' : '❌ INCORRECTO'}`)

  console.log(`\n   Lecciones:`)
  console.log(`      Campo 'total_lessons': ${course.total_lessons}`)
  console.log(`      Lecciones reales: ${lessons?.length || 0}`)
  console.log(`      ✅ ${course.total_lessons === lessons?.length ? 'CORRECTO' : '❌ INCORRECTO'}`)

  // 7. Recomendaciones
  console.log(`\n💡 RECOMENDACIONES:`)

  if (course.total_modules !== modules?.length || course.total_lessons !== lessons?.length) {
    console.log(`\n   ⚠️  Los campos total_modules y/o total_lessons están desactualizados`)
    console.log(`   📝 Ejecutar: npx tsx scripts/update-course-totals.ts`)
  }

  if ((modules?.length || 0) === 0) {
    console.log(`\n   ⚠️  No hay módulos en este curso`)
    console.log(`   📝 Verificar que los módulos existan en la tabla 'modules'`)
  }

  if ((lessons?.length || 0) === 0) {
    console.log(`\n   ⚠️  No hay lecciones en este curso`)
    console.log(`   📝 Verificar que las lecciones existan en la tabla 'lessons'`)
  }

}

diagnose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error en diagnóstico:', error)
    process.exit(1)
  })


