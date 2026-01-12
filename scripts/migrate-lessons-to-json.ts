/**
 * Script de migración automática de lecciones HTML → JSON
 *
 * Convierte las lecciones del formato HTML antiguo al nuevo formato JSON estructurado
 *
 * Uso:
 *   npx tsx scripts/migrate-lessons-to-json.ts
 *   npx tsx scripts/migrate-lessons-to-json.ts --preview-only  (solo ver preview sin actualizar)
 *   npx tsx scripts/migrate-lessons-to-json.ts --batch          (migrar todas sin confirmación individual)
 */

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import * as dotenv from 'dotenv'
import * as readline from 'readline'
import type { LessonContent, ContentBlock } from '@/types/lesson-content'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Interfaz para lección de BD
interface Lesson {
  id: string
  title: string
  slug: string
  content: string | null
  content_json: any | null
}

// Interfaz para conversión
interface LessonConversion {
  id: string
  title: string
  slug: string
  contentJson: LessonContent
  originalHtml: string
  stats: {
    totalBlocks: number
    blockTypes: Record<string, number>
    estimatedReadingTime: number
    contentLength: number
  }
}

// =====================================================
// FUNCIONES DE CONVERSIÓN HTML → JSON
// =====================================================

/**
 * Convierte HTML a JSON estructurado
 */
function convertHtmlToJson(html: string | null, lessonTitle: string): LessonContent {
  if (!html || html.trim() === '') {
    // Si no hay contenido, crear un bloque básico
    return {
      version: '1.0',
      estimatedReadingTime: 1,
      blocks: [
        {
          id: 'para-1',
          type: 'paragraph',
          text: `Contenido de la lección: ${lessonTitle}`
        }
      ],
      resources: []
    }
  }

  const $ = cheerio.load(html)
  const blocks: ContentBlock[] = []
  let blockCounter = 0

  // Función para generar ID único
  const generateId = (type: string): string => {
    blockCounter++
    return `${type}-${blockCounter}`
  }

  // Función para limpiar texto
  const cleanText = (text: string): string => {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
  }

  // Parsear elementos del HTML
  $('body').children().each((i, elem) => {
    const $elem = $(elem)
    const tagName = elem.name

    // Headings: h1, h2, h3, h4, h5, h6
    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1]) as 1 | 2 | 3 | 4 | 5 | 6
      const text = cleanText($elem.text())
      if (text) {
        blocks.push({
          id: generateId('heading'),
          type: 'heading',
          level: level <= 3 ? (level as 1 | 2 | 3) : 3,
          text
        })
      }
    }

    // Párrafos
    else if (tagName === 'p') {
      const text = cleanText($elem.text())
      if (text && text.length > 0) {
        blocks.push({
          id: generateId('para'),
          type: 'paragraph',
          text
        })
      }
    }

    // Listas: ul, ol
    else if (tagName === 'ul' || tagName === 'ol') {
      const items = $elem.find('li').map((_, li) => {
        return cleanText($(li).text())
      }).get().filter(item => item.length > 0)

      if (items.length > 0) {
        blocks.push({
          id: generateId('list'),
          type: 'list',
          style: tagName === 'ul' ? 'bullet' : 'numbered',
          items
        })
      }
    }

    // Callouts / Alertas (divs con clases especiales)
    else if (tagName === 'div') {
      const classes = $elem.attr('class') || ''
      const text = cleanText($elem.text())

      if (text) {
        if (classes.includes('callout') || classes.includes('alert') || classes.includes('note')) {
          let style: 'info' | 'warning' | 'success' | 'tip' = 'info'

          if (classes.includes('warning') || classes.includes('danger')) {
            style = 'warning'
          } else if (classes.includes('success')) {
            style = 'success'
          } else if (classes.includes('tip')) {
            style = 'tip'
          }

          blocks.push({
            id: generateId('callout'),
            type: 'callout',
            style,
            title: 'Nota',
            content: text
          })
        } else {
          // Div genérico → convertir a párrafo
          blocks.push({
            id: generateId('para'),
            type: 'paragraph',
            text
          })
        }
      }
    }

    // Code blocks: pre > code
    else if (tagName === 'pre') {
      const code = $elem.find('code').text() || $elem.text()
      const cleanCode = code.trim()

      if (cleanCode) {
        // Intentar detectar lenguaje
        let language = 'javascript'
        const codeClass = $elem.find('code').attr('class') || ''
        const match = codeClass.match(/language-(\w+)/)
        if (match) {
          language = match[1]
        }

        blocks.push({
          id: generateId('code'),
          type: 'code',
          language,
          code: cleanCode,
          showLineNumbers: true
        })
      }
    }

    // Imágenes
    else if (tagName === 'img') {
      const url = $elem.attr('src')
      const alt = $elem.attr('alt') || 'Imagen'
      const caption = $elem.attr('title') || undefined

      if (url) {
        blocks.push({
          id: generateId('image'),
          type: 'image',
          url,
          alt,
          caption
        })
      }
    }

    // Separadores
    else if (tagName === 'hr') {
      blocks.push({
        id: generateId('divider'),
        type: 'divider'
      })
    }

    // Blockquote → Callout
    else if (tagName === 'blockquote') {
      const text = cleanText($elem.text())
      if (text) {
        blocks.push({
          id: generateId('callout'),
          type: 'callout',
          style: 'tip',
          title: 'Cita',
          content: text
        })
      }
    }

    // Strong/Bold standalone → Heading nivel 3
    else if (tagName === 'strong' || tagName === 'b') {
      const text = cleanText($elem.text())
      if (text && text.length > 3) {
        blocks.push({
          id: generateId('heading'),
          type: 'heading',
          level: 3,
          text
        })
      }
    }
  })

  // Si no se generaron bloques, crear uno básico
  if (blocks.length === 0) {
    const plainText = cleanText($.text())
    if (plainText) {
      blocks.push({
        id: 'para-1',
        type: 'paragraph',
        text: plainText.substring(0, 500) // Limitar a 500 caracteres
      })
    } else {
      blocks.push({
        id: 'para-1',
        type: 'paragraph',
        text: `Contenido de la lección: ${lessonTitle}`
      })
    }
  }

  // Calcular tiempo de lectura estimado
  const estimatedReadingTime = estimateReadingTime(html)

  return {
    version: '1.0',
    estimatedReadingTime,
    blocks,
    resources: []
  }
}

