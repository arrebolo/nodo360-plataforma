import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyDatabaseState() {
  console.log('🔍 [Verify] Verificando estado completo de la base de datos...\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // 1. VERIFICAR TABLA COURSES
    console.log('1️⃣  TABLA: courses')
    console.log('─────────────────────────────────────────────────────────')

    const { data: courses, error: coursesError, count: coursesCount } = await supabase
      .from('courses')
      .select('id, slug, title, status, is_free, is_premium, instructor_id', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('❌ Error:', coursesError.message)
    } else {
      console.log(`📊 Total cursos: ${coursesCount || 0}`)

      if (!courses || courses.length === 0) {
        console.log('⚠️  LA TABLA COURSES ESTÁ VACÍA')
        console.log('   → Necesitas ejecutar seed de cursos\n')
      } else {
        console.log('✅ Cursos encontrados:\n')
        console.table(courses.map(c => ({
          slug: c.slug,
          title: c.title.substring(0, 40),
          status: c.status,
          gratis: c.is_free ? '✓' : '✗',
          premium: c.is_premium ? '✓' : '✗'
        })))
        console.log('')
      }
    }

    // 2. VERIFICAR TABLA MODULES
    console.log('2️⃣  TABLA: modules')
    console.log('─────────────────────────────────────────────────────────')

    const { count: modulesCount } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Total módulos: ${modulesCount || 0}`)

    if (!modulesCount || modulesCount === 0) {
      console.log('⚠️  LA TABLA MODULES ESTÁ VACÍA\n')
    } else {
      console.log('✅ Módulos encontrados\n')
    }

    // 3. VERIFICAR TABLA LESSONS
    console.log('3️⃣  TABLA: lessons')
    console.log('─────────────────────────────────────────────────────────')

    const { count: lessonsCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Total lecciones: ${lessonsCount || 0}`)

    if (!lessonsCount || lessonsCount === 0) {
      console.log('⚠️  LA TABLA LESSONS ESTÁ VACÍA\n')
    } else {
      console.log('✅ Lecciones encontradas\n')
    }

    // 4. VERIFICAR TABLA COURSE_ENROLLMENTS
    console.log('4️⃣  TABLA: course_enrollments')
    console.log('─────────────────────────────────────────────────────────')

    const { data: enrollments, error: enrollError, count: enrollCount } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        progress_percentage,
        enrolled_at,
        users!inner(email),
        courses!inner(title)
      `, { count: 'exact' })
      .order('enrolled_at', { ascending: false })

    if (enrollError) {
      console.error('❌ Error:', enrollError.message)
    } else {
      console.log(`📊 Total inscripciones: ${enrollCount || 0}`)

      if (!enrollments || enrollments.length === 0) {
        console.log('⚠️  LA TABLA COURSE_ENROLLMENTS ESTÁ VACÍA')
        console.log('   → Usuario nunca se inscribió exitosamente\n')
      } else {
        console.log('✅ Inscripciones encontradas:\n')
        console.table(enrollments.map(e => ({
          email: e.users.email,
          curso: e.courses.title.substring(0, 40),
          progreso: `${e.progress_percentage}%`,
          fecha: new Date(e.enrolled_at).toLocaleDateString()
        })))
        console.log('')
      }
    }

    // 5. VERIFICAR TABLA USERS
    console.log('5️⃣  TABLA: users')
    console.log('─────────────────────────────────────────────────────────')

    const { data: users, count: usersCount } = await supabase
      .from('users')
      .select('id, email, role', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5)

    console.log(`📊 Total usuarios: ${usersCount || 0}`)

    if (users && users.length > 0) {
      console.log('✅ Últimos usuarios:')
      console.table(users)
      console.log('')
    }

    // 6. RESUMEN Y DIAGNÓSTICO
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📋 RESUMEN DEL DIAGNÓSTICO')
    console.log('═══════════════════════════════════════════════════════════\n')

    const issues: string[] = []
    const solutions: string[] = []

    if (!coursesCount || coursesCount === 0) {
      issues.push('❌ NO HAY CURSOS EN LA BASE DE DATOS')
      solutions.push('→ Ejecutar seed de cursos (ver imagen de /cursos que tenía 3 cursos)')
      solutions.push('→ O los cursos se borraron/nunca se crearon')
    }

    if (!modulesCount || modulesCount === 0) {
      issues.push('❌ NO HAY MÓDULOS EN LA BASE DE DATOS')
      solutions.push('→ Los cursos necesitan módulos para funcionar')
    }

    if (!lessonsCount || lessonsCount === 0) {
      issues.push('❌ NO HAY LECCIONES EN LA BASE DE DATOS')
      solutions.push('→ Los módulos necesitan lecciones para funcionar')
    }

    if (!enrollCount || enrollCount === 0) {
      issues.push('⚠️  NO HAY INSCRIPCIONES (pero esto es normal si no hay cursos)')
      solutions.push('→ No se puede inscribir si no hay cursos')
    }

    if (issues.length === 0) {
      console.log('✅ LA BASE DE DATOS ESTÁ BIEN')
      console.log('   El problema debe estar en las queries del dashboard\n')
    } else {
      console.log('🚨 PROBLEMAS ENCONTRADOS:\n')
      issues.forEach(issue => console.log(`   ${issue}`))
      console.log('\n💡 SOLUCIONES:\n')
      solutions.forEach(sol => console.log(`   ${sol}`))
      console.log('')
    }

    // 7. VERIFICAR SI SCHEMA TIENE LOS CURSOS DE EJEMPLO
    console.log('7️⃣  VERIFICACIÓN: ¿Se aplicó el schema completo?')
    console.log('─────────────────────────────────────────────────────────')

    if (!coursesCount && !modulesCount && !lessonsCount) {
      console.log('❌ PROBLEMA CRÍTICO:')
      console.log('   El schema.sql probablemente NO incluye datos de seed')
      console.log('   O los datos de seed nunca se ejecutaron\n')
      console.log('📝 ACCIÓN REQUERIDA:')
      console.log('   1. Verificar en Supabase qué queries están guardadas')
      console.log('   2. Buscar si hay algún seed SQL con INSERT statements')
      console.log('   3. O crear seed manualmente con cursos de prueba\n')
    }

    // 8. CONCLUSIÓN
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎯 PRÓXIMOS PASOS')
    console.log('═══════════════════════════════════════════════════════════\n')

    if (!coursesCount) {
      console.log('PASO 1: Crear cursos en la base de datos')
      console.log('   - Opción A: Ejecutar seed SQL (si existe)')
      console.log('   - Opción B: Crear cursos manualmente desde panel admin')
      console.log('   - Opción C: Usar el script de seed que Claude Code creó\n')
    } else if (!enrollCount) {
      console.log('PASO 1: Intentar inscribirse en un curso')
      console.log('   - Ir a: /cursos/[slug]')
      console.log('   - Click en "Inscribirse Gratis"')
      console.log('   - Verificar que se crea registro en course_enrollments\n')
    } else {
      console.log('PASO 1: Depurar queries del dashboard')
      console.log('   - Revisar getUserEnrollments() en lib/db/enrollments.ts')
      console.log('   - Verificar que el join con courses funciona')
      console.log('   - Agregar logging detallado\n')
    }

  } catch (error) {
    console.error('❌ [Verify] Error general:', error)
  }
}

verifyDatabaseState()
