import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateCourseTotals() {
  console.log('🔧 [Update] Actualizando totales de cursos...\n')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title')

  if (!courses) {
    console.error('❌ No hay cursos')
    return
  }

  for (const course of courses) {
    console.log(`📚 Procesando: ${course.title}`)

    // Contar módulos
    const { count: modulesCount } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id)

    // Contar lecciones
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', course.id)

    const moduleIds = modules?.map(m => m.id) || []

    const { count: lessonsCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .in('module_id', moduleIds)

    console.log(`   Módulos: ${modulesCount}`)
    console.log(`   Lecciones: ${lessonsCount}`)

    // Actualizar
    const { error } = await supabase
      .from('courses')
      .update({
        total_modules: modulesCount,
        total_lessons: lessonsCount
      })
      .eq('id', course.id)

    if (error) {
      console.error(`   ❌ Error:`, error)
    } else {
      console.log(`   ✅ Actualizado\n`)
    }
  }

  console.log('✅ Actualización completada')
}

updateCourseTotals()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
