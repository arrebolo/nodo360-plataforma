/**
 * Tercera pasada: ¿qué cambios de un curso publicado NO vuelven a revisión?
 *
 * El trigger de la migración 030 lista NUEVE columnas a mano —title, description,
 * long_description, level, price, is_free, is_premium, thumbnail_url, banner_url—.
 * Una lista escrita a mano envejece: las columnas que llegaron después no están.
 *
 * Se prueba columna por columna, con sesión real de instructor sobre un curso
 * publicado, y se mira si el estado sigue en «published».
 */
import fs from 'node:fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const svc = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })
const anon = createClient(URL_, ANON, { auth: { persistSession: false } })

const MARCA = 'qa-auditoria3'
const creados = { usuario: null as string | null, cert: null as string | null, curso: null as string | null }
let sesion: SupabaseClient = anon

try {
  const correo = `${MARCA}-${Date.now()}@nodo360-pruebas.invalid`
  const clave = 'Auditoria-' + Math.random().toString(36).slice(2) + 'X7!'
  const { data: creada } = await svc.auth.admin.createUser({ email: correo, password: clave, email_confirm: true })
  creados.usuario = creada!.user.id
  await svc.from('users').update({ role: 'instructor' }).eq('id', creados.usuario)

  const { data: esp } = await svc.from('instructor_specialties').select('id').eq('slug', 'fiscalidad').single()
  const { data: cert } = await svc.from('instructor_certifications').insert({
    user_id: creados.usuario, specialty_id: esp!.id, jurisdiccion: 'ES',
    certification_number: `QA-AUD3-${Date.now().toString().slice(-7)}`,
    status: 'aprobada', oral_result: 'apto', practical_result: 'apto', issued_at: new Date().toISOString(),
  }).select('id').single()
  creados.cert = cert!.id

  const { data: ses } = await anon.auth.signInWithPassword({ email: correo, password: clave })
  sesion = createClient(URL_, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${ses!.session!.access_token}` } },
  })

  const { data: curso } = await sesion.from('courses').insert({
    slug: `${MARCA}-${Date.now()}`, title: `${MARCA} curso`, level: 'beginner',
    status: 'draft', is_free: true, is_certifiable: false,
    instructor_id: creados.usuario, owner_id: creados.usuario,
    specialty_id: esp!.id, jurisdiccion: 'ES',
  }).select('id').single()
  creados.curso = curso!.id

  console.log('\n═══ ¿QUE CAMBIOS DE UN CURSO PUBLICADO VUELVEN A REVISION? ═══')
  console.log('   (curso de fiscalidad, jurisdicción ES, instructor verificado en ES)\n')

  const pruebas: [string, Record<string, unknown>][] = [
    ['description (está en la lista)', { description: 'cambiada ' + Date.now() }],
    ['title (está en la lista)', { title: `${MARCA} título nuevo` }],
    ['jurisdiccion  ES -> MX', { jurisdiccion: 'MX' }],
    ['subtitle', { subtitle: 'subtítulo nuevo' }],
    ['learning_objectives', { learning_objectives: ['objetivo cambiado'] }],
    ['requirements', { requirements: ['requisito cambiado'] }],
    ['target_audience', { target_audience: 'público cambiado' }],
    ['specialty_id -> otra especialidad', null as unknown as Record<string, unknown>],
  ]

  const { data: espEth } = await svc.from('instructor_specialties').select('id').eq('slug', 'ethereum-contratos').single()
  pruebas[pruebas.length - 1][1] = { specialty_id: espEth!.id }

  for (const [nombre, cambio] of pruebas) {
    // Se republica antes de cada prueba, para partir siempre de «published».
    await svc.from('courses').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', creados.curso)

    const r = await sesion.from('courses').update(cambio).eq('id', creados.curso)
    const { data: d } = await svc.from('courses').select('status').eq('id', creados.curso).single()

    if (r.error) {
      console.log(`   --    ${nombre.padEnd(36)} rechazado: ${r.error.code}`)
    } else if (d!.status === 'published') {
      console.log(`   FALLA ${nombre.padEnd(36)} SIGUE PUBLICADO: el cambio no pasa por revisión`)
    } else {
      console.log(`   OK    ${nombre.padEnd(36)} vuelve a ${d!.status}`)
    }
  }

  // Y la jurisdicción, que es la que más pesa: ¿queda en MX estando verificado solo en ES?
  await svc.from('courses').update({ status: 'published', jurisdiccion: 'MX' }).eq('id', creados.curso)
  const { data: fin } = await anon.from('courses').select('status, jurisdiccion').eq('id', creados.curso).maybeSingle()
  console.log(`\n   El alumno ve: status=${fin?.status}  jurisdiccion=${fin?.jurisdiccion}`)
  console.log('   (el instructor está verificado en Fiscalidad·ES, no en MX)')
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n═══ LIMPIEZA ═══')
  if (creados.curso) await svc.from('courses').delete().eq('id', creados.curso)
  if (creados.cert) await svc.from('instructor_certifications').delete().eq('id', creados.cert)
  if (creados.usuario) await svc.auth.admin.deleteUser(creados.usuario)
  const { count: c } = await svc.from('courses').select('id', { count: 'exact', head: true }).like('slug', `${MARCA}%`)
  const { count: v } = await svc.from('instructor_certifications').select('id', { count: 'exact', head: true }).like('certification_number', 'QA-AUD3-%')
  console.log(`   ${(c ?? 0) === 0 && (v ?? 0) === 0 ? 'OK   no queda nada' : 'FALLA quedan restos'}  (cursos ${c ?? 0}, verificaciones ${v ?? 0})`)
}
