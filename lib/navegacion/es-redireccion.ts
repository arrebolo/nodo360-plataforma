/**
 * ¿Esta excepción es en realidad una navegación?
 *
 * `redirect()` y `notFound()` NO devuelven: lanzan. Es así por diseño —es la única
 * forma de que corten la ejecución— y el framework las reconoce por su `digest`.
 * Pero si alguien pone un `try/catch` en medio, las atrapa y la navegación se queda
 * sin hacer. Peor: se le enseña a la persona un error que no existe.
 *
 * EL CASO QUE LO MOTIVA
 *   Al crear un curso, el instructor veía «Ha ocurrido un error. Por favor intenta de
 *   nuevo» aunque el curso se creaba bien, y en la consola aparecía
 *   «Error al guardar: Error: NEXT_REDIRECT». El formulario envolvía la llamada a la
 *   acción de servidor en un try/catch y pasaba el mensaje por `translateError()`,
 *   que al no reconocer «NEXT_REDIRECT» devolvía el texto genérico.
 *
 * TRES SITIOS LO COMPROBABAN YA, CADA UNO A SU MANERA, y a un cuarto se le había
 * olvidado. De ahí que esto viva en un solo sitio: la regla es «si es una
 * navegación, se relanza», y no debería dependen de que quien escriba el siguiente
 * formulario se acuerde.
 *
 * Se mira el `digest` y, como respaldo, el mensaje: en producción la minificación
 * conserva el digest, que es el que el framework usa de verdad.
 */

const PREFIJOS = ['NEXT_REDIRECT', 'NEXT_NOT_FOUND'] as const

export function esRedireccion(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const e = error as { digest?: unknown; message?: unknown }

  if (typeof e.digest === 'string' && PREFIJOS.some((p) => e.digest === p || (e.digest as string).startsWith(p))) {
    return true
  }

  if (typeof e.message === 'string' && PREFIJOS.some((p) => (e.message as string).includes(p))) {
    return true
  }

  return false
}

/**
 * Relanza la excepción si era una navegación, y devuelve si lo era.
 *
 * Pensado para la primera línea de un `catch`:
 *
 *     } catch (error) {
 *       relanzarSiEsRedireccion(error)
 *       // de aqui en adelante, el error es un error de verdad
 *     }
 */
export function relanzarSiEsRedireccion(error: unknown): void {
  if (esRedireccion(error)) throw error
}
