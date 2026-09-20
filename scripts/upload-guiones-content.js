/**
 * Sube el contenido de los guiones de docs/content/ a lessons.content
 *
 * Lee los .md, extrae de cada leccion la seccion "Contenido para lesson player
 * (TipTap)", la convierte a HTML y hace UPDATE sobre las lecciones que YA
 * existen en la base de datos (nunca INSERT).
 *
 * - Escribe solo en lessons.content. content_json no se toca.
 * - Los "Guion de slides" son material de produccion: se ignoran.
 * - El quiz no se sube: solo se compara con lo que ya hay en la BD.
 *
 * Uso:
 *   node scripts/upload-guiones-content.js              (dry-run, por defecto)
 *   node scripts/upload-guiones-content.js --lesson=3   (dry-run de una leccion)
 *   node scripts/upload-guiones-content.js --compare-quiz
 *   node scripts/upload-guiones-content.js --write      (ESCRIBE en Supabase)
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const ROOT = path.join(__dirname, '..')

const COURSES = [
  {
    file: 'docs/content/curso-cold-storage-completo.md',
    slug: 'cold-storage-protege-tus-bitcoin',
    label: 'Cold Storage',
  },
  {
    file: 'docs/content/curso-nodos-bitcoin-completo.md',
    slug: 'nodos-bitcoin-tu-soberania-tecnica',
    label: 'Nodos Bitcoin',
  },
]

// ---------------------------------------------------------------- utilidades

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Markdown inline -> HTML. Se aplica DESPUES de escapar. */
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
}

/**
 * Convierte el bloque de prosa del guion a HTML.
 * - linea "**Texto:**"  o  "#### Texto"  -> <h3>
 * - lineas "- item" consecutivas         -> <ul><li>
 * - resto                                -> <p>
 * - "---" se descarta (separador del guion, no contenido)
 */
function toHtml(raw) {
  const out = []
  let list = null

  const flush = () => {
    if (list && list.length) out.push('<ul>' + list.map(i => `<li>${i}</li>`).join('') + '</ul>')
    list = null
  }

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim()

    if (!line || line === '---') { flush(); continue }

    const li = line.match(/^[-*]\s+(.*)$/)
    if (li) {
      if (!list) list = []
      list.push(inline(escapeHtml(li[1])))
      continue
    }
    flush()

    const hBold = line.match(/^\*\*(.+?):?\*\*:?$/)
    const hHash = line.match(/^#{2,6}\s+(.*)$/)
    if (hBold) { out.push(`<h3>${inline(escapeHtml(hBold[1]))}</h3>`); continue }
    if (hHash) { out.push(`<h3>${inline(escapeHtml(hHash[1]))}</h3>`); continue }

    out.push(`<p>${inline(escapeHtml(line))}</p>`)
  }
  flush()
  return out.join('')
}

// ------------------------------------------------------------------ parseo

