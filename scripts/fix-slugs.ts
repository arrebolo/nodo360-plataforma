/**
 * Slug Standardization Script V2
 *
 * ESTRATEGIA:
 * - COURSES: NO modificar (mantener slugs existentes)
 * - MODULES: Generar desde títulos limpios (sin "Módulo N:")
 * - LESSONS: Generar desde títulos limpios (sin prefijos numéricos o "Lección X.Y:")
 *
 * Usage:
 *   npx tsx scripts/fix-slugs.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

// =====================================================
// SUPABASE CLIENT
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Use admin client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// =====================================================
// TYPES
// =====================================================

interface Course {
  id: string
  title: string
  slug: string
}

interface Module {
  id: string
  title: string
  slug: string | null
  course_id: string
}

interface Lesson {
  id: string
  title: string
  slug: string
  module_id: string
}

interface SlugChange {
  id: string
  title: string
  cleanedTitle: string
  oldSlug: string | null
  newSlug: string
  changed: boolean
}

interface BackupData {
  timestamp: string
  courses: Course[]
  modules: Module[]
  lessons: Lesson[]
}

// =====================================================
// TITLE CLEANING
// =====================================================

/**
 * Clean module title by removing "Módulo N:" prefix
 * Examples:
 *   "Módulo 1: Introducción" → "Introducción"
 *   "Módulo 2" → "Módulo 2"
 */
function cleanModuleTitle(title: string): string {
  // Remove "Módulo N:" or "Módulo N -" prefix
  return title
    .replace(/^Módulo\s+\d+\s*[:\-]\s*/i, '')
    .trim()
}

/**
 * Clean lesson title by removing prefixes and suffixes
 * Examples:
 *   "Lección 1.1: ¿Qué es Blockchain?" → "¿Qué es Blockchain?"
 *   "01 - ¿Qué es Bitcoin?" → "¿Qué es Bitcoin?"
 *   "Amenazas Comunes | Tu Primera Wallet - Nodo360" → "Amenazas Comunes"
 *   "Transacciones Bitcoin - Bitcoin desde Cero | Nodo360" → "Transacciones Bitcoin"
 *   "¿Qué es Bitcoin? - Bitcoin desde Cero | Nodo360" → "¿Qué es Bitcoin?"
 */
function cleanLessonTitle(title: string): string {
  return title
    // Remove "Lección X.Y:" or "Lección X:"
    .replace(/^Lección\s+\d+\.?\d*\s*[:\-]\s*/i, '')
    // Remove "X.Y -" or "X.Y:"
    .replace(/^\d+\.\d+\s*[:\-]\s*/, '')
    // Remove "01 -" or "1 -"
    .replace(/^\d+\s*[:\-]\s*/, '')
    // Remove any suffix after " | " (pipe)
    .replace(/\s*\|.*$/, '')
    // Remove any suffix after " - " that looks like a course name
    // (contains capitalized words or "Nodo360")
    .replace(/\s*-\s+[A-Z].*$/, '')
    .trim()
}

// =====================================================
// SLUG GENERATION
// =====================================================

/**
 * Generate standardized slug from text
 * - Removes accents (á→a, é→e, etc.)
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 */
function generateSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// =====================================================
// BACKUP
// =====================================================

