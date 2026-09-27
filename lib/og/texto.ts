/**
 * Ajuste de texto para las imagenes Open Graph.
 *
 * Una tarjeta de 1200x630 no puede reflowear: si el titulo no cabe, se sale y
 * queda cortado a medias. Asi que el tamano de letra se elige por longitud y,
 * pasado un limite, se corta por palabra con puntos suspensivos.
 */

/** Corta por palabra, nunca a mitad de una, y anade … si ha cortado. */
export function recortar(texto: string, maximo: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (limpio.length <= maximo) return limpio

  const cortado = limpio.slice(0, maximo)
  const ultimoEspacio = cortado.lastIndexOf(' ')
  // Si la primera palabra ya es mas larga que el limite, se corta a lo bruto:
  // preferible a devolver una cadena vacia.
  const base = ultimoEspacio > maximo * 0.5 ? cortado.slice(0, ultimoEspacio) : cortado
  return `${base.replace(/[\s.,;:–—-]+$/, '')}…`
}

/**
 * Tamano de letra del titular segun lo que ocupa.
 *
 * Los cortes salen de medir con Inter Bold a 1200 px de ancho y dos lineas de
 * alto util. Se prueban los extremos reales del catalogo (el curso y el termino
 * de titulo mas largo) en scripts/og-muestras.mjs.
 */
export function tamanoTitular(texto: string): number {
  const n = texto.length
  if (n <= 24) return 86
  if (n <= 38) return 74
  if (n <= 56) return 62
  if (n <= 80) return 52
  if (n <= 110) return 44
  return 38
}

/** Lo mismo para la linea secundaria, que siempre va por debajo del titular. */
export function tamanoSubtitulo(texto: string): number {
  const n = texto.length
  if (n <= 60) return 32
  if (n <= 100) return 28
  return 24
}

/** Limite duro del titular: por encima de esto no cabe ni al tamano minimo. */
export const MAXIMO_TITULAR = 140

/** Limite del subtitulo, el que pide el encargo para las definiciones. */
export const MAXIMO_SUBTITULO = 120

/** El nivel del curso, en la palabra que lee una persona. */
export function nivelEnCastellano(nivel: string | null | undefined): string | null {
  switch (nivel) {
    case 'beginner':
      return 'Principiante'
    case 'intermediate':
      return 'Intermedio'
    case 'advanced':
      return 'Avanzado'
    default:
      return null
  }
}