/** Devuelve [{ module, lesson, title, html, chars, quiz: [...] }] */
function parseCourse(absFile) {
  const md = fs.readFileSync(absFile, 'utf8')
  // Cortar por cabeceras de leccion, conservando la cabecera
  const parts = md.split(/\n(?=###\s+LECCI[OÓ]N\s)/)
  const lessons = []

  for (const part of parts) {
    const head = part.match(/^###\s+LECCI[OÓ]N\s+(\d+)\.(\d+):\s*(.+)$/m)
    if (!head) continue

    const [, mod, les, title] = head

    // Prosa: entre el marcador TipTap y el guion de slides (o el quiz)
    const start = part.indexOf('**Contenido para lesson player')
    if (start === -1) continue
    const afterMarker = part.indexOf('\n', start) + 1

    let end = part.indexOf('**Guión de slides', afterMarker)
    if (end === -1) end = part.indexOf('**Guion de slides', afterMarker)
    if (end === -1) end = part.indexOf('**Quiz (', afterMarker)
    if (end === -1) end = part.length

    const prose = part.slice(afterMarker, end)

    lessons.push({
      module: Number(mod),
      lesson: Number(les),
      title: title.trim(),
      html: toHtml(prose),
      quiz: parseQuiz(part),
    })
  }
  return lessons
}

/** Extrae las preguntas del bloque de quiz de una leccion. */
function parseQuiz(part) {
  const start = part.indexOf('**Quiz (')
  if (start === -1) return []
  const block = part.slice(start)
  const questions = []

  const chunks = block.split(/\n(?=\*\*P\d+:\*\*)/)
  for (const chunk of chunks) {
    const qm = chunk.match(/^\*\*P(\d+):\*\*\s*(.+)$/m)
    if (!qm) continue
    const options = []
    let correct = -1
    for (const rawLine of chunk.split('\n')) {
      // trim() imprescindible: el working tree usa CRLF y en JS '.' no cruza
      // \r, asi que sin limpiarlo el regex de opciones no casa.
      const line = rawLine.trim()
      const om = line.match(/^[-*]\s+([A-D])\)\s*(.*)$/)
      if (!om) continue
      const isCorrect = /✅/.test(om[2])
      const text = om[2].replace(/✅/g, '').trim()
      if (isCorrect) correct = options.length
      options.push(text)
    }
    questions.push({ n: Number(qm[1]), question: qm[2].trim(), options, correct })
  }
  return questions
}

// ------------------------------------------------------------------ supabase

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Mapa "M.L" -> fila de lessons, resuelto por order_index. */
async function loadLessons(sb, courseSlug) {
  const { data: course, error: ce } = await sb.from('courses').select('id,title').eq('slug', courseSlug).single()
  if (ce) throw new Error('curso ' + courseSlug + ': ' + ce.message)

  const { data: mods } = await sb.from('modules').select('id,title,order_index').eq('course_id', course.id).order('order_index')
  const map = {}
  for (const m of mods) {
    const { data: ls } = await sb.from('lessons').select('id,title,slug,order_index,content').eq('module_id', m.id).order('order_index')
    for (const l of ls) map[`${m.order_index}.${l.order_index}`] = { ...l, moduleTitle: m.title, moduleId: m.id }
  }
  return { course, map }
}

// ---------------------------------------------------------------------- main

;(async () => {
  const args = process.argv.slice(2)
  const WRITE = args.includes('--write')
  const COMPARE_QUIZ = args.includes('--compare-quiz')
  const only = (args.find(a => a.startsWith('--lesson=')) || '').split('=')[1]

  const sb = db()

  if (COMPARE_QUIZ) {
    await compareQuiz(sb)
    return
  }

  console.log(WRITE ? '*** MODO ESCRITURA ***' : '=== DRY-RUN (no se escribe nada) ===')
  console.log()

  for (const c of COURSES) {
    const abs = path.join(ROOT, c.file)
    const parsed = parseCourse(abs)
    const { course, map } = await loadLessons(sb, c.slug)

    console.log('='.repeat(78))
    console.log(course.title + '   [' + c.slug + ']')
    console.log('  lecciones en el guion: ' + parsed.length + ' | en la BD: ' + Object.keys(map).length)
    console.log('='.repeat(78))

    for (const p of parsed) {
      const key = `${p.module}.${p.lesson}`
      const row = map[key]
      if (!row) { console.log(`  ❌ ${key} "${p.title}" -> SIN correspondencia en la BD`); continue }

      const before = (row.content || '').length
      const after = p.html.length
      console.log(`\n  ── ${key}  ${row.slug}`)
      console.log(`     guion: "${p.title}"`)
      console.log(`     BD   : "${row.title}"`)
      console.log(`     content: ${before} -> ${after} chars  (${after > before ? '+' : ''}${after - before})`)
      console.log(`     quiz en el guion: ${p.quiz.length} preguntas (no se suben)`)

      if (only && only !== key) continue
      if (only || !WRITE) {
        console.log('     ---------- HTML resultante ----------')
        console.log(p.html.replace(/></g, '>\n<').split('\n').map(l => '     ' + l).join('\n'))
        console.log('     -------------------------------------')
      }

      if (WRITE) {
        const { error } = await sb.from('lessons').update({ content: p.html, updated_at: new Date().toISOString() }).eq('id', row.id)
        console.log(error ? '     ❌ ERROR: ' + error.message : '     ✅ actualizado')
      }
    }
    console.log()
  }

  if (!WRITE) console.log('\nDry-run terminado. Para escribir: node scripts/upload-guiones-content.js --write')
})().catch(e => { console.error(e); process.exit(1) })

// ------------------------------------------------------- comparacion de quiz

async function compareQuiz(sb) {
  const c = COURSES[0] // Cold Storage
  const parsed = parseCourse(path.join(ROOT, c.file))
  const { course, map } = await loadLessons(sb, c.slug)

  console.log('=== COMPARACION DE QUIZ: ' + course.title + ' ===\n')

  const moduleIds = [...new Set(Object.values(map).map(l => l.moduleId))]
  const { data: dbq } = await sb
    .from('quiz_questions')
    .select('id, module_id, question, options, correct_answer, order_index')
    .in('module_id', moduleIds)
    .order('order_index')

  const guionTotal = parsed.reduce((a, p) => a + p.quiz.length, 0)
  console.log('preguntas en el guion: ' + guionTotal)
  console.log('preguntas en la BD   : ' + (dbq ? dbq.length : 0))
  console.log()

  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  const dbByText = new Map((dbq || []).map(q => [norm(q.question), q]))

  let iguales = 0, distintas = 0, nuevas = 0
  for (const p of parsed) {
    for (const q of p.quiz) {
      const hit = dbByText.get(norm(q.question))
      if (!hit) {
        nuevas++
        console.log(`  🆕 NO ESTA EN LA BD  [${p.module}.${p.lesson}] ${q.question}`)
        continue
      }
      const dbOpts = Array.isArray(hit.options) ? hit.options : []
      const sameOpts = dbOpts.length === q.options.length && dbOpts.every((o, i) => norm(o) === norm(q.options[i]))
      const sameCorrect = hit.correct_answer === q.correct
      if (sameOpts && sameCorrect) { iguales++; continue }
      distintas++
      console.log(`  ⚠️  DIFIERE  [${p.module}.${p.lesson}] ${q.question}`)
      if (!sameOpts) {
        console.log(`       guion: ${JSON.stringify(q.options)}`)
        console.log(`       BD   : ${JSON.stringify(dbOpts)}`)
      }
      if (!sameCorrect) console.log(`       correcta -> guion: ${q.correct} | BD: ${hit.correct_answer}`)
    }
  }

  console.log()
  console.log(`RESUMEN: ${iguales} identicas | ${distintas} difieren | ${nuevas} no estan en la BD`)
  if (nuevas === 0 && distintas === 0) console.log('=> Subir el quiz del guion DUPLICARIA las ' + guionTotal + ' preguntas que ya existen.')
}