async function createBackup(courses: Course[], modules: Module[], lessons: Lesson[]): Promise<string> {
  const backupData: BackupData = {
    timestamp: new Date().toISOString(),
    courses,
    modules,
    lessons,
  }

  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const filename = `slug-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const filepath = path.join(backupDir, filename)

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2))

  return filepath
}

// =====================================================
// DATA FETCHING
// =====================================================

async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug')
    .order('title')

  if (error) {
    console.error('❌ Error fetching courses:', error)
    return []
  }

  return data || []
}

async function fetchModules(): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id, title, slug, course_id')
    .order('order_index')

  if (error) {
    console.error('❌ Error fetching modules:', error)
    console.error('   Asegúrate de haber agregado la columna slug a la tabla modules')
    return []
  }

  return data || []
}

async function fetchLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, slug, module_id')
    .order('title')

  if (error) {
    console.error('❌ Error fetching lessons:', error)
    return []
  }

  return data || []
}

// =====================================================
// SLUG ANALYSIS
// =====================================================

function analyzeModuleChanges(modules: Module[]): SlugChange[] {
  const changes: SlugChange[] = []

  for (const module of modules) {
    const cleanedTitle = cleanModuleTitle(module.title)
    const newSlug = generateSlug(cleanedTitle)
    const changed = module.slug !== newSlug

    changes.push({
      id: module.id,
      title: module.title,
      cleanedTitle,
      oldSlug: module.slug,
      newSlug,
      changed,
    })
  }

  return changes
}

function analyzeLessonChanges(lessons: Lesson[]): SlugChange[] {
  const changes: SlugChange[] = []

  for (const lesson of lessons) {
    const cleanedTitle = cleanLessonTitle(lesson.title)
    const newSlug = generateSlug(cleanedTitle)
    const changed = lesson.slug !== newSlug

    changes.push({
      id: lesson.id,
      title: lesson.title,
      cleanedTitle,
      oldSlug: lesson.slug,
      newSlug,
      changed,
    })
  }

  return changes
}

// =====================================================
// PREVIEW DISPLAY
// =====================================================

function displayPreview(modulesChanges: SlugChange[], lessonsChanges: SlugChange[]): void {
  console.log('\n' + '='.repeat(80))
  console.log('📋 PREVIEW DE CAMBIOS')
  console.log('='.repeat(80))

  // Modules
  const modulesChanged = modulesChanges.filter((c) => c.changed)
  console.log(`\n📦 MODULES (${modulesChanged.length} cambios de ${modulesChanges.length} totales)`)
  console.log('-'.repeat(80))
  if (modulesChanged.length > 0) {
    modulesChanged.forEach((change) => {
      console.log(`\n  Título original: ${change.title}`)
      console.log(`  Título limpio:   ${change.cleanedTitle}`)
      console.log(`  Slug antes:      ${change.oldSlug || '(sin slug)'}`)
      console.log(`  Slug después:    ${change.newSlug}`)
    })
  } else {
    console.log('  ✅ No hay cambios necesarios')
  }

  // Lessons
  const lessonsChanged = lessonsChanges.filter((c) => c.changed)
  console.log(`\n📄 LESSONS (${lessonsChanged.length} cambios de ${lessonsChanges.length} totales)`)
  console.log('-'.repeat(80))

  if (lessonsChanged.length > 0) {
    // Show first 10 examples
    const examples = lessonsChanged.slice(0, 10)
    examples.forEach((change) => {
      console.log(`\n  Título original: ${change.title}`)
      console.log(`  Título limpio:   ${change.cleanedTitle}`)
      console.log(`  Slug antes:      ${change.oldSlug || '(sin slug)'}`)
      console.log(`  Slug después:    ${change.newSlug}`)
    })

    if (lessonsChanged.length > 10) {
      console.log(`\n  ... y ${lessonsChanged.length - 10} cambios más`)
    }
  } else {
    console.log('  ✅ No hay cambios necesarios')
  }

  // Summary
  const totalChanges = modulesChanged.length + lessonsChanged.length
  const totalItems = modulesChanges.length + lessonsChanges.length

  console.log('\n' + '='.repeat(80))
  console.log('📊 RESUMEN')
  console.log('='.repeat(80))
  console.log(`Total de items: ${totalItems}`)
  console.log(`Cambios necesarios: ${totalChanges}`)
  console.log(`Items sin cambios: ${totalItems - totalChanges}`)
  console.log('\n📚 COURSES: NO se modificarán (mantener slugs existentes)')
  console.log('='.repeat(80) + '\n')
}

// =====================================================
// CONFIRMATION
// =====================================================

function askForConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question('¿Deseas aplicar estos cambios? (si/no): ', (answer) => {
      rl.close()
      const normalized = answer.toLowerCase().trim()
      resolve(normalized === 'si' || normalized === 'sí' || normalized === 's' || normalized === 'yes' || normalized === 'y')
    })
  })
}

// =====================================================
// DATABASE UPDATE
// =====================================================

async function updateSlugs(
  modulesChanges: SlugChange[],
  lessonsChanges: SlugChange[]
): Promise<void> {
  console.log('\n🔄 Aplicando cambios...\n')

  let successCount = 0
  let errorCount = 0

  // Update modules
  const modulesToUpdate = modulesChanges.filter((c) => c.changed)
  if (modulesToUpdate.length > 0) {
    console.log('📦 Actualizando modules...')
    for (const change of modulesToUpdate) {
      const { error } = await supabase
        .from('modules')
        .update({ slug: change.newSlug })
        .eq('id', change.id)

      if (error) {
        console.error(`❌ Error updating module "${change.title}":`, error.message)
        errorCount++
      } else {
        console.log(`✅ Module: ${change.title} → ${change.newSlug}`)
        successCount++
      }
    }
  }

  // Update lessons
  const lessonsToUpdate = lessonsChanges.filter((c) => c.changed)
  if (lessonsToUpdate.length > 0) {
    console.log('\n📄 Actualizando lessons...')
    for (const change of lessonsToUpdate) {
      const { error } = await supabase
        .from('lessons')
        .update({ slug: change.newSlug })
        .eq('id', change.id)

      if (error) {
        console.error(`❌ Error updating lesson "${change.title}":`, error.message)
        errorCount++
      } else {
        console.log(`✅ Lesson: ${change.cleanedTitle} → ${change.newSlug}`)
        successCount++
      }
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(80))
  console.log('✨ REPORTE FINAL')
  console.log('='.repeat(80))
  console.log(`✅ Actualizaciones exitosas: ${successCount}`)
  console.log(`❌ Errores: ${errorCount}`)
  console.log('='.repeat(80) + '\n')

  if (errorCount === 0) {
    console.log('🎉 ¡Todos los slugs fueron actualizados exitosamente!\n')
  } else {
    console.log('⚠️  Algunos slugs no pudieron ser actualizados. Revisa los errores arriba.\n')
  }
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('='.repeat(80))
  console.log('🔧 SCRIPT DE ESTANDARIZACIÓN DE SLUGS V2')
  console.log('='.repeat(80))
  console.log('\nESTRATEGIA:')
  console.log('  📚 COURSES: NO modificar (mantener slugs existentes)')
  console.log('  📦 MODULES: Generar desde títulos limpios (sin "Módulo N:")')
  console.log('  📄 LESSONS: Generar desde títulos limpios (sin prefijos)')
  console.log('\nReglas de limpieza:')
  console.log('  • Modules: "Módulo 1: Introducción" → "Introducción" → "introduccion"')
  console.log('  • Lessons: "Lección 1.1: ¿Qué es?" → "¿Qué es?" → "que-es"')
  console.log('\nReglas de slugificación:')
  console.log('  • Eliminar acentos (á→a, é→e, etc.)')
  console.log('  • Convertir a lowercase')
  console.log('  • Reemplazar espacios por guiones')
  console.log('  • Eliminar caracteres especiales')
  console.log('='.repeat(80))

  // Fetch data
  console.log('\n📥 Obteniendo datos de Supabase...\n')
  const courses = await fetchCourses()
  const modules = await fetchModules()
  const lessons = await fetchLessons()

  console.log(`✓ Courses: ${courses.length}`)
  console.log(`✓ Modules: ${modules.length}`)
  console.log(`✓ Lessons: ${lessons.length}`)

  if (modules.length === 0) {
    console.error('\n❌ No se encontraron módulos.')
    console.error('   Si el error dice "column modules.slug does not exist":')
    console.error('   Ejecuta este SQL en Supabase Dashboard:\n')
    console.error('   ALTER TABLE modules ADD COLUMN IF NOT EXISTS slug TEXT;')
    console.error('   CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);\n')
    process.exit(1)
  }

  // Create backup
  console.log('\n💾 Creando backup de datos actuales...')
  const backupPath = await createBackup(courses, modules, lessons)
  console.log(`✅ Backup guardado en: ${backupPath}`)

  // Analyze changes (only modules and lessons, NOT courses)
  const modulesChanges = analyzeModuleChanges(modules)
  const lessonsChanges = analyzeLessonChanges(lessons)

  // Display preview
  displayPreview(modulesChanges, lessonsChanges)

  // Check if there are any changes
  const totalChanges =
    modulesChanges.filter((c) => c.changed).length +
    lessonsChanges.filter((c) => c.changed).length

  if (totalChanges === 0) {
    console.log('✨ No hay cambios necesarios. Todos los slugs ya están estandarizados.\n')
    process.exit(0)
  }

  // Ask for confirmation
  const confirmed = await askForConfirmation()

  if (!confirmed) {
    console.log('\n❌ Operación cancelada. No se realizaron cambios.\n')
    console.log(`💾 El backup se mantiene en: ${backupPath}\n`)
    process.exit(0)
  }

  // Update database
  await updateSlugs(modulesChanges, lessonsChanges)
}

// Run script
main().catch((error) => {
  console.error('\n💥 Error fatal:', error)
  process.exit(1)
})
