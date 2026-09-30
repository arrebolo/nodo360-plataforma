/**
 * El buzón al que llega un correo, en forma canónica.
 *
 * Supabase impide repetir el correo EXACTO, y eso no basta: en Gmail los puntos
 * del nombre no cuentan y el sufijo `+algo` tampoco, así que
 * `cursos.nodo360@gmail.com`, `cursosnodo360@gmail.com` y
 * `cursos.nodo360+x@gmail.com` son el MISMO buzón. Con eso, una persona abre
 * tantas cuentas como quiera y se salta, por ejemplo, el límite de intentos del
 * examen de instructor, que es por cuenta.
 *
 * - **Gmail y Googlemail**: fuera los puntos, fuera el sufijo `+algo`, y el
 *   dominio se unifica en `gmail.com` porque los dos llegan al mismo sitio.
 * - **Cualquier otro dominio**: solo fuera el sufijo `+algo`. Los puntos sí
 *   cuentan: en la mayoría de servidores son parte del nombre, y quitarlos
 *   fusionaría buzones de personas distintas.
 *
 * ESTA COPIA NO ES LA AUTORIDAD. La regla la aplica la base de datos, con
 * `public.correo_normalizado()` y el trigger `trg_un_buzon_una_cuenta`
 * (migración 106), porque el registro con Google no pasa por este código: la
 * cuenta la crea Supabase. Esto sirve para poder dar un mensaje claro en el
 * formulario antes de intentarlo. Si las dos versiones divergieran, la que manda
 * es la de la base; los casos de prueba están en la migración.
 */
export function correoNormalizado(correo: string): string {
  const limpio = (correo ?? '').trim().toLowerCase()
  const arroba = limpio.lastIndexOf('@')
  if (arroba <= 0) return limpio

  const nombre = limpio.slice(0, arroba)
  const dominio = limpio.slice(arroba + 1)
  const sinSufijo = nombre.split('+')[0]

  if (dominio === 'gmail.com' || dominio === 'googlemail.com') {
    return `${sinSufijo.replace(/\./g, '')}@gmail.com`
  }

  return `${sinSufijo}@${dominio}`
}
