/**
 * Script de diagnóstico para verificar slugs en Supabase
 * Compara los slugs reales de la DB con las URLs esperadas
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Credenciales de Supabase no encontradas en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseSlugs() {
  console.log('🔍 DIAGNÓSTICO DE SLUGS - NODO360 PLATAFORMA\n')
  console.log('=' .repeat(80))

  try {
    // 1. Consultar todos los cursos
    console.log('\n📚 CONSULTANDO CURSOS EN BASE DE DATOS...\n')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, slug, status')
      .order('id')

    if (coursesError) {
      console.error('❌ Error consultando cursos:', coursesError)
      throw coursesError
    }

    console.log(`✅ Encontrados ${courses?.length || 0} cursos:\n`)
    console.log('─'.repeat(80))
    courses?.forEach(course => {
      console.log(`ID: ${course.id}`)
      console.log(`Título: ${course.title}`)
      console.log(`Slug: "${course.slug}"`)
      console.log(`Status: ${course.status}`)
      console.log(`URL esperada: /cursos/${course.slug}`)
      console.log('─'.repeat(80))
    })

    // 2. Consultar todas las lecciones agrupadas por curso
    console.log('\n📖 CONSULTANDO LECCIONES EN BASE DE DATOS...\n')
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        slug,
        module:module_id (
          id,
          course:course_id (
            id,
            title,
            slug
          )
        )
      `)
      .order('id')

    if (lessonsError) {
      console.error('❌ Error consultando lecciones:', lessonsError)
      throw lessonsError
    }

    console.log(`✅ Encontradas ${lessons?.length || 0} lecciones:\n`)

    // Agrupar por curso
    const lessonsByCourse = {}
    lessons?.forEach(lesson => {
      const courseSlug = lesson.module?.course?.slug
      if (!lessonsByCourse[courseSlug]) {
        lessonsByCourse[courseSlug] = {
          courseTitle: lesson.module?.course?.title,
          courseId: lesson.module?.course?.id,
          lessons: []
        }
      }
      lessonsByCourse[courseSlug].lessons.push(lesson)
    })

    Object.entries(lessonsByCourse).forEach(([courseSlug, data]) => {
      console.log('─'.repeat(80))
      console.log(`📚 CURSO: ${data.courseTitle} (slug: "${courseSlug}")`)
      console.log('─'.repeat(80))
      data.lessons.forEach(lesson => {
        console.log(`  ID: ${lesson.id}`)
        console.log(`  Título: ${lesson.title}`)
        console.log(`  Slug: "${lesson.slug}"`)
        console.log(`  URL esperada: /cursos/${courseSlug}/${lesson.slug}`)
        console.log('  ' + '─'.repeat(76))
      })
    })

    // 3. Verificar la URL específica mencionada
    console.log('\n🔎 VERIFICANDO URL ESPECÍFICA: /cursos/bitcoin-desde-cero/leccion-1-1\n')
    console.log('=' .repeat(80))

    const bitcoinCourse = courses?.find(c => c.slug === 'bitcoin-desde-cero')
    if (bitcoinCourse) {
      console.log(`✅ Curso encontrado: "${bitcoinCourse.title}" (ID: ${bitcoinCourse.id})`)
      console.log(`   Status: ${bitcoinCourse.status}`)
    } else {
      console.log('❌ NO se encontró curso con slug "bitcoin-desde-cero"')
      console.log('   Slugs disponibles de cursos:')
      courses?.forEach(c => console.log(`   - "${c.slug}"`))
    }

    const leccion11 = lessons?.find(l =>
      l.slug === 'leccion-1-1' && l.module?.course?.slug === 'bitcoin-desde-cero'
    )
    if (leccion11) {
      console.log(`✅ Lección encontrada: "${leccion11.title}" (ID: ${leccion11.id})`)
    } else {
      console.log('❌ NO se encontró lección con slug "leccion-1-1" en el curso "bitcoin-desde-cero"')
      const bitcoinLessons = lessons?.filter(l => l.module?.course?.slug === 'bitcoin-desde-cero')
      console.log(`   Slugs disponibles de lecciones en este curso (${bitcoinLessons?.length || 0}):`)
      bitcoinLessons?.forEach(l => console.log(`   - "${l.slug}" (${l.title})`))
    }

    // 4. Generar lista de URLs válidas
    console.log('\n✅ URLS VÁLIDAS BASADAS EN SLUGS REALES:\n')
    console.log('=' .repeat(80))

    courses?.filter(c => c.status === 'published').forEach(course => {
      console.log(`\n📚 ${course.title}:`)
      console.log(`   /cursos/${course.slug}`)

      const courseLessons = lessons?.filter(l =>
        l.module?.course?.slug === course.slug
      )
      courseLessons?.forEach(lesson => {
        console.log(`   /cursos/${course.slug}/${lesson.slug}`)
      })
    })

    console.log('\n' + '=' .repeat(80))
    console.log('✅ DIAGNÓSTICO COMPLETADO\n')

  } catch (error) {
    console.error('\n❌ ERROR EN DIAGNÓSTICO:', error)
    process.exit(1)
  }
}

diagnoseSlugs()