/**
 * Calcula tiempo de lectura estimado (en minutos)
 */
function estimateReadingTime(html: string): number {
  const $ = cheerio.load(html)
  const text = $.text()
  const words = text.split(/\s+/).filter(w => w.length > 0).length
  const minutes = Math.ceil(words / 200) // 200 palabras por minuto
  return Math.max(1, minutes) // Mínimo 1 minuto
}

/**
 * Genera estadísticas de la conversión
 */
function generateStats(contentJson: LessonContent, originalHtml: string): LessonConversion['stats'] {
  const blockTypes: Record<string, number> = {}

  contentJson.blocks.forEach(block => {
    blockTypes[block.type] = (blockTypes[block.type] || 0) + 1
  })

  return {
    totalBlocks: contentJson.blocks.length,
    blockTypes,
    estimatedReadingTime: contentJson.estimatedReadingTime,
    contentLength: originalHtml.length
  }
}

// =====================================================
// FUNCIONES DE BASE DE DATOS
// =====================================================

/**
 * Obtiene todas las lecciones que no tienen content_json
 */
async function fetchLessonsWithoutJson(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, slug, content, content_json')
    .is('content_json', null)
    .order('title', { ascending: true })

  if (error) {
    console.error('❌ Error al obtener lecciones:', error)
    throw error
  }

  return data || []
}

/**
 * Actualiza una lección con su content_json
 */
