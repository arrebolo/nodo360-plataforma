/**
 * Prueba de extremo a extremo del borrado de cuentas sin confirmar (migracion 105).
 *
 * POR QUE NO ESTA EN LA MIGRACION. La autoprueba de la 105 comprueba todo lo que
 * se puede comprobar sin fabricar una cuenta: el reflejo de email_confirmed_at,
 * que los triggers existen y funcionan, y que la funcion de borrado cuenta lo que
 * dice. Lo que NO puede hacer es crear una cuenta en auth.users: esa tabla es de
 * Supabase, sus columnas obligatorias no estan documentadas en este repositorio, y
 * un INSERT a ciegas ahi dentro abortaria la migracion entera.
 *
 * Aqui si se puede, porque la cuenta se crea por la API de administracion —el
 * mismo camino que usa la aplicacion— y con email_confirm:false, asi que NO se
 * envia ningun correo a ninguna direccion.
 *
 * LA LLAVE DE LA PRUEBA es p_dias = 0: con cero dias, cualquier cuenta sin
 * confirmar es elegible por edad, asi que si la condicion de «confirmada» o la de
 * «rol student» estuvieran mal, se veria aqui inmediatamente.
 *
 * SEGURIDAD: antes de borrar de verdad, comprueba que las unicas cuentas sin
 * confirmar que hay son las que ha creado esta prueba. Si hubiera alguna real,
 * aborta sin borrar nada: con p_dias = 0 se la llevaria por delante.
 *
 *   node scripts/probar-borrado-sin-confirmar.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

let fallos = 0
const di = (ok, texto, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'PASA' : '*** FALLA ***'}  ${texto}${extra ? '  -> ' + extra : ''}`)
}
const clave = () => 'Prueba-' + Math.random().toString(36).slice(2) + 'C4!'
const contar = async (dias) => {
  const { data, error } = await db.rpc('borrar_cuentas_sin_confirmar', {
    p_dias: dias,
    p_solo_contar: true,
  })
  if (error) throw new Error(`rpc solo_contar: ${error.code} ${error.message}`)
  return data
}

const creadas = []
try {
  // Estado de partida: ¿hay cuentas sin confirmar que NO sean nuestras?
  const antes = await contar(0)
  if (antes !== 0) {
    console.log(`ALTO: ya hay ${antes} cuenta(s) sin confirmar en la base.`)
    console.log('Esta prueba borra con p_dias = 0 y se las llevaria. No se ejecuta.')
    process.exit(1)
  }
  console.log('Punto de partida: 0 cuentas sin confirmar.\n')

  // 1. Una cuenta SIN confirmar
  const sinConf = `qa-sin-confirmar-${Date.now()}@nodo360-pruebas.invalid`
  const r1 = await db.auth.admin.createUser({ email: sinConf, password: clave(), email_confirm: false })
  if (r1.error) throw new Error('crear sin confirmar: ' + r1.error.message)
  creadas.push(r1.data.user.id)
  di((await contar(0)) === 1, 'una cuenta sin confirmar es candidata con p_dias = 0')
  di((await contar(7)) === 0, 'la misma cuenta NO es candidata con p_dias = 7 (es de hoy)')

  // 2. El rol la protege: si alguien le ha dado otro rol, no se borra sola
  await db.from('users').update({ role: 'instructor' }).eq('id', r1.data.user.id)
  di((await contar(0)) === 0, 'con rol instructor deja de ser candidata')
  await db.from('users').update({ role: 'student' }).eq('id', r1.data.user.id)
  di((await contar(0)) === 1, 'al volver a student, vuelve a serlo')

  // 3. Una cuenta CONFIRMADA nunca es candidata
  const conConf = `qa-confirmada-${Date.now()}@nodo360-pruebas.invalid`
  const r2 = await db.auth.admin.createUser({ email: conConf, password: clave(), email_confirm: true })
  if (r2.error) throw new Error('crear confirmada: ' + r2.error.message)
  creadas.push(r2.data.user.id)
  di((await contar(0)) === 1, 'la cuenta confirmada NO se suma a las candidatas')

  // Y su reflejo llego a public.users
  const { data: reflejo } = await db.from('users').select('email_confirmed_at').eq('id', r2.data.user.id).single()
  di(!!reflejo?.email_confirmed_at, 'la cuenta confirmada tiene email_confirmed_at en public.users')
  const { data: reflejo2 } = await db.from('users').select('email_confirmed_at').eq('id', r1.data.user.id).single()
  di(reflejo2?.email_confirmed_at === null, 'la cuenta sin confirmar lo tiene a NULL')

  // 4. El borrado de verdad
  const { data: borradas, error: eBorrar } = await db.rpc('borrar_cuentas_sin_confirmar', {
    p_dias: 0,
    p_solo_contar: false,
  })
  di(!eBorrar && borradas === 1, 'el borrado se lleva exactamente 1 cuenta', eBorrar ? eBorrar.message : `devolvio ${borradas}`)

  const { data: authSinConf } = await db.auth.admin.getUserById(r1.data.user.id)
  di(!authSinConf?.user, 'la cuenta sin confirmar ya no esta en auth.users')
  const { data: pubSinConf } = await db.from('users').select('id').eq('id', r1.data.user.id)
  di(pubSinConf.length === 0, 'ni en public.users (cayo por la clave ajena)')

  const { data: authConf } = await db.auth.admin.getUserById(r2.data.user.id)
  di(!!authConf?.user, 'la cuenta CONFIRMADA sigue ahi')
  di((await contar(0)) === 0, 'ya no queda ninguna candidata')
} catch (e) {
  fallos++
  console.log(`   *** FALLA ***  ${e.message}`)
} finally {
  console.log()
  for (const id of creadas) {
    const { data } = await db.auth.admin.getUserById(id)
    if (data?.user) await db.auth.admin.deleteUser(id)
  }
  let quedan = 0
  for (const id of creadas) {
    const { data } = await db.auth.admin.getUserById(id)
    const { data: fila } = await db.from('users').select('id').eq('id', id)
    if (data?.user || fila.length) quedan++
  }
  di(quedan === 0, 'limpieza: no queda ninguna cuenta de prueba')
}

console.log(`\n${fallos === 0 ? 'TODO CORRECTO' : 'REVISAR: ' + fallos + ' fallo(s)'}`)
process.exit(fallos === 0 ? 0 : 1)
