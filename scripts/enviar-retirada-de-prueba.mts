/**
 * Envía UN correo de retirada a la cuenta de pruebas, con el motivo real que quedó
 * registrado en la base.
 *
 *   npx tsx scripts/enviar-retirada-de-prueba.mts
 *
 * No publica nada en Discord ni en Telegram: este módulo no los toca, y de todos
 * modos fuerza el modo de prueba de anuncios por si alguien amplía el script.
 *
 * No escribe en la base: solo lee a quién y por qué, y manda el correo.
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
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v as string
process.env.ANUNCIOS_MODO_PRUEBA = '1'

const { enviarVerificacionRetirada } = await import('@/lib/email/verificacion')

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
)

const tapar = (e: string | null) => {
  if (!e) return '(sin correo)'
  const [u, d] = e.split('@')
  return u.slice(0, 3) + '***@' + d
}

const { data: persona } = await db
  .from('users')
  .select('id, email, full_name')
  .ilike('full_name', '%alberto21%')
  .maybeSingle()

if (!persona?.email) {
  console.log('No encuentro la cuenta alberto21 o no tiene correo. Abortado.')
  process.exit(1)
}

// La retirada real, con su motivo tal cual se registró.
const { data: retirada } = await db
  .from('instructor_certifications')
  .select('revoked_reason, revoked_at, jurisdiccion, instructor_specialties ( nombre )')
  .eq('user_id', persona.id)
  .eq('status', 'retirada')
  .order('revoked_at', { ascending: false })
  .limit(1)
  .maybeSingle()

if (!retirada) {
  console.log('Esa cuenta no tiene ninguna verificación retirada. Abortado.')
  process.exit(1)
}

const esp = retirada.instructor_specialties as unknown as { nombre: string } | { nombre: string }[]
const especialidad = (Array.isArray(esp) ? esp[0]?.nombre : esp?.nombre) ?? 'la especialidad'
const motivo = (retirada.revoked_reason as string | null) ?? '(sin motivo registrado)'

console.log('=== LO QUE SE VA A ENVIAR ===')
console.log(`   a:            ${tapar(persona.email as string)}`)
console.log(`   especialidad: ${especialidad}`)
console.log(`   jurisdicción: ${retirada.jurisdiccion ?? '(ninguna)'}`)
console.log(`   motivo:       ${JSON.stringify(motivo)}   ← tal cual está en la base`)
console.log(`   retirada el:  ${(retirada.revoked_at as string | null)?.slice(0, 16) ?? '—'}`)
console.log()

const r = await enviarVerificacionRetirada({
  to: persona.email as string,
  nombre: (persona.full_name as string) ?? 'instructor',
  especialidad,
  jurisdiccion: (retirada.jurisdiccion as string | null) ?? null,
  motivo,
})

if (r.success) {
  console.log(`   ENVIADO. id de Resend: ${r.id}`)
} else {
  console.log(`   *** NO SE ENVIO ***  ${r.error}`)
  process.exit(1)
}
