/**
 * El buscador de /admin/usuarios, con los caracteres que lo rompían.
 *
 *   npx tsx scripts/probar-el-buscador-de-usuarios.mts
 *
 * EL FALLO QUE MOTIVA ESTO
 *   El texto de búsqueda pasaba por `.replace(/[,()%_\\]/g, ' ')`: los caracteres
 *   reservados se cambiaban por espacios. Para la coma y el paréntesis colaba, pero
 *   para el guion bajo no: buscar «john_doe@…» se convertía en «john doe@…» y no
 *   encontraba la cuenta. Y los correos con guion bajo son de lo más normal.
 *
 * Hay dos capas de escapado y ninguna se puede dar por supuesta: la de PostgREST
 * —comas y paréntesis dentro de `or(...)`, que se resuelve entrecomillando— y la de
 * LIKE —`%` y `_`, que son comodines—. Esto comprueba las dos contra la base real.
 *
 * Todo con cuentas de usar y tirar, y se borran al terminar.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v

const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })

const MARCA = `qa-busca-${Date.now()}`
let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

const creados: string[] = []

async function cuenta(correo: string, nombre: string) {
  const { data, error } = await svc.auth.admin.createUser({
    email: correo, password: 'Buscar-' + Math.random().toString(36).slice(2) + 'K3!', email_confirm: true,
  })
  if (error) throw new Error(`${correo}: ${error.message}`)
  creados.push(data.user.id)
  await svc.from('users').update({ full_name: nombre }).eq('id', data.user.id)
  return data.user.id
}

try {
  const { getUsers } = await import('../lib/admin/queries.ts')

  // Tres cuentas, cada una con un caracter que rompía el buscador
  const conGuionBajo = `john_doe_${MARCA}@nodo360-pruebas.invalid`
  const a = await cuenta(conGuionBajo, `Juan ${MARCA}`)
  const b = await cuenta(`jane-${MARCA}@nodo360-pruebas.invalid`, `100% Seguro, S.L. (${MARCA})`)
  const c = await cuenta(`otro-${MARCA}@nodo360-pruebas.invalid`, `Back\\slash y "comillas" ${MARCA}`)
  console.log(`\n   tres cuentas: guion bajo, «100% Seguro, S.L. (…)» y «Back\\slash y "comillas"»`)

  const buscar = async (texto: string) => {
    const r = await getUsers(1, 50, texto, '')
    return (r.users as { id: string }[]).map((u) => u.id)
  }

  // ── El caso del informe ───────────────────────────────────────────────────
  console.log('\n=== el guion bajo, que es el fallo reportado ===')
  const porGuion = await buscar(`john_doe_${MARCA}`)
  di(porGuion.includes(a), 'buscar «john_doe_…» encuentra la cuenta', `${porGuion.length} resultados`)

  const soloGuion = await buscar('_')
  di(!soloGuion.includes(b) && !soloGuion.includes(c),
    'buscar «_» no trae a todo el mundo: es un guion bajo literal',
    `${soloGuion.length} resultados`)

  // ── Los comodines de LIKE ─────────────────────────────────────────────────
  console.log('\n=== los comodines ===')
  const porCien = await buscar('100%')
  di(porCien.includes(b), 'buscar «100%» encuentra «100% Seguro…»', `${porCien.length} resultados`)
  di(!porCien.includes(a) && !porCien.includes(c), 'y no trae a los otros dos')

  const soloPorciento = await buscar('%')
  di(!soloPorciento.includes(a) && !soloPorciento.includes(c),
    'buscar «%» no trae toda la tabla', `${soloPorciento.length} resultados`)

  // ── Los reservados de PostgREST ───────────────────────────────────────────
  console.log('\n=== coma, parentesis, comillas y barra ===')
  const conComa = await buscar('Seguro, S.L.')
  di(conComa.includes(b), 'buscar «Seguro, S.L.» (con coma y puntos) encuentra', `${conComa.length}`)

  const conParentesis = await buscar(`(${MARCA})`)
  di(conParentesis.includes(b), 'buscar «(…)» con parentesis encuentra', `${conParentesis.length}`)

  const conComillas = await buscar('"comillas"')
  di(conComillas.includes(c), 'buscar «"comillas"» encuentra', `${conComillas.length}`)

  const conBarra = await buscar('Back\\slash')
  di(conBarra.includes(c), 'buscar «Back\\slash» encuentra', `${conBarra.length}`)

  // ── Y que sigue buscando lo normal ────────────────────────────────────────
  console.log('\n=== lo de siempre sigue funcionando ===')
  const porNombre = await buscar(`Juan ${MARCA}`)
  di(porNombre.includes(a) && porNombre.length === 1, 'buscar por nombre', `${porNombre.length}`)
  const porCorreo = await buscar(`jane-${MARCA}`)
  di(porCorreo.includes(b) && porCorreo.length === 1, 'buscar por correo', `${porCorreo.length}`)
  const nada = await buscar(`no-existe-${MARCA}`)
  di(nada.length === 0, 'buscar algo que no existe no devuelve nada', `${nada.length}`)
} catch (e) {
  fallos++
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creados) await svc.auth.admin.deleteUser(id)
  const { data: resto } = await svc.auth.admin.listUsers({ perPage: 1000 })
  const quedan = (resto?.users ?? []).filter((u) => (u.email ?? '').includes(MARCA)).length
  di(quedan === 0, 'no queda ninguna cuenta de prueba', String(quedan))
  console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} comprobaciones fallan\n`)
  process.exit(fallos === 0 ? 0 : 1)
}
