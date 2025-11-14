/**
 * Script de Migración de Contenido
 *
 * Migra todo el contenido desde nodo360-cursos a nodo360-plataforma
 * - Lee lecciones TSX del proyecto antiguo
 * - Parsea contenido a JSON
 * - Inserta en Supabase
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CURSOS_DIR = 'C:\\Users\\alber\\nodo360-projects\\nodo360-cursos\\nodo360-cursos-main\\app\\cursos'

// Validar variables de entorno
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: Faltan variables de entorno')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Definición de cursos a migrar
const CURSOS = [
  {
    slug: 'bitcoin-desde-cero',
    title: 'Bitcoin Desde Cero',
    description: 'Aprende Bitcoin desde los fundamentos hasta conceptos avanzados',
    level: 'beginner' as const,
    is_free: true,
    modulos: 3
  },
  {
    slug: 'primera-wallet',
    title: 'Tu Primera Wallet',
    description: 'Aprende a usar tu primera wallet de Bitcoin de forma segura',
    level: 'beginner' as const,
    is_free: true,
    modulos: 4
  },
  {
    slug: 'fundamentos-blockchain',
    title: 'Fundamentos de Blockchain',
    description: 'Comprende cómo funciona la tecnología blockchain',
    level: 'intermediate' as const,
    is_free: true,
    modulos: 3
  }
]

// Estadísticas
let stats = {
  cursos: 0,
  modulos: 0,
  lecciones: 0,
  errores: [] as string[]
}

/**
 * Función principal de migración
 */
async function migrate() {
  console.log('\n🚀 INICIANDO MIGRACIÓN DE CONTENIDO')
  console.log('=====================================\n')

  // Verificar conexión a Supabase
  console.log('📡 Verificando conexión a Supabase...')
  const { error: connError } = await supabase.from('courses').select('count').limit(1)

  if (connError) {
    console.error('❌ Error de conexión a Supabase:', connError.message)
    process.exit(1)
  }
  console.log('✅ Conexión exitosa\n')

  // Verificar directorio de origen
  if (!fs.existsSync(CURSOS_DIR)) {
    console.error(`❌ ERROR: No existe el directorio: ${CURSOS_DIR}`)
    process.exit(1)
  }
  console.log(`✅ Directorio de origen encontrado: ${CURSOS_DIR}\n`)

  // Migrar cada curso
  for (const curso of CURSOS) {
    await migrarCurso(curso)
  }

  // Resumen final
  console.log('\n\n📊 RESUMEN DE MIGRACIÓN')
  console.log('=======================')
  console.log(`✅ Cursos creados: ${stats.cursos}`)
  console.log(`✅ Módulos creados: ${stats.modulos}`)
  console.log(`✅ Lecciones creadas: ${stats.lecciones}`)

  if (stats.errores.length > 0) {
    console.log(`\n⚠️  Errores encontrados: ${stats.errores.length}`)
    stats.errores.forEach(err => console.log(`   - ${err}`))
  }

  console.log('\n✨ Migración completada!\n')
}

/**
 * Migrar un curso completo
 */
