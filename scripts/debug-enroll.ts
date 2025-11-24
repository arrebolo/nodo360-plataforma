import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugEnroll() {
  console.log('🔍 [Debug] Verificando configuración de enrollments...\n')

  try {
    // 1. Verificar curso específico
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. VERIFICANDO CURSO: introduccion-criptomonedas')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const { data: targetCourse, error: targetError } = await supabase
      .from('courses')
      .select('id, slug, title, status, is_free, is_premium')
      .eq('slug', 'introduccion-criptomonedas')
      .single()

    if (targetError) {
      console.error('❌ Error al buscar curso:', targetError.message)

      // Buscar cursos similares
      console.log('\n🔍 Buscando cursos con "cripto" en el slug...')
      const { data: similarCourses } = await supabase
        .from('courses')
        .select('slug, title, status')
        .ilike('slug', '%cripto%')

      if (similarCourses && similarCourses.length > 0) {
        console.log('📋 Cursos encontrados:')
        console.table(similarCourses)
      } else {
        console.log('❌ No se encontraron cursos con "cripto"')
      }
    } else if (!targetCourse) {
      console.log('❌ Curso NO ENCONTRADO\n')

      // Mostrar todos los slugs disponibles
      const { data: allCourses } = await supabase
        .from('courses')
        .select('slug, title, status')
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('📋 Últimos 10 cursos disponibles:')
      console.table(allCourses)
    } else {
      console.log('✅ CURSO ENCONTRADO:\n')
      console.log('   ID:', targetCourse.id)
      console.log('   Slug:', targetCourse.slug)
      console.log('   Título:', targetCourse.title)
      console.log('   Status:', targetCourse.status, '<-- VERIFICAR ESTE VALOR')
      console.log('   Es gratis:', targetCourse.is_free)
      console.log('   Es premium:', targetCourse.is_premium)
      console.log('')

      // Verificar si el status pasaría la validación actual
      if (targetCourse.status !== 'published') {
        console.log('⚠️  PROBLEMA DETECTADO:')
        console.log(`   Status actual: "${targetCourse.status}"`)
        console.log('   Status esperado por el código: "published"')
        console.log('   → Este curso FALLARÁ la validación en app/api/enroll/route.ts')
        console.log('')
      } else {
        console.log('✅ Status correcto: "published"')
        console.log('')
      }
    }

    // 2. Analizar todos los status usados
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('2. ANÁLISIS DE STATUS DE TODOS LOS CURSOS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const { data: allCourses } = await supabase
      .from('courses')
      .select('title, status')

    const statusCount: Record<string, number> = {}
    const statusExamples: Record<string, string[]> = {}

    allCourses?.forEach(course => {
      statusCount[course.status] = (statusCount[course.status] || 0) + 1
      if (!statusExamples[course.status]) {
        statusExamples[course.status] = []
      }
      if (statusExamples[course.status].length < 2) {
        statusExamples[course.status].push(course.title)
      }
    })

    console.log('📊 Distribución de status:')
    console.table(statusCount)

    console.log('\n📋 Ejemplos por status:')
    Object.entries(statusExamples).forEach(([status, titles]) => {
      console.log(`\n   "${status}":`)
      titles.forEach(title => console.log(`      - ${title}`))
    })
    console.log('')

    // 3. Verificar tabla de enrollments
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('3. VERIFICANDO TABLA course_enrollments')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('id')

    if (enrollError) {
      console.error('❌ Error accediendo a course_enrollments:', enrollError.message)
    } else {
      console.log('✅ Tabla course_enrollments: ACCESIBLE')
      console.log(`📊 Enrollments existentes: ${enrollments?.length || 0}`)
      console.log('')
    }

    // 4. Verificar usuario de prueba
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('4. VERIFICANDO USUARIO DE PRUEBA')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const { data: users } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5)

    console.log('👥 Usuarios disponibles:')
    console.table(users)
    console.log('')

    // 5. Recomendaciones
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 RECOMENDACIONES')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (statusCount['publicado'] || statusCount['borrador']) {
      console.log('⚠️  ACCIÓN REQUERIDA: Status en español detectado\n')
      console.log('Los cursos usan status en español:')
      if (statusCount['publicado']) {
        console.log(`   - "publicado" (${statusCount['publicado']} cursos)`)
      }
      if (statusCount['borrador']) {
        console.log(`   - "borrador" (${statusCount['borrador']} cursos)`)
      }
      console.log('\nSoluciones:')
      console.log('   OPCIÓN A: Actualizar código para aceptar ambos idiomas')
      console.log('   OPCIÓN B: Cambiar status en BD a inglés\n')

      console.log('📝 Código a modificar en app/api/enroll/route.ts:')
      console.log('   LÍNEA ~43:')
      console.log('   CAMBIAR:')
      console.log('     if (course.status !== "published") {')
      console.log('   POR:')
      console.log('     const validStatuses = ["published", "publicado"]')
      console.log('     if (!validStatuses.includes(course.status)) {')
      console.log('')
    }

    if (statusCount['published']) {
      console.log('✅ Cursos con status="published" encontrados')
      console.log(`   (${statusCount['published']} cursos)`)
      console.log('')
    }

    if (!targetCourse) {
      console.log('⚠️  El slug "introduccion-criptomonedas" no existe')
      console.log('   → Verificar el slug correcto en la BD')
      console.log('   → Actualizar el componente con el slug correcto')
      console.log('')
    }

  } catch (error) {
    console.error('❌ [Debug] Error general:', error)
  }
}

debugEnroll()
