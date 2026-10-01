/**
 * Los parámetros de la URL, incluidos los repetidos.
 *
 *   npx tsx scripts/probar-parametros-de-la-url.mts
 *
 * El fallo: `?search=a&search=b` llega como array y `busqueda.trim()` lanzaba un 500.
 * La pantalla no se puede probar desde aquí —necesita sesión de administración— pero
 * la normalización sí, y es donde estaba el problema.
 */
const { unSoloValor, paginaPedida } = await import('../lib/admin/parametros.ts')

let fallos = 0
const di = (ok: boolean, t: string, extra = '') => {
  if (!ok) fallos++
  console.log(`   ${ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)
}

console.log('\n=== unSoloValor ===')
di(unSoloValor('hola') === 'hola', 'un valor normal')
di(unSoloValor(['a', 'b']) === 'a', 'repetido: se toma el primero', JSON.stringify(unSoloValor(['a', 'b'])))
di(unSoloValor([]) === '', 'array vacio -> cadena vacia')
di(unSoloValor(undefined) === '', 'undefined -> cadena vacia')
di(unSoloValor(null) === '', 'null -> cadena vacia')
di(typeof unSoloValor(['x']) === 'string', 'siempre devuelve texto, nunca un array')
// Y lo que importa: que lo devuelto se pueda usar sin reventar
di((() => { try { unSoloValor(['a', 'b']).trim(); return true } catch { return false } })(),
  '.trim() sobre el resultado no lanza (era el 500)')

console.log('\n=== paginaPedida ===')
di(paginaPedida('3') === 3, 'página 3')
di(paginaPedida(undefined) === 1, 'sin parámetro -> 1')
di(paginaPedida('abc') === 1, '«abc» -> 1 (antes era NaN)', String(paginaPedida('abc')))
di(paginaPedida('0') === 1, '«0» -> 1')
di(paginaPedida('-3') === 1, '«-3» -> 1')
di(paginaPedida(['2', '9']) === 2, 'repetido: el primero', String(paginaPedida(['2', '9'])))
di(Number.isFinite(paginaPedida('abc')), 'nunca devuelve NaN')

console.log(fallos === 0 ? '\n   TODO CORRECTO\n' : `\n   ${fallos} fallan\n`)
process.exit(fallos === 0 ? 0 : 1)
