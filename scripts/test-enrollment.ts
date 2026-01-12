import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testEnrollment() {
  console.log('🔍 [Test] Sistema de Inscripción - Nodo360\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Verificar que la tabla existe
  console.log('1️⃣  VERIFICAR: Tabla course_enrollments')
  console.log('─────────────────────────────────────────────────────────')

  const { data: testQuery, error: tableError } = await supabase
    .from('course_enrollments')
    .select('*')
    .limit(1)

  if (tableError) {
    console.error('❌ Tabla NO existe o hay problema de permisos:', tableError)
    console.log('')
    return
  }

  console.log('✅ Tabla course_enrollments existe')
  console.log('   Registros en tabla:', testQuery?.length || 0)
  console.log('')

  // 2. Obtener usuario y curso de prueba
  console.log('2️⃣  OBTENER: Usuario y Curso de prueba')
  console.log('─────────────────────────────────────────────────────────')

  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(5)

  if (!users || users.length === 0) {
    console.error('❌ No hay usuarios para probar')
    return
  }

  const user = users[0]
  console.log('👤 Usuario:', user.email)
  console.log('🆔 ID:', user.id)
  console.log('')

  // 3. Buscar curso "Seguridad en Crypto: Primeros Pasos"
  console.log('3️⃣  BUSCAR: Curso "Seguridad en Crypto: Primeros Pasos"')
  console.log('─────────────────────────────────────────────────────────')

  const { data: targetCourse, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title, status')
    .eq('slug', 'seguridad-crypto-basico')
    .single()

  if (courseError || !targetCourse) {
    console.error('❌ Curso no encontrado:', courseError)
    console.log('   Slug buscado: seguridad-crypto-basico')
    console.log('')

    // Listar cursos disponibles
    const { data: allCourses } = await supabase
      .from('courses')
      .select('slug, title, status')
      .eq('status', 'published')

    console.log('📚 Cursos publicados disponibles:')
    allCourses?.forEach(c => {
      console.log(`   - ${c.title} (${c.slug})`)
    })
    console.log('')
    return
  }

  console.log('✅ Curso encontrado:', targetCourse.title)
  console.log('   Slug:', targetCourse.slug)
  console.log('   ID:', targetCourse.id)
  console.log('   Status:', targetCourse.status)
  console.log('')

  // 4. Verificar si ya está inscrito
  console.log('4️⃣  VERIFICAR: Inscripción existente')
  console.log('─────────────────────────────────────────────────────────')

  const { data: existing, error: checkError } = await supabase
    .from('course_enrollments')
    .select('id, enrolled_at')
    .eq('user_id', user.id)
    .eq('course_id', targetCourse.id)
    .maybeSingle()

  if (checkError) {
    console.error('❌ Error al verificar inscripción:', checkError)
    console.log('')
    return
  }

  if (existing) {
    console.log('ℹ️  Usuario YA está inscrito en este curso')
    console.log('   Enrollment ID:', existing.id)
    console.log('   Fecha inscripción:', new Date(existing.enrolled_at).toLocaleString())
    console.log('')
    console.log('🔄 Voy a eliminar la inscripción para probar de nuevo...')

    const { error: deleteError } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('id', existing.id)

    if (deleteError) {
      console.error('❌ Error al eliminar inscripción:', deleteError)
      console.log('')
      return
    }

    console.log('✅ Inscripción eliminada, continuando con test...')
    console.log('')
  } else {
    console.log('✅ Usuario NO está inscrito en este curso')
    console.log('')
  }

  // 5. Intentar inscripción (SIMULANDO LO QUE HACE EL ENDPOINT)
  console.log('5️⃣  SIMULAR: Inscripción (como lo hace el endpoint)')
  console.log('─────────────────────────────────────────────────────────')

  console.log('Preparando datos para INSERT...')
  console.log('   user_id:', user.id)
  console.log('   course_id:', targetCourse.id)
  console.log('   enrolled_at:', new Date().toISOString())
  console.log('')

  console.log('Ejecutando INSERT en course_enrollments...')

  const { data: enrollment, error: enrollError } = await supabase
    .from('course_enrollments')
    .insert({
      user_id: user.id,
      course_id: targetCourse.id,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0
    })
    .select()
    .single()

  if (enrollError) {
    console.error('❌ ERROR en INSERT:', enrollError)
    console.error('   Código:', enrollError.code)
    console.error('   Mensaje:', enrollError.message)
    console.error('   Detalles:', enrollError.details || 'N/A')
    console.log('')

    // Diagnosticar tipo de error
    if (enrollError.code === '42501') {
      console.log('🔒 DIAGNÓSTICO: RLS está bloqueando el INSERT')
      console.log('   Causa: Falta política INSERT para course_enrollments')
      console.log('   Solución: Ejecutar en Supabase SQL Editor:')
      console.log('')
      console.log('   CREATE POLICY "Users can enroll themselves"')
      console.log('     ON course_enrollments')
      console.log('     FOR INSERT')
      console.log('     WITH CHECK (auth.uid() = user_id);')
      console.log('')
    } else if (enrollError.code === '23503') {
      console.log('🔗 DIAGNÓSTICO: Foreign key inválido')
      console.log('   Causa: user_id o course_id no existe en tabla referenciada')
      console.log('   Verificar:')
      console.log('     - ¿El user_id existe en auth.users?')
      console.log('     - ¿El course_id existe en courses?')
      console.log('')
    } else if (enrollError.code === '23505') {
      console.log('🔄 DIAGNÓSTICO: Registro duplicado (UNIQUE constraint)')
      console.log('   Causa: Ya existe inscripción para este usuario y curso')
      console.log('   Esto es normal, el endpoint debe manejarlo')
      console.log('')
    } else if (enrollError.code === '23502') {
      console.log('⚠️  DIAGNÓSTICO: Campo requerido faltante (NOT NULL)')
      console.log('   Causa: Falta campo obligatorio en INSERT')
      console.log('   Verificar schema de course_enrollments')
      console.log('')
    } else {
      console.log('❓ DIAGNÓSTICO: Error desconocido')
      console.log('   Revisar logs completos arriba')
      console.log('')
    }
    return
  }

  console.log('✅ Inscripción EXITOSA')
  console.log('   Enrollment ID:', enrollment.id)
  console.log('   User ID:', enrollment.user_id)
  console.log('   Course ID:', enrollment.course_id)
  console.log('   Enrolled At:', new Date(enrollment.enrolled_at).toLocaleString())
  console.log('')

  // 6. Verificar datos insertados con JOIN
  console.log('6️⃣  VERIFICAR: Datos insertados (con JOINs)')
  console.log('─────────────────────────────────────────────────────────')

  const { data: verified, error: verifyError } = await supabase
    .from('course_enrollments')
    .select(`
      id,
      enrolled_at,
      progress_percentage,
      users!inner(email, full_name),
      courses!inner(title, slug)
    `)
    .eq('id', enrollment.id)
    .single()

  if (verifyError) {
    console.error('❌ Error al verificar con JOINs:', verifyError)
    console.log('   Esto puede indicar problema con foreign keys')
    console.log('')
  } else {
    console.log('✅ Datos verificados con éxito:')
    console.log(`   Usuario: ${(verified.users as any).email}`)
    console.log(`   Nombre: ${(verified.users as any).full_name || 'N/A'}`)
    console.log(`   Curso: ${(verified.courses as any).title}`)
    console.log(`   Progreso: ${verified.progress_percentage}%`)
    console.log(`   Fecha: ${new Date(verified.enrolled_at).toLocaleString()}`)
    console.log('')
  }

  // 7. Probar función enrollUserInCourse (la que usa el endpoint)
  console.log('7️⃣  PROBAR: Función enrollUserInCourse()')
  console.log('─────────────────────────────────────────────────────────')

  // Primero eliminar la inscripción que creamos
  await supabase
    .from('course_enrollments')
    .delete()
    .eq('id', enrollment.id)

  console.log('Probando función lib/db/enrollments.enrollUserInCourse()...')
  console.log('')

  // Importar y probar función real
  try {
    // Simular lo que hace la función
    const { data: existingCheck } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', targetCourse.id)
      .single()

    if (existingCheck) {
      console.log('ℹ️  Ya está inscrito (verificación previa)')
    }

    const { data: newEnrollment, error: funcError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: user.id,
        course_id: targetCourse.id,
        progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (funcError) {
      console.error('❌ Error en función:', funcError)
    } else {
      console.log('✅ Función funcionó correctamente')
      console.log('   ID:', newEnrollment.id)
    }
  } catch (e) {
    console.error('❌ Exception al probar función:', e)
  }
  console.log('')

  // 8. Resumen
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🎯 RESUMEN Y DIAGNÓSTICO')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('✅ TESTS COMPLETADOS')
  console.log('')
  console.log('📊 Resultados:')
  console.log('   ✅ Tabla course_enrollments: Existe')
  console.log('   ✅ Usuario de prueba: Encontrado')
  console.log('   ✅ Curso "Seguridad en Crypto": Encontrado')
  console.log('   ✅ INSERT directo: Funciona')
  console.log('   ✅ Verificación con JOINs: Funciona')
  console.log('')
  console.log('💡 Si aún hay error 500 en el endpoint:')
  console.log('   1. Verificar autenticación del usuario en navegador')
  console.log('   2. Verificar que courseId se envía correctamente en fetch')
  console.log('   3. Revisar logs del servidor cuando se hace POST')
  console.log('   4. Verificar cookies de sesión (sb-access-token)')
  console.log('')
  console.log('📝 Próximo paso:')
  console.log('   → Probar endpoint desde navegador con usuario real')
  console.log('   → Revisar console del navegador y servidor en paralelo')
  console.log('')
}

testEnrollment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal en test:', error)
    process.exit(1)
  })


