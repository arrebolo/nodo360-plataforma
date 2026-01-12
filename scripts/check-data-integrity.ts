/**
 * Script de Verificación de Integridad de Datos
 *
 * Verifica la consistencia de la base de datos:
 * - Cursos publicados sin instructor
 * - Slugs duplicados
 * - Progreso huérfano
 * - Certificados duplicados
 * - Lecciones sin módulo
 * - Módulos sin curso
 *
 * Uso: npx tsx scripts/check-data-integrity.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface IntegrityIssue {
  type: 'error' | 'warning'
  category: string
  message: string
  count: number
  details?: string[]
}

const issues: IntegrityIssue[] = []

function addIssue(
  type: 'error' | 'warning',
  category: string,
  message: string,
  count: number,
  details?: string[]
) {
  issues.push({ type, category, message, count, details })
}

async function checkPublishedCoursesWithoutInstructor() {
  console.log('Verificando cursos publicados sin instructor...')

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('status', 'published')
    .is('instructor_id', null)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (data && data.length > 0) {
    addIssue(
      'error',
      'Cursos',
      'Cursos publicados sin instructor asignado',
      data.length,
      data.map(c => `${c.title} (${c.slug})`)
    )
  } else {
    console.log('  ✓ Todos los cursos publicados tienen instructor')
  }
}

async function checkDuplicateSlugs() {
  console.log('Verificando slugs duplicados en cursos...')

  const { data: courses } = await supabase
    .from('courses')
    .select('slug')

  if (!courses) return

  const slugCounts = courses.reduce((acc, c) => {
    acc[c.slug] = (acc[c.slug] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const duplicates = Object.entries(slugCounts)
    .filter(([, count]) => count > 1)
    .map(([slug, count]) => `"${slug}" (${count} veces)`)

  if (duplicates.length > 0) {
    addIssue(
      'error',
      'Cursos',
      'Slugs duplicados detectados',
      duplicates.length,
      duplicates
    )
  } else {
    console.log('  ✓ No hay slugs duplicados en cursos')
  }
}

async function checkDuplicateLessonSlugs() {
  console.log('Verificando slugs duplicados en lecciones (por módulo)...')

  const { data: lessons } = await supabase
    .from('lessons')
    .select('module_id, slug')

  if (!lessons) return

  const slugsByModule = lessons.reduce((acc, l) => {
    const key = `${l.module_id}-${l.slug}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const duplicates = Object.entries(slugsByModule)
    .filter(([, count]) => count > 1)
    .map(([key, count]) => `${key} (${count} veces)`)

  if (duplicates.length > 0) {
    addIssue(
      'warning',
      'Lecciones',
      'Slugs duplicados en mismo módulo',
      duplicates.length,
      duplicates.slice(0, 10) // Limitar a 10
    )
  } else {
    console.log('  ✓ No hay slugs duplicados en lecciones')
  }
}

async function checkOrphanProgress() {
  console.log('Verificando progreso huérfano...')

  // Obtener todos los lesson_ids de user_progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('id, lesson_id')

  if (!progress || progress.length === 0) {
    console.log('  ✓ No hay registros de progreso')
    return
  }

  // Obtener todos los lesson_ids válidos
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')

  if (!lessons) return

  const validLessonIds = new Set(lessons.map(l => l.id))
  const orphans = progress.filter(p => !validLessonIds.has(p.lesson_id))

  if (orphans.length > 0) {
    addIssue(
      'warning',
      'Progreso',
      'Registros de progreso para lecciones que no existen',
      orphans.length,
      [`IDs: ${orphans.slice(0, 5).map(o => o.id).join(', ')}...`]
    )
  } else {
    console.log('  ✓ No hay progreso huérfano')
  }
}

async function checkOrphanModules() {
  console.log('Verificando módulos huérfanos...')

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, course_id')

  if (!modules) return

  const { data: courses } = await supabase
    .from('courses')
    .select('id')

  if (!courses) return

  const validCourseIds = new Set(courses.map(c => c.id))
  const orphans = modules.filter(m => !validCourseIds.has(m.course_id))

  if (orphans.length > 0) {
    addIssue(
      'error',
      'Módulos',
      'Módulos sin curso válido',
      orphans.length,
      orphans.map(m => m.title)
    )
  } else {
    console.log('  ✓ No hay módulos huérfanos')
  }
}

async function checkOrphanLessons() {
  console.log('Verificando lecciones huérfanas...')

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, module_id')

  if (!lessons) return

  const { data: modules } = await supabase
    .from('modules')
    .select('id')

  if (!modules) return

  const validModuleIds = new Set(modules.map(m => m.id))
  const orphans = lessons.filter(l => !validModuleIds.has(l.module_id))

  if (orphans.length > 0) {
    addIssue(
      'error',
      'Lecciones',
      'Lecciones sin módulo válido',
      orphans.length,
      orphans.map(l => l.title)
    )
  } else {
    console.log('  ✓ No hay lecciones huérfanas')
  }
}

async function checkDuplicateCertificates() {
  console.log('Verificando certificados duplicados...')

  const { data: certs } = await supabase
    .from('certificates')
    .select('user_id, course_id, module_id, type')

  if (!certs || certs.length === 0) {
    console.log('  ✓ No hay certificados')
    return
  }

  const certKeys = certs.map(c =>
    `${c.user_id}-${c.course_id}-${c.module_id || 'null'}-${c.type}`
  )

  const counts = certKeys.reduce((acc, key) => {
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const duplicates = Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([key, count]) => `${key} (${count} veces)`)

  if (duplicates.length > 0) {
    addIssue(
      'warning',
      'Certificados',
      'Certificados duplicados detectados',
      duplicates.length,
      duplicates.slice(0, 5)
    )
  } else {
    console.log('  ✓ No hay certificados duplicados')
  }
}

async function checkDuplicateEnrollments() {
  console.log('Verificando enrollments duplicados...')

  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('user_id, course_id')

  if (!enrollments || enrollments.length === 0) {
    console.log('  ✓ No hay enrollments')
    return
  }

  const keys = enrollments.map(e => `${e.user_id}-${e.course_id}`)
  const counts = keys.reduce((acc, key) => {
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const duplicates = Object.entries(counts)
    .filter(([, count]) => count > 1)

  if (duplicates.length > 0) {
    addIssue(
      'warning',
      'Enrollments',
      'Inscripciones duplicadas detectadas',
      duplicates.length
    )
  } else {
    console.log('  ✓ No hay enrollments duplicados')
  }
}

async function checkEmptyModules() {
  console.log('Verificando módulos vacíos en cursos publicados...')

  const { data: publishedCourses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('status', 'published')

  if (!publishedCourses) return

  const emptyModules: string[] = []

  for (const course of publishedCourses) {
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', course.id)

    if (!modules) continue

    for (const mod of modules) {
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('module_id', mod.id)

      if (count === 0) {
        emptyModules.push(`${course.title} > ${mod.title}`)
      }
    }
  }

  if (emptyModules.length > 0) {
    addIssue(
      'warning',
      'Módulos',
      'Módulos vacíos en cursos publicados',
      emptyModules.length,
      emptyModules.slice(0, 10)
    )
  } else {
    console.log('  ✓ No hay módulos vacíos en cursos publicados')
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   VERIFICACIÓN DE INTEGRIDAD DE DATOS          ║')
  console.log('║   Nodo360 Platform                             ║')
  console.log('╚════════════════════════════════════════════════╝\n')

  try {
    // Ejecutar todas las verificaciones
    await checkPublishedCoursesWithoutInstructor()
    await checkDuplicateSlugs()
    await checkDuplicateLessonSlugs()
    await checkOrphanProgress()
    await checkOrphanModules()
    await checkOrphanLessons()
    await checkDuplicateCertificates()
    await checkDuplicateEnrollments()
    await checkEmptyModules()

    // Resumen
    console.log('\n════════════════════════════════════════════════')
    console.log('RESUMEN')
    console.log('════════════════════════════════════════════════\n')

    const errors = issues.filter(i => i.type === 'error')
    const warnings = issues.filter(i => i.type === 'warning')

    if (issues.length === 0) {
      console.log('✅ INTEGRIDAD OK - No se encontraron problemas\n')
    } else {
      if (errors.length > 0) {
        console.log(`❌ ERRORES: ${errors.length}`)
        errors.forEach(e => {
          console.log(`   • [${e.category}] ${e.message} (${e.count})`)
          e.details?.slice(0, 3).forEach(d => console.log(`     - ${d}`))
        })
        console.log()
      }

      if (warnings.length > 0) {
        console.log(`⚠️  ADVERTENCIAS: ${warnings.length}`)
        warnings.forEach(w => {
          console.log(`   • [${w.category}] ${w.message} (${w.count})`)
          w.details?.slice(0, 3).forEach(d => console.log(`     - ${d}`))
        })
        console.log()
      }
    }

    // Exit code basado en errores
    process.exit(errors.length > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Error ejecutando verificación:', error)
    process.exit(1)
  }
}

main()
