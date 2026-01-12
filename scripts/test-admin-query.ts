import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testAdminQuery() {
  console.log('🔍 [Test] Probando query del panel de admin...\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // 1. PROBAR QUERY SIMPLE (sin joins)
    console.log('1️⃣  TEST: Query simple de courses')
    console.log('─────────────────────────────────────────────────────────')

    const { data: simpleCourses, error: simpleError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (simpleError) {
      console.error('❌ Error:', simpleError.message)
    } else {
      console.log(`✅ Query simple exitosa: ${simpleCourses?.length || 0} cursos`)
      console.log('')
    }

    // 2. PROBAR QUERY CON JOIN (como usa el admin)
    console.log('2️⃣  TEST: Query con joins (igual que admin)')
    console.log('─────────────────────────────────────────────────────────')

    const { data: adminCourses, error: adminError } = await supabase
      .from('courses')
      .select(`
        *,
        modules:modules(
          id,
          lessons:lessons(count)
        ),
        enrollments:course_enrollments(count)
      `)
      .order('created_at', { ascending: false })

    if (adminError) {
      console.error('❌ Error en query de admin:', adminError)
      console.error('   Code:', adminError.code)
      console.error('   Details:', adminError.details)
      console.error('   Hint:', adminError.hint)
      console.log('')
    } else {
      console.log(`✅ Query de admin exitosa: ${adminCourses?.length || 0} cursos`)

      if (adminCourses && adminCourses.length > 0) {
        console.log('\n📊 Primeros 3 cursos con contadores:')
        console.table(adminCourses.slice(0, 3).map(c => {
          const modulesLessons = c.modules?.reduce((acc: number, mod: any) => {
            return acc + (mod.lessons?.[0]?.count || 0)
          }, 0) || 0
          return {
            titulo: c.title.substring(0, 30),
            modulos: c.modules?.length || 0,
            lecciones: modulesLessons,
            inscritos: c.enrollments?.[0]?.count || 0
          }
        }))
      }
      console.log('')
    }

    // 3. CALCULAR ESTADÍSTICAS (como hace el admin)
    if (adminCourses) {
      console.log('3️⃣  TEST: Cálculo de estadísticas')
      console.log('─────────────────────────────────────────────────────────')

      const totalCourses = adminCourses.length
      const totalModules = adminCourses.reduce((acc, course) => acc + (course.modules?.length || 0), 0)
      const totalLessons = adminCourses.reduce((acc, course) => {
        const modulesLessons = course.modules?.reduce((modAcc: number, mod: any) => {
          return modAcc + (mod.lessons?.[0]?.count || 0)
        }, 0) || 0
        return acc + modulesLessons
      }, 0)
      const totalEnrollments = adminCourses.reduce((acc, course) => acc + (course.enrollments?.[0]?.count || 0), 0)

      console.log('📊 Estadísticas calculadas:')
      console.log(`   Total Cursos: ${totalCourses}`)
      console.log(`   Total Módulos: ${totalModules}`)
      console.log(`   Total Lecciones: ${totalLessons}`)
      console.log(`   Total Inscritos: ${totalEnrollments}`)
      console.log('')
    }

    // 4. VERIFICAR RLS POLICIES EN COURSES
    console.log('4️⃣  TEST: Verificar RLS policies')
    console.log('─────────────────────────────────────────────────────────')

    const { data: policies, error: policiesError } = await supabase
      .rpc('pg_policies', {})
      .select('*')
      .eq('tablename', 'courses')
      .catch(() => ({ data: null, error: null }))

    // Si no funciona el RPC, intentar query directa
    const { data: rlsCheck } = await supabase
      .from('courses')
      .select('id')
      .limit(1)

    if (rlsCheck && rlsCheck.length > 0) {
      console.log('✅ RLS permite lectura de courses')
    } else {
      console.log('⚠️  RLS podría estar bloqueando lectura')
    }
    console.log('')

    // 5. CONCLUSIÓN
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎯 DIAGNÓSTICO FINAL')
    console.log('═══════════════════════════════════════════════════════════\n')

    if (adminError) {
      console.log('❌ PROBLEMA IDENTIFICADO: Query del admin está fallando')
      console.log('\n🔍 Posibles causas:')
      console.log('   1. RLS (Row Level Security) bloqueando acceso')
      console.log('   2. Relaciones entre tablas no configuradas correctamente')
      console.log('   3. Usuario no tiene permisos necesarios')
      console.log('\n💡 SOLUCIÓN:')
      console.log('   → Verificar RLS policies en Supabase Dashboard')
      console.log('   → Tabla courses debe tener policy para lectura pública')
      console.log('   → O policy específica para admins')
      console.log('')
    } else if (adminCourses && adminCourses.length === 0) {
      console.log('⚠️  Query funciona pero retorna 0 resultados')
      console.log('\n🔍 Esto significa:')
      console.log('   → RLS está bloqueando los cursos')
      console.log('   → O los cursos no cumplen algún filtro')
      console.log('\n💡 SOLUCIÓN:')
      console.log('   → Revisar RLS policies en courses table')
      console.log('   → Agregar policy para usuarios admin')
      console.log('')
    } else {
      console.log('✅ QUERY DEL ADMIN FUNCIONA PERFECTAMENTE')
      console.log('\n📊 Datos retornados:')
      console.log(`   ${adminCourses.length} cursos encontrados`)
      console.log('\n🎯 PROBLEMA DEBE SER:')
      console.log('   → En el cliente (navegador)')
      console.log('   → En el servidor (Next.js server component)')
      console.log('   → En la autenticación del usuario')
      console.log('\n💡 PRÓXIMO PASO:')
      console.log('   → Verificar que requireAdmin() no está bloqueando')
      console.log('   → Verificar que createClient() en servidor funciona')
      console.log('   → Agregar console.log en app/admin/cursos/page.tsx')
      console.log('')
    }

  } catch (error) {
    console.error('❌ [Test] Error general:', error)
  }
}

testAdminQuery()


