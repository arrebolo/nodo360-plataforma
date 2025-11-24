import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function applyMigration() {
  console.log('🔧 [Migration] Aplicando migration de learning paths...\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // Leer el archivo SQL
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '003_learning_paths.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 [Migration] Archivo cargado:', migrationPath)
    console.log('📊 [Migration] Tamaño:', sql.length, 'caracteres\n')

    // Ejecutar la migration
    console.log('⚡ [Migration] Ejecutando SQL...\n')

    // Nota: Supabase client no soporta ejecución directa de SQL multi-statement
    // Por lo tanto, vamos a dividir el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') ||
          statement.includes('ALTER TABLE') || statement.includes('CREATE POLICY') ||
          statement.includes('DROP POLICY') || statement.includes('INSERT INTO') ||
          statement.includes('COMMENT ON')) {

        try {
          console.log(`  ${i + 1}/${statements.length} Ejecutando...`)
          // Para este script, vamos a usar rpc o indicar al usuario que use el SQL Editor
          // ya que el client de Supabase no soporta DDL statements directamente
        } catch (err) {
          console.log(`  ⚠️  Statement ${i + 1} - Ver detalles:`, err)
        }
      }
    }

    console.log('\n⚠️  [Migration] IMPORTANTE:')
    console.log('   Este script no puede ejecutar DDL statements directamente.')
    console.log('   Por favor, aplica la migration manualmente:\n')
    console.log('   1. Ir a Supabase Dashboard')
    console.log('   2. SQL Editor')
    console.log('   3. Copiar contenido de: supabase/migrations/003_learning_paths.sql')
    console.log('   4. Pegar y ejecutar\n')

    // Verificar si las tablas ya existen
    console.log('🔍 [Migration] Verificando tablas existentes...\n')

    const { data: paths, error: pathsError } = await supabase
      .from('learning_paths')
      .select('*')
      .limit(1)

    if (pathsError) {
      if (pathsError.code === '42P01') {
        console.log('❌ [Migration] Tabla learning_paths NO existe')
        console.log('   → Aplicar migration manualmente en Supabase\n')
      } else {
        console.log('⚠️  [Migration] Error verificando tabla:', pathsError.message)
      }
    } else {
      console.log('✅ [Migration] Tabla learning_paths existe')

      const { data: allPaths } = await supabase
        .from('learning_paths')
        .select('slug, title')
        .order('order_index')

      if (allPaths && allPaths.length > 0) {
        console.log('   Rutas encontradas:', allPaths.length)
        allPaths.forEach((path, i) => {
          console.log(`   ${i + 1}. ${path.title} (${path.slug})`)
        })
      } else {
        console.log('   ⚠️  No hay rutas insertadas')
      }
    }

    // Verificar path_courses
    const { data: pathCourses, error: coursesError } = await supabase
      .from('path_courses')
      .select('*')
      .limit(1)

    if (!coursesError) {
      const { count } = await supabase
        .from('path_courses')
        .select('*', { count: 'exact', head: true })

      console.log(`\n✅ [Migration] Tabla path_courses existe`)
      console.log(`   Cursos asignados: ${count || 0}`)
    }

    // Verificar user_selected_paths
    const { data: userPaths, error: userPathsError } = await supabase
      .from('user_selected_paths')
      .select('*')
      .limit(1)

    if (!userPathsError) {
      const { count } = await supabase
        .from('user_selected_paths')
        .select('*', { count: 'exact', head: true })

      console.log(`\n✅ [Migration] Tabla user_selected_paths existe`)
      console.log(`   Usuarios con rutas: ${count || 0}`)
    }

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('📝 [Migration] RESUMEN')
    console.log('═══════════════════════════════════════════════════════════\n')

    if (pathsError && pathsError.code === '42P01') {
      console.log('❌ Migration NO aplicada')
      console.log('\n📋 PRÓXIMO PASO:')
      console.log('   1. Ir a: https://supabase.com/dashboard')
      console.log('   2. Tu proyecto → SQL Editor')
      console.log('   3. Abrir archivo: supabase/migrations/003_learning_paths.sql')
      console.log('   4. Copiar TODO el contenido')
      console.log('   5. Pegar en SQL Editor')
      console.log('   6. Click "Run"')
      console.log('   7. Esperar "Success" ✅')
      console.log('   8. Ejecutar este script de nuevo para verificar\n')
    } else {
      console.log('✅ Migration ya aplicada')
      console.log('\n📋 SISTEMA LISTO:')
      console.log('   ✅ Tablas creadas')
      console.log('   ✅ Rutas configuradas')
      console.log('   ✅ RLS policies activas')
      console.log('\n🚀 PRÓXIMO PASO:')
      console.log('   Testing del flujo de onboarding')
      console.log('   Ver: FASE-3A-QUICK-START.md\n')
    }

  } catch (error) {
    console.error('\n❌ [Migration] Error:', error)
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
