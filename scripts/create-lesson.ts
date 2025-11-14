/**
 * Script interactivo para crear lecciones en formato JSON
 *
 * Uso:
 *   npx tsx scripts/create-lesson.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'
import type { LessonContent } from '@/types/lesson-content'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Interfaz para inputs del usuario
interface LessonInput {
  title: string
  slug: string
  moduleId: string
  description: string
  estimatedTime: number
  orderIndex: number
  isFreePreview: boolean
  videoUrl?: string
}

// =====================================================
// FUNCIONES DE INTERFAZ
// =====================================================

/**
 * Crea interfaz de readline
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

/**
 * Hace una pregunta y espera respuesta
 */
function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

/**
 * Genera slug a partir del título
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .replace(/^-|-$/g, '') // Eliminar guiones al inicio y final
}

/**
 * Obtiene módulos disponibles
 */
async function getModules() {
  const { data: modules, error } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      order_index,
      course:course_id (
        id,
        title,
        slug
      )
    `)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('❌ Error al obtener módulos:', error)
    return []
  }

  return modules || []
}

/**
 * Muestra módulos disponibles
 */
function displayModules(modules: any[]) {
  console.log('\n📚 Módulos Disponibles:\n')

  let currentCourse = ''
  modules.forEach((module, index) => {
    const courseName = (module.course as any)?.title || 'Sin curso'

    if (courseName !== currentCourse) {
      console.log(`\n🎓 ${courseName}`)
      console.log('─'.repeat(60))
      currentCourse = courseName
    }

    console.log(`  ${index + 1}. [${module.id.substring(0, 8)}...] ${module.title}`)
  })

  console.log('\n' + '='.repeat(60))
}

/**
 * Carga plantilla de lección
 */
function loadTemplate(): LessonContent {
  const templatePath = path.join(process.cwd(), 'templates', 'template-lesson.json')

  if (!fs.existsSync(templatePath)) {
    console.error('❌ No se encontró la plantilla en:', templatePath)
    process.exit(1)
  }

  const templateContent = fs.readFileSync(templatePath, 'utf-8')
  return JSON.parse(templateContent)
}

/**
 * Genera JSON de la lección
 */
function generateLessonJson(input: LessonInput): LessonContent {
  const template = loadTemplate()

  // Modificar la plantilla con datos del usuario
  template.estimatedReadingTime = input.estimatedTime

  // Actualizar el primer heading con el título de la lección
  const firstHeading = template.blocks.find(b => b.type === 'heading')
  if (firstHeading && firstHeading.type === 'heading') {
    firstHeading.text = input.title
  }

  return template
}

/**
 * Genera SQL para insertar la lección
 */
function generateInsertSQL(input: LessonInput, contentJson: LessonContent): string {
  const jsonString = JSON.stringify(contentJson)
    .replace(/'/g, "''") // Escapar comillas simples

  return `
-- Insertar nueva lección: ${input.title}
INSERT INTO lessons (
  module_id,
  title,
  slug,
  description,
  order_index,
  content_json,
  video_url,
  video_duration_minutes,
  is_free_preview,
  created_at,
  updated_at
) VALUES (
  '${input.moduleId}',
  '${input.title.replace(/'/g, "''")}',
  '${input.slug}',
  '${input.description.replace(/'/g, "''")}',
  ${input.orderIndex},
  '${jsonString}'::jsonb,
  ${input.videoUrl ? `'${input.videoUrl}'` : 'NULL'},
  ${input.estimatedTime},
  ${input.isFreePreview},
  NOW(),
  NOW()
);