async function migrarCurso(cursoInfo: typeof CURSOS[0]) {
  console.log(`\n📚 Migrando curso: ${cursoInfo.title}`)
  console.log('─'.repeat(50))

  const cursoPath = path.join(CURSOS_DIR, cursoInfo.slug)

  if (!fs.existsSync(cursoPath)) {
    console.log(`⚠️  Carpeta no encontrada: ${cursoPath}`)
    stats.errores.push(`Curso ${cursoInfo.slug} - carpeta no encontrada`)
    return
  }

  // 1. Crear curso en Supabase
  const { data: curso, error: cursoError } = await supabase
    .from('courses')
    .upsert({
      slug: cursoInfo.slug,
      title: cursoInfo.title,
      description: cursoInfo.description,
      level: cursoInfo.level,
      status: 'published',
      is_free: cursoInfo.is_free,
      price: 0
    }, {
      onConflict: 'slug'
    })
    .select()
    .single()

  if (cursoError) {
    console.error(`❌ Error creando curso:`, cursoError.message)
    stats.errores.push(`Curso ${cursoInfo.slug} - ${cursoError.message}`)
    return
  }

  console.log(`✅ Curso creado: ${curso.id}`)
  stats.cursos++

  // 2. Buscar lecciones en el directorio
  const leccionPath = path.join(cursoPath, 'leccion')

  if (!fs.existsSync(leccionPath)) {
    console.log(`⚠️  No se encontró carpeta de lecciones: ${leccionPath}`)
    return
  }

  const lecciones = fs.readdirSync(leccionPath)
    .filter(dir => fs.statSync(path.join(leccionPath, dir)).isDirectory())
    .sort()

  console.log(`📝 Encontradas ${lecciones.length} lecciones`)

  // 3. Agrupar lecciones por módulo
  const leccionesPorModulo: { [key: number]: string[] } = {}

  lecciones.forEach(leccion => {
    const match = leccion.match(/^(\d+)-(\d+)$/)
    if (match) {
      const moduloNum = parseInt(match[1])
      if (!leccionesPorModulo[moduloNum]) {
        leccionesPorModulo[moduloNum] = []
      }
      leccionesPorModulo[moduloNum].push(leccion)
    }
  })

  // 4. Crear módulos y lecciones
  for (const [moduloNumStr, leccionesDelModulo] of Object.entries(leccionesPorModulo)) {
    const moduloNum = parseInt(moduloNumStr)

    // Crear módulo
    const { data: modulo, error: moduloError } = await supabase
      .from('modules')
      .upsert({
        course_id: curso.id,
        title: `Módulo ${moduloNum}`,
        description: `Módulo ${moduloNum} del curso ${cursoInfo.title}`,
        order_index: moduloNum
      }, {
        onConflict: 'course_id,order_index'
      })
      .select()
      .single()

    if (moduloError) {
      console.error(`❌ Error creando módulo ${moduloNum}:`, moduloError.message)
      stats.errores.push(`Módulo ${moduloNum} - ${moduloError.message}`)
      continue
    }

    console.log(`  ✅ Módulo ${moduloNum} creado`)
    stats.modulos++

    // Crear lecciones del módulo
    for (const leccionDir of leccionesDelModulo.sort()) {
      await migrarLeccion(curso.id, modulo.id, cursoInfo.slug, leccionDir, leccionPath)
    }
  }
}

/**
 * Migrar una lección individual
 */
async function migrarLeccion(
  courseId: string,
  moduleId: string,
  courseSlug: string,
  leccionDir: string,
  leccionPath: string
) {
  const match = leccionDir.match(/^(\d+)-(\d+)$/)
  if (!match) {
    console.log(`    ⚠️  Formato inválido: ${leccionDir}`)
    return
  }

  const [, moduloNum, leccionNum] = match
  const leccionFilePath = path.join(leccionPath, leccionDir, 'page.tsx')

  if (!fs.existsSync(leccionFilePath)) {
    console.log(`    ⚠️  Archivo no encontrado: ${leccionFilePath}`)
    stats.errores.push(`Lección ${leccionDir} - archivo no encontrado`)
    return
  }

  try {
    // Leer contenido del archivo
    const content = fs.readFileSync(leccionFilePath, 'utf-8')

    // Extraer título de la metadata
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/i)
    const title = titleMatch ? titleMatch[1].split('|')[0].trim() : `Lección ${moduloNum}.${leccionNum}`

    // Limpiar título (remover "Lección X.Y: ")
    const cleanTitle = title.replace(/^Lección\s+\d+\.\d+:\s*/i, '')

    // Crear slug
    const slug = `leccion-${moduloNum}-${leccionNum}`

    // Calcular order_index (módulo * 10 + lección)
    const orderIndex = parseInt(moduloNum) * 10 + parseInt(leccionNum)

    // Crear lección en Supabase
    const { data: leccion, error: leccionError } = await supabase
      .from('lessons')
      .upsert({
        module_id: moduleId,
        title: cleanTitle,
        description: `Lección ${moduloNum}.${leccionNum} - ${cleanTitle}`,
        slug: slug,
        order_index: orderIndex,
        content: content, // Guardar TSX completo por ahora
        video_duration_minutes: 10, // Placeholder
        is_free_preview: parseInt(moduloNum) === 1 && parseInt(leccionNum) === 1
      }, {
        onConflict: 'module_id,order_index'
      })
      .select()
      .single()

    if (leccionError) {
      console.error(`    ❌ Error creando lección ${leccionDir}:`, leccionError.message)
      stats.errores.push(`Lección ${leccionDir} - ${leccionError.message}`)
      return
    }

    console.log(`    ✅ Lección ${moduloNum}.${leccionNum}: ${cleanTitle}`)
    stats.lecciones++

  } catch (error: any) {
    console.error(`    ❌ Error procesando ${leccionDir}:`, error.message)
    stats.errores.push(`Lección ${leccionDir} - ${error.message}`)
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('✨ Script finalizado exitosamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ ERROR FATAL:', error)
    process.exit(1)
  })
