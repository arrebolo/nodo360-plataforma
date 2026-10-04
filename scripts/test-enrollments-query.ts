import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// EL CORREO ENTRA POR ARGUMENTO: este fichero esta en un repositorio publico.
const CORREO = process.argv[2] ?? process.env.NODO360_ADMIN_EMAIL ?? ''
if (!CORREO) {
  console.error('Falta el correo de la cuenta.\n  uso: npx tsx <este fichero> <correo>')
  process.exit(1)
}

async function testEnrollmentsQuery() {
  console.log('🔍 [Test] Probando query de enrollments con join correcto...\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // 1. OBTENER USUARIO DE PRUEBA
    console.log('1️⃣  Obteniendo usuario de prueba')
    console.log('─────────────────────────────────────────────────────────')

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', CORREO)
      .single()

    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError?.message)

      // Intentar con cualquier usuario
      const { data: anyUser } = await supabase
        .from('users')
        .select('id, email')
        .limit(1)
        .single()

      if (anyUser) {
        console.log('⚠️  Usando usuario alternativo:', anyUser.email)
        console.log('   ID:', anyUser.id)
        console.log('')
      } else {
        console.error('❌ No hay usuarios en la BD')
        return
      }
    } else {
      console.log('✅ Usuario de prueba:', user.email)
      console.log('   ID:', user.id)
      console.log('   Role:', user.role)
      console.log('')
    }

    const userId = user?.id

    // 2. PROBAR QUERY CON JOIN CORRECTO
    console.log('2️⃣  Probando query con join: course:courses!course_id')
    console.log('─────────────────────────────────────────────────────────')

    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        enrolled_at,
        last_accessed_at,
        completed_at,
        progress_percentage,
        course:courses!course_id (
          id,
          slug,
          title,
          description,
          level,
          thumbnail_url,
          banner_url,
          total_modules,
          total_lessons,
          total_duration_minutes,
          is_free,
          status
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('❌ ERROR EN QUERY:')
      console.error('   Message:', error.message)
      console.error('   Code:', error.code)
      console.error('   Details:', error.details)
      console.error('   Hint:', error.hint)
      console.error('\n📋 Error completo:', JSON.stringify(error, null, 2))
      console.log('')
      return
    }

    console.log('✅ Query exitosa sin errores')
    console.log('📊 Enrollments encontrados:', enrollments?.length || 0)
    console.log('')

    if (enrollments && enrollments.length > 0) {
      console.log('3️⃣  Datos retornados')
      console.log('─────────────────────────────────────────────────────────')

      console.log('\n📋 Lista de inscripciones:')
      console.table(enrollments.map(e => ({
        curso: e.course?.title || '(sin título)',
        slug: e.course?.slug || '(sin slug)',
        progreso: `${e.progress_percentage}%`,
        fecha: new Date(e.enrolled_at).toLocaleDateString('es-ES')
      })))

      console.log('\n📊 Primer enrollment (estructura completa):')
      console.log(JSON.stringify(enrollments[0], null, 2))
      console.log('')

      // Verificar que course tiene los datos esperados
      const firstEnrollment = enrollments[0]
      console.log('4️⃣  Verificación de estructura')
      console.log('─────────────────────────────────────────────────────────')

      console.log('✅ Campos del enrollment:')
      console.log('   id:', !!firstEnrollment.id)
      console.log('   user_id:', !!firstEnrollment.user_id)
      console.log('   course_id:', !!firstEnrollment.course_id)
      console.log('   enrolled_at:', !!firstEnrollment.enrolled_at)
      console.log('   progress_percentage:', firstEnrollment.progress_percentage)
      console.log('')

      console.log('✅ Campos del course (joined):')
      console.log('   course.id:', !!firstEnrollment.course?.id)
      console.log('   course.slug:', !!firstEnrollment.course?.slug)
      console.log('   course.title:', !!firstEnrollment.course?.title)
      console.log('   course.thumbnail_url:', !!firstEnrollment.course?.thumbnail_url)
      console.log('   course.total_lessons:', firstEnrollment.course?.total_lessons)
      console.log('')

      if (!firstEnrollment.course) {
        console.error('⚠️  PROBLEMA: El campo "course" es null o undefined')
        console.log('   Esto significa que el join NO funcionó correctamente')
        console.log('')
      }
    } else {
      console.log('⚠️  No hay inscripciones para este usuario')
      console.log('')

      // Verificar si hay enrollments en la tabla
      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })

      console.log('📊 Total enrollments en la BD:', count || 0)

      if (count && count > 0) {
        console.log('   → El usuario específico no tiene enrollments')
      } else {
        console.log('   → La tabla está vacía, nadie se ha inscrito aún')
      }
      console.log('')
    }

    // 5. CONCLUSIÓN
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎯 RESULTADO DEL TEST')
    console.log('═══════════════════════════════════════════════════════════\n')

    if (error) {
      console.log('❌ QUERY FALLÓ')
      console.log('   → Revisar sintaxis del join')
      console.log('   → Verificar foreign key existe en BD')
      console.log('')
    } else if (!enrollments || enrollments.length === 0) {
      console.log('✅ QUERY FUNCIONA (pero sin resultados)')
      console.log('   → Usuario no tiene enrollments')
      console.log('   → Necesita inscribirse en un curso')
      console.log('')
    } else if (!enrollments[0].course) {
      console.log('⚠️  QUERY FUNCIONA PERO JOIN FALLA')
      console.log('   → El join no está retornando datos de course')
      console.log('   → Verificar FK course_enrollments.course_id → courses.id')
      console.log('')
    } else {
      console.log('✅ QUERY FUNCIONA PERFECTAMENTE')
      console.log(`   → ${enrollments.length} enrollments encontrados`)
      console.log('   → Join con courses funcionando correctamente')
      console.log('   → Datos completos disponibles')
      console.log('')
      console.log('🎉 El dashboard debería funcionar correctamente ahora')
      console.log('')
    }

  } catch (error) {
    console.error('❌ [Test] Error general:', error)
  }
}

testEnrollmentsQuery()


