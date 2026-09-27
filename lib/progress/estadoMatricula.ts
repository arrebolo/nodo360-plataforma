/**
 * Que significa "completado" en una matricula.
 *
 * EL PROBLEMA QUE RESUELVE
 *   La ficha del curso deducia "ya completaste esto" de course_enrollments:
 *     yaCompletado = !!completed_at || progress_percentage >= 100
 *   Y completed_at no se borra cuando el curso crece, a proposito (ver
 *   recalcularMatriculasDelCurso). Resultado: paginas que anunciaban "ya
 *   completaste este curso" encima de un 67%, que es exactamente la clase de
 *   mensaje que hace dudar de todo lo demas que dice la pagina.
 *
 * LOS TRES ESTADOS
 *   'sin-empezar'  ni matricula ni nada hecho.
 *   'en-curso'     quedan lecciones por hacer y nunca se completo.
 *   'completado'   estan hechas todas las lecciones que el curso tiene HOY.
 *   'ampliado'     se completo en su dia y despues el curso crecio. El
 *                  certificado sigue siendo valido; lo que hay es contenido
 *                  nuevo, no progreso perdido.
 *
 * El cuarto es el que no existia, y es el que evita mentir en las dos
 * direcciones: ni "lo has completado" cuando quedan lecciones nuevas, ni
 * "te falta" a quien ya termino y tiene su certificado.
 */
export type EstadoMatricula = 'sin-empezar' | 'en-curso' | 'completado' | 'ampliado'

export interface DatosMatricula {
  /** La fecha que guarda course_enrollments, si la hay. */
  completadoEn: string | null
  /** Lecciones del curso AHORA MISMO. */
  leccionesTotales: number
  /** De esas, cuantas tiene hechas esta persona. */
  leccionesHechas: number
  /** Si existe la fila de matricula. */
  matriculado: boolean
}

export interface ResultadoMatricula {
  estado: EstadoMatricula
  /** Cuantas lecciones se han anadido desde que lo termino. 0 si no aplica. */
  leccionesNuevas: number
  /** Atajo: termino el curso en algun momento, con el temario que fuera. */
  loTermino: boolean
  /** Atajo: esta todo hecho a dia de hoy. */
  alDia: boolean
}

export function estadoDeLaMatricula(datos: DatosMatricula): ResultadoMatricula {
  const { completadoEn, leccionesTotales, leccionesHechas, matriculado } = datos

  const todoHecho = leccionesTotales > 0 && leccionesHechas >= leccionesTotales

  if (todoHecho) {
    return { estado: 'completado', leccionesNuevas: 0, loTermino: true, alDia: true }
  }

  if (completadoEn) {
    return {
      estado: 'ampliado',
      leccionesNuevas: Math.max(0, leccionesTotales - leccionesHechas),
      loTermino: true,
      alDia: false,
    }
  }

  if (!matriculado && leccionesHechas === 0) {
    return { estado: 'sin-empezar', leccionesNuevas: 0, loTermino: false, alDia: false }
  }

  return { estado: 'en-curso', leccionesNuevas: 0, loTermino: false, alDia: false }
}

/** El texto del aviso, para no escribirlo distinto en cada pagina. */
export function textoDeLaAmpliacion(leccionesNuevas: number): string {
  if (leccionesNuevas === 1) {
    return 'Desde que lo terminaste se ha añadido una lección nueva.'
  }
  return `Desde que lo terminaste se han añadido ${leccionesNuevas} lecciones nuevas.`
}
