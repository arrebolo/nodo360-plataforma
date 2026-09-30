/**
 * ¿Se puede pedir una verificación con la migración 108 sin aplicar?
 *
 *   npx tsx scripts/probar-solicitud-sin-la-108.mts
 *
 * Reproduce EXACTAMENTE los dos pasos que hace `POST /api/instructor/verificacion`
 * —insertar con las columnas de consentimiento y, si la base no las tiene,
 * reintentar sin ellas— contra la base real, y comprueba los dos caminos:
 *
 *   · con la 108 SIN aplicar: el primer insert falla con PGRST204 y el reintento
 *     crea el expediente. El formulario funciona, sin consentimiento.
 *   · con la 108 aplicada: el primer insert ya funciona y guarda el consentimiento.
 *
 * Limpia todo lo que crea. Si algo queda, lo dice.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)
const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL as string,
  env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
)

let fallos = 0
const di = (ok: boolean, texto: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'PASA' : '*** FALLA ***'}  ${texto}${extra ? '  -> ' + extra : ''}`)
}

const creados: string[] = []

try {
  const { data: persona } = await db
    .from('users').select('id').eq('role', 'student').order('created_at').limit(1).maybeSingle()
  const { data: esp } = await db
    .from('instructor_specialties').select('id, nombre').eq('slug', 'defi').maybeSingle()

  if (!persona || !esp) {
    console.log('Falta un estudiante o la especialidad defi. Abortado.')
    process.exit(1)
  }

  // Que no haya ya un expediente vivo de esa especialidad para esa persona.
  const { data: vivos } = await db
    .from('instructor_certifications')
    .select('id, status')
    .eq('user_id', persona.id)
    .eq('specialty_id', esp.id)
    .in('status', ['pendiente', 'aprobada'])

  if (vivos && vivos.length > 0) {
    console.log('Esa persona ya tiene un expediente vivo de defi; el indice unico lo impediria. Abortado.')
    process.exit(1)
  }

  console.log('=== ¿ESTA LA 108 APLICADA? ===')
  const sonda = await db.from('instructor_certifications').select('consentimiento_anuncio').limit(1)
  const hay108 = !sonda.error
  console.log(`   ${hay108 ? 'SI' : 'NO (' + sonda.error?.code + ')'}`)

  const base = {
    user_id: persona.id,
    specialty_id: esp.id,
    certification_number: 'QA-108-' + Date.now().toString().slice(-8),
    oral_result: 'pendiente',
    practical_result: 'pendiente',
  }
  const conConsentimiento = {
    ...base,
    consentimiento_anuncio: true,
    consentimiento_anuncio_el: new Date().toISOString(),
  }

  console.log('\n=== LOS DOS PASOS DE LA RUTA ===')
  let { data: fila, error } = await db
    .from('instructor_certifications')
    .insert(conConsentimiento)
    .select('id, certification_number')
    .single()

  if (hay108) {
    di(!error, 'con la 108 aplicada, el primer insert funciona', error?.code)
  } else {
    di(
      !!error && (error.code === 'PGRST204' || error.code === '42703'),
      'sin la 108, el primer insert falla como se esperaba',
      error ? error.code : 'NO FALLO'
    )

    ;({ data: fila, error } = await db
      .from('instructor_certifications')
      .insert(base)
      .select('id, certification_number')
      .single())

    di(!error && !!fila, 'el REINTENTO sin consentimiento crea el expediente', error?.code ?? error?.message)
  }

  if (fila) {
    creados.push(fila.id as string)
    const { data: creado } = await db
      .from('instructor_certifications')
      .select('id, status, certification_number')
      .eq('id', fila.id)
      .single()
    di(creado?.status === 'pendiente', `el expediente nace en «pendiente» (${creado?.certification_number})`)
  }
} catch (e) {
  fallos++
  console.log(`   *** FALLA ***  ${(e as Error).message}`)
} finally {
  console.log()
  for (const id of creados) await db.from('instructor_certifications').delete().eq('id', id)
  let quedan = 0
  for (const id of creados) {
    const { data } = await db.from('instructor_certifications').select('id').eq('id', id)
    if (data && data.length) quedan++
  }
  di(quedan === 0, 'limpieza: no queda ningun expediente de prueba')
}

console.log(`\n${fallos === 0 ? 'TODO CORRECTO' : 'REVISAR: ' + fallos + ' fallo(s)'}`)
process.exit(fallos === 0 ? 0 : 1)