async function updateLessonJson(id: string, contentJson: LessonContent): Promise<boolean> {
  const { error } = await supabase
    .from('lessons')
    .update({
      content_json: contentJson,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error(`❌ Error al actualizar lección ${id}:`, error)
    return false
  }

  return true
}

/**
 * Crea backup de lecciones antes de migrar
 */
async function createBackup(lessons: Lesson[]): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupData = lessons.map(l => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    content: l.content
  }))

  const fs = require('fs')
  const path = require('path')
  const backupDir = path.join(process.cwd(), 'backups')

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupFile = path.join(backupDir, `lessons-backup-${timestamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))

  console.log(`📦 Backup creado: ${backupFile}`)
}

// =====================================================
// FUNCIONES DE INTERFAZ
// =====================================================

/**
 * Muestra preview de conversiones
 */
function displayPreview(conversions: LessonConversion[], limit?: number) {
  console.log('\n' + '='.repeat(80))
  console.log('📋 PREVIEW DE CONVERSIONES')
  console.log('='.repeat(80) + '\n')

  const toShow = limit ? conversions.slice(0, limit) : conversions

  toShow.forEach((conv, index) => {
    console.log(`\n${index + 1}. 📄 ${conv.title}`)
    console.log(`   Slug: ${conv.slug}`)
    console.log(`   ID: ${conv.id}`)
    console.log(`   📊 Estadísticas:`)
    console.log(`      - Total de bloques: ${conv.stats.totalBlocks}`)
    console.log(`      - Tiempo de lectura: ${conv.stats.estimatedReadingTime} min`)
    console.log(`      - Longitud HTML original: ${conv.stats.contentLength} caracteres`)
    console.log(`   📦 Tipos de bloques:`)
    Object.entries(conv.stats.blockTypes).forEach(([type, count]) => {
      console.log(`      - ${type}: ${count}`)
    })

    console.log(`   🔍 Primeros 3 bloques:`)
    conv.contentJson.blocks.slice(0, 3).forEach((block, i) => {
      if (block.type === 'heading') {
        console.log(`      ${i + 1}. [HEADING H${block.level}] ${block.text.substring(0, 60)}...`)
      } else if (block.type === 'paragraph') {
        console.log(`      ${i + 1}. [PARAGRAPH] ${block.text.substring(0, 60)}...`)
      } else if (block.type === 'list') {
        console.log(`      ${i + 1}. [LIST ${block.style.toUpperCase()}] ${block.items.length} items`)
      } else if (block.type === 'callout') {
        console.log(`      ${i + 1}. [CALLOUT ${block.style.toUpperCase()}] ${block.content.substring(0, 40)}...`)
      } else if (block.type === 'code') {
        console.log(`      ${i + 1}. [CODE ${block.language}] ${block.code.split('\n').length} lines`)
      } else {
        console.log(`      ${i + 1}. [${block.type.toUpperCase()}]`)
      }
    })

    if (limit && index === limit - 1 && conversions.length > limit) {
      console.log(`\n   ... y ${conversions.length - limit} lecciones más`)
    }
  })

  console.log('\n' + '='.repeat(80))
}

/**
 * Pide confirmación al usuario
 */
async function askConfirmation(question: string = '¿Deseas continuar con la migración?'): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(`\n${question} (si/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'si' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Muestra reporte final
 */
function displayFinalReport(results: { success: string[], failed: { id: string, title: string, error: string }[] }, totalTime: number) {
  console.log('\n' + '='.repeat(80))
  console.log('✅ MIGRACIÓN COMPLETADA')
  console.log('='.repeat(80) + '\n')

  console.log(`📊 Resumen:`)
  console.log(`   - Total procesadas: ${results.success.length + results.failed.length}`)
  console.log(`   - ✅ Exitosas: ${results.success.length}`)
  console.log(`   - ❌ Fallidas: ${results.failed.length}`)
  console.log(`   - ⏱️  Tiempo total: ${(totalTime / 1000).toFixed(2)}s`)

  if (results.failed.length > 0) {
    console.log(`\n❌ Lecciones fallidas:`)
    results.failed.forEach(f => {
      console.log(`   - ${f.title} (${f.id})`)
      console.log(`     Error: ${f.error}`)
    })
  }

  console.log('\n' + '='.repeat(80))
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function main() {
  const args = process.argv.slice(2)
  const previewOnly = args.includes('--preview-only')
  const batchMode = args.includes('--batch')

  console.log('🚀 MIGRACIÓN AUTOMÁTICA DE LECCIONES HTML → JSON')
  console.log('='.repeat(80))

  try {
    // 1. Obtener lecciones sin content_json
    console.log('\n📊 Obteniendo lecciones sin content_json...')
    const lessons = await fetchLessonsWithoutJson()

    if (lessons.length === 0) {
      console.log('✅ No hay lecciones para migrar. Todas las lecciones ya tienen content_json.')
      return
    }

    console.log(`📚 Encontradas ${lessons.length} lecciones para migrar\n`)

    // 2. Crear backup
    console.log('📦 Creando backup...')
    await createBackup(lessons)

    // 3. Convertir cada lección
    console.log('\n🔄 Convirtiendo lecciones...')
    const conversions: LessonConversion[] = []

    for (const lesson of lessons) {
      try {
        const contentJson = convertHtmlToJson(lesson.content, lesson.title)
        const stats = generateStats(contentJson, lesson.content || '')

        conversions.push({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          contentJson,
          originalHtml: lesson.content || '',
          stats
        })
      } catch (error) {
        console.error(`❌ Error al convertir "${lesson.title}":`, error)
      }
    }

    console.log(`✅ ${conversions.length} lecciones convertidas exitosamente`)

    // 4. Mostrar preview (primeras 3 o todas si son pocas)
    const previewLimit = conversions.length <= 5 ? conversions.length : 3
    displayPreview(conversions, previewLimit)

    // 5. Si es solo preview, terminar aquí
    if (previewOnly) {
      console.log('\n👁️  Modo preview-only activado. No se realizaron actualizaciones.')
      return
    }

    // 6. Pedir confirmación
    if (!batchMode) {
      const confirmed = await askConfirmation(`¿Deseas migrar estas ${conversions.length} lecciones a Supabase?`)
      if (!confirmed) {
        console.log('\n❌ Migración cancelada por el usuario.')
        return
      }
    }

    // 7. Actualizar en Supabase
    console.log('\n🔄 Actualizando lecciones en Supabase...')
    const startTime = Date.now()
    const results = {
      success: [] as string[],
      failed: [] as { id: string, title: string, error: string }[]
    }

    for (const conv of conversions) {
      try {
        const success = await updateLessonJson(conv.id, conv.contentJson)
        if (success) {
          results.success.push(conv.id)
          console.log(`   ✅ ${conv.title}`)
        } else {
          results.failed.push({
            id: conv.id,
            title: conv.title,
            error: 'Update returned false'
          })
          console.log(`   ❌ ${conv.title} - Error en actualización`)
        }
      } catch (error) {
        results.failed.push({
          id: conv.id,
          title: conv.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.log(`   ❌ ${conv.title} - ${error}`)
      }
    }

    const totalTime = Date.now() - startTime

    // 8. Mostrar reporte final
    displayFinalReport(results, totalTime)

  } catch (error) {
    console.error('\n💥 Error fatal durante la migración:', error)
    process.exit(1)
  }
}

// Ejecutar script
main().catch(console.error)