-- Verificar inserción
SELECT id, title, slug, created_at
FROM lessons
WHERE slug = '${input.slug}';
`.trim()
}

/**
 * Guarda archivos de salida
 */
function saveOutputFiles(input: LessonInput, contentJson: LessonContent, sql: string) {
  const outputDir = path.join(process.cwd(), 'output-lessons')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
  const baseFilename = `${input.slug}-${timestamp}`

  // Guardar JSON
  const jsonPath = path.join(outputDir, `${baseFilename}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(contentJson, null, 2))
  console.log(`\n✅ JSON guardado: ${jsonPath}`)

  // Guardar SQL
  const sqlPath = path.join(outputDir, `${baseFilename}.sql`)
  fs.writeFileSync(sqlPath, sql)
  console.log(`✅ SQL guardado: ${sqlPath}`)

  return { jsonPath, sqlPath }
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function main() {
  console.log('🚀 CREADOR DE LECCIONES - Nodo360')
  console.log('='.repeat(60))
  console.log('\nEste script te ayudará a crear una nueva lección paso a paso.\n')

  const rl = createInterface()

  try {
    // 1. Obtener y mostrar módulos
    console.log('📊 Obteniendo módulos disponibles...')
    const modules = await getModules()

    if (modules.length === 0) {
      console.log('❌ No se encontraron módulos. Crea un módulo primero.')
      rl.close()
      return
    }

    displayModules(modules)

    // 2. Recopilar información de la lección
    const input: LessonInput = {
      title: '',
      slug: '',
      moduleId: '',
      description: '',
      estimatedTime: 0,
      orderIndex: 0,
      isFreePreview: false
    }

    // Título
    input.title = await ask(rl, '\n📝 Título de la lección: ')
    if (!input.title) {
      console.log('❌ El título es requerido')
      rl.close()
      return
    }

    // Slug (auto-generado o manual)
    const suggestedSlug = generateSlug(input.title)
    const customSlug = await ask(rl, `🔗 Slug [Enter para usar "${suggestedSlug}"]: `)
    input.slug = customSlug || suggestedSlug

    // Descripción
    input.description = await ask(rl, '📄 Descripción breve: ')

    // Módulo ID
    const moduleNumber = await ask(rl, '\n🎯 Número del módulo (según la lista): ')
    const selectedModule = modules[parseInt(moduleNumber) - 1]

    if (!selectedModule) {
      console.log('❌ Módulo no válido')
      rl.close()
      return
    }

    input.moduleId = selectedModule.id
    console.log(`✅ Módulo seleccionado: ${selectedModule.title}`)

    // Orden
    const orderInput = await ask(rl, '\n📍 Orden dentro del módulo (número): ')
    input.orderIndex = parseInt(orderInput) || 1

    // Tiempo estimado
    const timeInput = await ask(rl, '⏱️  Tiempo estimado de lectura (minutos): ')
    input.estimatedTime = parseInt(timeInput) || 10

    // Preview gratuito
    const previewInput = await ask(rl, '🆓 ¿Es preview gratuito? (si/no) [no]: ')
    input.isFreePreview = previewInput.toLowerCase() === 'si' || previewInput.toLowerCase() === 's'

    // Video URL (opcional)
    const videoInput = await ask(rl, '📹 URL del video (opcional, Enter para omitir): ')
    if (videoInput) {
      input.videoUrl = videoInput
    }

    rl.close()

    // 3. Generar JSON
    console.log('\n🔄 Generando JSON de la lección...')
    const contentJson = generateLessonJson(input)

    // 4. Generar SQL
    console.log('🔄 Generando SQL INSERT...')
    const sql = generateInsertSQL(input, contentJson)

    // 5. Mostrar preview
    console.log('\n' + '='.repeat(60))
    console.log('📋 PREVIEW DE LA LECCIÓN')
    console.log('='.repeat(60))
    console.log(`\nTítulo: ${input.title}`)
    console.log(`Slug: ${input.slug}`)
    console.log(`Módulo: ${selectedModule.title}`)
    console.log(`Descripción: ${input.description}`)
    console.log(`Orden: ${input.orderIndex}`)
    console.log(`Tiempo: ${input.estimatedTime} min`)
    console.log(`Preview gratuito: ${input.isFreePreview ? 'Sí' : 'No'}`)
    if (input.videoUrl) {
      console.log(`Video: ${input.videoUrl}`)
    }
    console.log(`\nBloques: ${contentJson.blocks.length}`)
    console.log(`Recursos: ${contentJson.resources.length}`)

    // 6. Guardar archivos
    const { jsonPath, sqlPath } = saveOutputFiles(input, contentJson, sql)

    // 7. Instrucciones finales
    console.log('\n' + '='.repeat(60))
    console.log('✅ LECCIÓN CREADA EXITOSAMENTE')
    console.log('='.repeat(60))
    console.log('\n📝 Próximos pasos:')
    console.log('\n1. Edita el contenido JSON:')
    console.log(`   code ${jsonPath}`)
    console.log('\n2. Cuando estés listo, ejecuta el SQL en Supabase:')
    console.log(`   - Abre Supabase Dashboard -> SQL Editor`)
    console.log(`   - Copia el contenido de: ${sqlPath}`)
    console.log(`   - Ejecuta el SQL`)
    console.log('\n3. Verifica la lección en:')
    console.log(`   http://localhost:3000/cursos/CURSO-SLUG/${input.slug}`)
    console.log('\n' + '='.repeat(60))

    console.log('\n💡 Tip: Consulta docs/CREATE-LESSON.md para más información sobre tipos de bloques.')
    console.log('\n🎉 ¡Buena suerte con tu nueva lección!')

  } catch (error) {
    console.error('\n💥 Error:', error)
    rl.close()
    process.exit(1)
  }
}

// Ejecutar script
main().catch(console.error)
