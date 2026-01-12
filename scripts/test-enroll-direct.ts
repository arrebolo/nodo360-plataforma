/**
 * Script de diagnóstico: Prueba de inscripción directa
 *
 * Este script prueba la inscripción en un curso directamente
 * para identificar errores específicos.
 *
 * USO:
 * npx tsx scripts/test-enroll-direct.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testEnrollment() {
  console.log('🔍 Iniciando diagnóstico de inscripción...\n')

  try {
    // 1. Verificar que la tabla course_enrollments existe
    console.log('1️⃣ Verificando estructura de course_enrollments...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('course_enrollments')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ Error accediendo a course_enrollments:', tableError.message)
      console.error('   Detalles:', JSON.stringify(tableError, null, 2))
      return
    }
    console.log('✅ Tabla course_enrollments existe y es accesible\n')

    // 2. Obtener un usuario de prueba
    console.log('2️⃣ Obteniendo usuario de prueba...')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('❌ No se pudo obtener usuario de prueba')
      return
    }

    const testUser = users[0]
    console.log('✅ Usuario de prueba:', testUser.email)
    console.log('   ID:', testUser.id, '\n')

    // 3. Obtener un curso publicado
    console.log('3️⃣ Obteniendo curso publicado...')
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, status, enrolled_count')
      .eq('status', 'published')
      .limit(1)

    if (courseError || !courses || courses.length === 0) {
      console.error('❌ No se pudo obtener curso publicado')
      console.error('   Error:', courseError?.message)
      return
    }

    const testCourse = courses[0]
    console.log('✅ Curso de prueba:', testCourse.title)
    console.log('   ID:', testCourse.id)
    console.log('   Enrolled count:', testCourse.enrolled_count, '\n')

    // 4. Verificar si ya está inscrito
    console.log('4️⃣ Verificando inscripción existente...')
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('course_id', testCourse.id)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error verificando inscripción:', checkError.message)
      console.error('   Detalles:', JSON.stringify(checkError, null, 2))
      return
    }

    if (existingEnrollment) {
      console.log('⚠️  Usuario ya está inscrito en este curso')
      console.log('   Enrollment ID:', existingEnrollment.id)
      console.log('\n🔧 Eliminando inscripción existente para re-probar...')

      const { error: deleteError } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', existingEnrollment.id)

      if (deleteError) {
        console.error('❌ Error eliminando inscripción:', deleteError.message)
        return
      }
      console.log('✅ Inscripción eliminada\n')
    } else {
      console.log('✅ No hay inscripción existente\n')
    }

    // 5. Intentar crear inscripción
    console.log('5️⃣ Intentando crear inscripción...')
    console.log('   Datos a insertar:')
    console.log('   - user_id:', testUser.id)
    console.log('   - course_id:', testCourse.id)
    console.log('   - progress_percentage: 0')
    console.log('   - enrolled_at:', new Date().toISOString())

    const { data: newEnrollment, error: insertError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: testUser.id,
        course_id: testCourse.id,
        progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('\n❌ ERROR AL CREAR INSCRIPCIÓN:')
      console.error('   Código:', insertError.code)
      console.error('   Mensaje:', insertError.message)
      console.error('   Detalles completos:', JSON.stringify(insertError, null, 2))

      // Diagnóstico adicional
      if (insertError.code === '42501') {
        console.error('\n🔍 Error 42501 = Permiso denegado (RLS)')
        console.error('   Posibles causas:')
        console.error('   - Las políticas RLS no están configuradas correctamente')
        console.error('   - La migración 04-migration-enrollments.sql no se aplicó')
        console.error('   - El service role key no tiene permisos')
      } else if (insertError.code === '23503') {
        console.error('\n🔍 Error 23503 = Violación de llave foránea')
        console.error('   Posibles causas:')
        console.error('   - El user_id o course_id no existen')
        console.error('   - Referencias mal configuradas')
      } else if (insertError.code === '23505') {
        console.error('\n🔍 Error 23505 = Violación de restricción única')
        console.error('   El usuario ya está inscrito (pero no lo detectamos antes)')
      }

      return
    }

    console.log('\n✅ ¡INSCRIPCIÓN CREADA EXITOSAMENTE!')
    console.log('   Enrollment ID:', newEnrollment.id)
    console.log('   Datos:', JSON.stringify(newEnrollment, null, 2))

    // 6. Verificar que enrolled_count se actualizó
    console.log('\n6️⃣ Verificando actualización de enrolled_count...')
    const { data: updatedCourse } = await supabase
      .from('courses')
      .select('enrolled_count')
      .eq('id', testCourse.id)
      .single()

    if (updatedCourse) {
      const countChanged = updatedCourse.enrolled_count !== testCourse.enrolled_count
      console.log(countChanged ? '✅' : '⚠️', 'Enrolled count:', testCourse.enrolled_count, '→', updatedCourse.enrolled_count)

      if (!countChanged) {
        console.log('⚠️  El trigger de enrolled_count podría no estar funcionando')
      }
    }

    console.log('\n✅ DIAGNÓSTICO COMPLETADO EXITOSAMENTE')

  } catch (error) {
    console.error('\n❌ EXCEPCIÓN NO CONTROLADA:')
    console.error('   Tipo:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('   Mensaje:', error instanceof Error ? error.message : String(error))
    console.error('   Stack:', error instanceof Error ? error.stack : 'No disponible')
  }
}

testEnrollment()


