/**
 * Script de Verificación de Migración
 *
 * Verifica el estado antes y después de la migración
 *
 * Uso:
 *   npx tsx scripts/verify-migration.ts pre   - Verificación antes de migrar
 *   npx tsx scripts/verify-migration.ts post  - Verificación después de migrar
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CURSOS_DIR = 'C:\\Users\\alber\\nodo360-projects\\nodo360-cursos\\nodo360-cursos-main\\app\\cursos'

const mode = process.argv[2] || 'pre'

async function verify() {
  console.log(`\n🔍 VERIFICACIÓN ${mode.toUpperCase()}-MIGRACIÓN`)
  console.log('='.repeat(50))

  if (mode === 'pre') {
    await verifyPre()
  } else if (mode === 'post') {
    await verifyPost()
  } else {
    console.error('❌ Modo inválido. Usa: pre o post')
    process.exit(1)
  }
}

async function verifyPre() {
  console.log('\n📋 Checklist Pre-Migración:\n')

  // 1. Variables de entorno
  console.log('1️⃣  Variables de Entorno')
  const hasUrl = !!SUPABASE_URL
  const hasKey = !!SUPABASE_SERVICE_KEY

  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? '✅' : '❌'}`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${hasKey ? '✅' : '❌'}`)

  if (!hasUrl || !hasKey) {
    console.log('\n❌ Faltan variables de entorno. Configura .env.local primero.')
    process.exit(1)
  }

  // 2. Conexión a Supabase
  console.log('\n2️⃣  Conexión a Supabase')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: connTest, error: connError } = await supabase
    .from('courses')
    .select('count')
    .limit(1)

  if (connError) {
    console.log(`   ❌ Error de conexión: ${connError.message}`)
    process.exit(1)
  }
  console.log('   ✅ Conexión exitosa')

  // 3. Verificar tablas existen
  console.log('\n3️⃣  Tablas de Supabase')
  const tables = ['courses', 'modules', 'lessons']

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1)
    console.log(`   ${table}: ${error ? '❌' : '✅'}`)
  }

  // 4. Directorio de origen
  console.log('\n4️⃣  Directorio de Origen')
  const exists = fs.existsSync(CURSOS_DIR)
  console.log(`   ${CURSOS_DIR}`)
  console.log(`   ${exists ? '✅' : '❌'} ${exists ? 'Existe' : 'No encontrado'}`)

  if (!exists) {
    console.log('\n❌ Directorio de origen no encontrado. Verifica la ruta.')
    process.exit(1)
  }

  // 5. Contar lecciones disponibles
  console.log('\n5️⃣  Contenido Disponible')

  const cursos = ['bitcoin-desde-cero', 'primera-wallet', 'fundamentos-blockchain']
  let totalLecciones = 0

  for (const curso of cursos) {
    const cursoPath = `${CURSOS_DIR}\\${curso}\\leccion`
    if (fs.existsSync(cursoPath)) {
      const lecciones = fs.readdirSync(cursoPath).filter(dir =>
        fs.statSync(`${cursoPath}\\${dir}`).isDirectory()
      )
      console.log(`   📚 ${curso}: ${lecciones.length} lecciones`)
      totalLecciones += lecciones.length
    } else {
      console.log(`   ⚠️  ${curso}: carpeta no encontrada`)
    }
  }

  console.log(`\n   TOTAL: ${totalLecciones} lecciones para migrar`)

  // Resumen
  console.log('\n' + '='.repeat(50))
  console.log('✅ PRE-MIGRACIÓN: LISTO PARA EJECUTAR')
  console.log('\nSiguiente paso: npx tsx scripts/migrate-content-from-cursos.ts')
  console.log('')
}

async function verifyPost() {
  console.log('\n📊 Resultados Post-Migración:\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 1. Contar cursos
  console.log('1️⃣  Cursos')
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, slug, title')

  if (coursesError) {
    console.error('   ❌ Error:', coursesError.message)
  } else {
    console.log(`   ✅ Total: ${courses?.length || 0} cursos`)
    courses?.forEach(c => console.log(`      - ${c.slug}: ${c.title}`))
  }

  // 2. Contar módulos
  console.log('\n2️⃣  Módulos')
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, course_id')

  if (modulesError) {
    console.error('   ❌ Error:', modulesError.message)
  } else {
    console.log(`   ✅ Total: ${modules?.length || 0} módulos`)
  }

  // 3. Contar lecciones
  console.log('\n3️⃣  Lecciones')
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, slug, module_id')

  if (lessonsError) {
    console.error('   ❌ Error:', lessonsError.message)
  } else {
    console.log(`   ✅ Total: ${lessons?.length || 0} lecciones`)
  }

  // 4. Lecciones por curso
  console.log('\n4️⃣  Distribución por Curso')
  if (courses && modules && lessons) {
    for (const course of courses) {
      const courseModules = modules.filter(m => m.course_id === course.id)
      const moduleIds = courseModules.map(m => m.id)
      const courseLessons = lessons.filter(l => moduleIds.includes(l.module_id))

      console.log(`   📚 ${course.title}:`)
      console.log(`      Módulos: ${courseModules.length}`)
      console.log(`      Lecciones: ${courseLessons.length}`)
    }
  }

  // 5. Verificar integridad
  console.log('\n5️⃣  Verificación de Integridad')

  let issues = 0

  // Módulos sin curso
  if (modules) {
    const orphanModules = modules.filter(m =>
      !courses?.some(c => c.id === m.course_id)
    )
    if (orphanModules.length > 0) {
      console.log(`   ⚠️  ${orphanModules.length} módulos sin curso`)
      issues++
    }
  }

  // Lecciones sin módulo
  if (lessons && modules) {
    const orphanLessons = lessons.filter(l =>
      !modules.some(m => m.id === l.module_id)
    )
    if (orphanLessons.length > 0) {
      console.log(`   ⚠️  ${orphanLessons.length} lecciones sin módulo`)
      issues++
    }
  }

  if (issues === 0) {
    console.log('   ✅ Sin problemas de integridad')
  }

  // Resumen final
  console.log('\n' + '='.repeat(50))
  console.log('✅ POST-MIGRACIÓN: VERIFICACIÓN COMPLETADA')

  const totalItems = (courses?.length || 0) + (modules?.length || 0) + (lessons?.length || 0)
  console.log(`\nTotal elementos en base de datos: ${totalItems}`)

  if (issues > 0) {
    console.log(`⚠️  ${issues} problemas de integridad encontrados`)
  }

  console.log('')
}

// Ejecutar
verify()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  })


