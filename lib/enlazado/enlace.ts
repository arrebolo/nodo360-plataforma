import { CURSOS_PUBLICADOS, NIVEL_EN_ESPANOL } from './cursos-publicados'
import type { SlugCurso, SlugLeccion } from './cursos-publicados'

/**
 * El único sitio donde se construye un enlace a un curso desde el blog o el
 * glosario.
 *
 * POR QUE UN SOLO SITIO
 *   Porque así «ningún enlace roto» es una propiedad del código y no una
 *   promesa. Si la lección no pertenece al curso, esta función devuelve el
 *   enlace del CURSO en lugar de una URL que da 404. El build lo habría
 *   detenido antes -ver scripts/validar-enlazado.ts- pero el respaldo existe
 *   para el caso en que alguien archive una lección en la base sin regenerar
 *   lib/enlazado/cursos-publicados.ts.
 *
 * Nada de hype (Principios #1 y #7): esta función no escribe reclamos, solo
 * devuelve el título real del curso, su nivel y su URL.
 */

export type DestinoCurso = {
  /** URL interna, siempre válida. */
  url: string
  /** Título del curso, tal como está en la base. */
  titulo: string
  /** «nivel basico», «nivel intermedio»… ya en español. */
  nivel: string
  /** true si el enlace apunta a una lección concreta y no al curso entero. */
  esLeccion: boolean
}

export function destinoDelCurso(
  curso: SlugCurso,
  leccion?: SlugLeccion
): DestinoCurso {
  const datos = CURSOS_PUBLICADOS[curso]

  // La lección solo se usa si de verdad pertenece a este curso.
  const lecciones = datos.lecciones as readonly string[]
  const leccionValida = leccion !== undefined && lecciones.includes(leccion)

  if (leccion !== undefined && !leccionValida && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[enlazado] La leccion "${leccion}" no pertenece a "${curso}". ` +
        'Se enlaza el curso. Regenera lib/enlazado/cursos-publicados.ts.'
    )
  }

  return {
    url: leccionValida ? `/cursos/${curso}/${leccion}` : `/cursos/${curso}`,
    titulo: datos.titulo,
    nivel: NIVEL_EN_ESPANOL[datos.nivel] ?? datos.nivel,
    esLeccion: leccionValida,
  }
}

/**
 * Los tres artículos para los que NO hay curso del tema.
 *
 * El bloque final no puede presentar el curso más cercano como si tratara el
 * tema del artículo: sería exactamente la promesa que el Principio #7 prohíbe.
 * Así que aquí se declara, artículo por artículo, qué se dice de verdad.
 *
 * `tema` es lo que falta. `queSiCubre` es qué parte relacionada explica el curso
 * que se enlaza. Los dos se pintan literalmente, sin adornos.
 */
export const SIN_CURSO_DEL_TEMA: Record<
  string,
  { tema: string; queSiCubre: string }
> = {
  'defi-para-principiantes': {
    tema: 'DeFi',
    queSiCubre:
      'cómo funcionan los contratos inteligentes sobre los que se construye, y las formas concretas en que el dinero sale de uno',
  },
  'dao-organizaciones-descentralizadas': {
    tema: 'gobernanza descentralizada',
    queSiCubre:
      'qué son los tokens, cómo se mira un proyecto antes de entrar y dónde aporta Web3 y dónde no',
  },
}

/**
 * Staking va aparte y se dice de frente: la lección `otras-formas-de-consenso`
 * SÍ explica la prueba de participación, que es el mecanismo del que sale la
 * recompensa. No hay curso de staking, pero el fondo del asunto está cubierto.
 */
export const CUBIERTO_EN_PARTE: Record<string, { tema: string; queSiCubre: string }> = {
  'staking-criptomonedas-guia': {
    tema: 'staking',
    queSiCubre:
      'la prueba de participación, que es el mecanismo del que sale la recompensa',
  },
}
