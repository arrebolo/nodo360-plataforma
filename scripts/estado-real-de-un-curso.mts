/**
 * El estado real de un curso, en todas las tablas que opinan sobre él.
 *
 *   npx tsx scripts/estado-real-de-un-curso.mts <id-o-slug>
 *
 * Nace de un caso concreto: un curso aprobado, modificado por su autor y reenviado a
 * revisión, que en el panel del instructor sale «En revisión» y en /admin/cursos sigue
 * como aprobado. Para saber qué pasa de verdad hay que mirar las cinco cosas a la vez
 * —el estado, la copia publicada, los votos de revisión y lo que lee el público— en vez
 * de fiarse de lo que pinta una pantalla.
 *
 * Solo lectura.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, { auth: { persistSession: false } })

const clave = process.argv[2]
if (!clave) {
  console.log('uso: npx tsx scripts/estado-real-de-un-curso.mts <id-o-slug>')
  process.exit(2)
}

const esUuid = /^[0-9a-f-]{36}$/i.test(clave)
const { data: c } = await svc.from('courses').select('*').eq(esUuid ? 'id' : 'slug', clave).maybeSingle()
if (!c) { console.log(`   no hay ningun curso con ${esUuid ? 'id' : 'slug'} = ${clave}`); process.exit(1) }

const { data: autor } = await svc.from('users').select('email, role').eq('id', c.instructor_id).maybeSingle()
const { data: esp } = c.specialty_id
  ? await svc.from('instructor_specialties').select('slug').eq('id', c.specialty_id).maybeSingle()
  : { data: null }

console.log(`\n=== ${c.title} ===`)
console.log(`   id            ${c.id}`)
console.log(`   slug          ${c.slug}`)
console.log(`   autor         ${String(autor?.email ?? '?').replace(/(.{3}).*(@.*)/, '$1***$2')}  (${autor?.role})`)
console.log(`   especialidad  ${esp?.slug ?? '(ninguna)'}   jurisdiccion ${c.jurisdiccion ?? '-'}`)

console.log('\n=== lo que dicen las columnas de estado ===')
console.log(`   status           ${c.status}`)
console.log(`   review_status    ${c.review_status ?? 'null'}`)
console.log(`   published_at     ${c.published_at ?? 'null'}`)
console.log(`   updated_at       ${c.updated_at ?? 'null'}`)
console.log(`   rejection_reason ${c.rejection_reason ? JSON.stringify(String(c.rejection_reason).slice(0, 60)) : 'null'}`)

// ── La copia publicada ───────────────────────────────────────────────────────
console.log('\n=== la copia publicada (117) ===')
const { data: espejo } = await svc.from('courses_publicados').select('*').eq('id', c.id).maybeSingle()
if (!espejo) {
  console.log('   NO hay fila en courses_publicados')
} else {
  console.log(`   version ${espejo.version}   publicado_el ${String(espejo.publicado_el).slice(0, 19)}   retirada_el ${espejo.retirada_el ? String(espejo.retirada_el).slice(0, 19) : 'null (viva)'}`)
  console.log(`   titulo en el espejo: ${JSON.stringify(espejo.title)}`)
  console.log(`   titulo de trabajo:   ${JSON.stringify(c.title)}`)
  const campos = ['title', 'description', 'long_description', 'level', 'thumbnail_url', 'specialty_id', 'jurisdiccion', 'is_free', 'price'] as const
  const distintos = campos.filter((k) => JSON.stringify((c as Record<string, unknown>)[k]) !== JSON.stringify((espejo as Record<string, unknown>)[k]))
  console.log(`   campos distintos entre trabajo y espejo: ${distintos.length ? distintos.join(', ') : 'ninguno'}`)
}

const { count: modsT } = await svc.from('modules').select('id', { count: 'exact', head: true }).eq('course_id', c.id)
const { count: modsE } = await svc.from('modules_publicados').select('id', { count: 'exact', head: true }).eq('course_id', c.id).is('retirada_el', null)
const { count: lecsT } = await svc.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', c.id)
const { count: lecsE } = await svc.from('lessons_publicadas').select('id', { count: 'exact', head: true }).eq('course_id', c.id).is('retirada_el', null)
console.log(`   modulos   trabajo ${modsT ?? 0}  espejo ${modsE ?? 0}`)
console.log(`   lecciones trabajo ${lecsT ?? 0}  espejo ${lecsE ?? 0}`)

// Contenido de las lecciones: lo que mas importa, y lo que el trigger de la 030 no mira
const { data: lecT } = await svc.from('lessons').select('id, title, content, updated_at').eq('course_id', c.id).order('order_index')
const { data: lecE } = await svc.from('lessons_publicadas').select('id, title, content').eq('course_id', c.id)
let cambiadas = 0
for (const l of lecT ?? []) {
  const e = (lecE ?? []).find((x) => x.id === l.id)
  if (!e) { cambiadas++; continue }
  if (JSON.stringify(l.title) !== JSON.stringify(e.title) || JSON.stringify(l.content) !== JSON.stringify(e.content)) cambiadas++
}
console.log(`   lecciones con el texto distinto del publicado: ${cambiadas} de ${(lecT ?? []).length}`)

// ── Los votos de revision ────────────────────────────────────────────────────
console.log('\n=== course_reviews ===')
const { data: votos } = await svc.from('course_reviews').select('*').eq('course_id', c.id).order('created_at')
if (!(votos ?? []).length) console.log('   (ninguno)')
for (const v of votos ?? []) {
  const { data: quien } = await svc.from('users').select('email').eq('id', v.mentor_id ?? v.reviewer_id).maybeSingle()
  console.log(`   ${String(v.created_at).slice(0, 19)}  ${v.vote ?? v.decision}  por ${String(quien?.email ?? '?').replace(/(.{3}).*(@.*)/, '$1***$2')}  ${v.comment ? JSON.stringify(String(v.comment).slice(0, 50)) : ''}`)
}

// ── Lo que ve el publico HOY ─────────────────────────────────────────────────
console.log('\n=== lo que ve el publico hoy (clave anonima) ===')
const { data: comoAnon, error: eAnon } = await anon
  .from('courses').select('title, status, description').eq('slug', c.slug).maybeSingle()
if (eAnon) console.log(`   anon: ${eAnon.code}: ${eAnon.message.slice(0, 60)}`)
else if (!comoAnon) console.log('   anon no ve el curso')
else {
  console.log(`   anon ve: estado=${comoAnon.status}  titulo=${JSON.stringify(comoAnon.title)}`)
  const igualAlTrabajo = comoAnon.title === c.title
  console.log(`   ${igualAlTrabajo ? '*** lo que ve es la version DE TRABAJO: los cambios del instructor YA son publicos'
    : 'lo que ve coincide con la copia publicada'}`)
}
console.log('')
