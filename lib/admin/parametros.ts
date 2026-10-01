/**
 * Lo que llega por la URL no es texto: puede llegar repetido.
 *
 * `?search=a&search=b` llega como `['a','b']`, y un tipo `search?: string` no lo
 * impide —TypeScript se queda tranquilo y `busqueda.trim()` revienta en ejecución con
 * un 500—. Es trivial de provocar: un enlace mal formado, o pulsar dos veces en un
 * formulario.
 *
 * Esto vive aparte de la pantalla para poder probarlo: una página de Next no se puede
 * importar desde un script, y la pantalla de usuarios solo se sirve con sesión de
 * administración.
 */

/** El primer valor de un parámetro, o vacío. Un parámetro repetido no tumba nada. */
export function unSoloValor(v: string | string[] | undefined | null): string {
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : ''
  return typeof v === 'string' ? v : ''
}

/**
 * El número de página pedido, saneado.
 *
 * `?page=abc` daba `NaN`, y con `NaN` el rango de la consulta sale sin sentido.
 * `?page=-3` o `?page=0` tampoco existen. Por debajo de 1, se vuelve a 1.
 */
export function paginaPedida(v: string | string[] | undefined | null): number {
  const n = parseInt(unSoloValor(v) || '1', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}
