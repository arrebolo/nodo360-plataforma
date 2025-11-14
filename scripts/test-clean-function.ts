/**
 * Test cleanLessonTitle function
 */

function generateSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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
    .replace(/\s*-\s+[A-Z].*$/, '')
    .trim()
}

console.log('='.repeat(80))
console.log('🧪 PRUEBAS DE LIMPIEZA DE TÍTULOS')
console.log('='.repeat(80))

const tests = [
  'Amenazas comunes y cómo protegerte | Tu Primera Wallet - Nodo360',
  '¿Qué es Bitcoin? - Bitcoin desde Cero | Nodo360',
  'Introducción al Blockchain - Fundamentos de Blockchain | Nodo360',
  'Lección 1.1: ¿Qué es Blockchain? | Fundamentos de Blockchain - Nodo360',
  'Cómo funcionan las Transacciones Bitcoin - Bitcoin desde Cero | Nodo360',
  'Historia de Bitcoin',
]

tests.forEach((title) => {
  const cleaned = cleanLessonTitle(title)
  const slug = generateSlug(cleaned)
  console.log(`\n📝 Original: "${title}"`)
  console.log(`✨ Limpio:   "${cleaned}"`)
  console.log(`🔗 Slug:     "${slug}"`)
})

console.log('\n' + '='.repeat(80))
