/**
 * Quién firma un curso.
 *
 * Hasta la migración 121a esto se decidía preguntando por el ROL DE UNA PERSONA:
 *
 *     const isNodo360 = !course.instructor_id || course.instructor?.role === 'admin'
 *
 * Y por eso `users.role` tenía que ser legible por la clave anónima, que es
 * pública. Mientras eso siguiera así no se podía cerrar la enumeración de
 * cuentas: medido, filtrar por una columna sin permiso de lectura da 42501, así
 * que revocar `role` es lo que convierte «dime quiénes son los admin» en una
 * pregunta que no se puede hacer.
 *
 * Ahora la firma es una columna del propio curso, `firmado_por_la_plataforma`,
 * que `anon` ya puede leer y que no dice nada de ninguna persona. Solo la
 * administración la cambia, y lo impide un trigger, no la pantalla.
 *
 * LAS DOS MITADES HACEN FALTA. No basta con dejar de leer el rol: si el
 * servidor sigue enviando el objeto del autor, su nombre y apellido viajan en
 * el HTML de todas las fichas aunque la tarjeta pinte «Creado por Nodo360».
 * Está en el código fuente de la página, al alcance de cualquiera. Por eso el
 * autor se quita EN EL SERVIDOR, en la consulta, y no en el componente.
 */

/** Lo mínimo que hay que saber de un curso para decidir si lleva autor. */
type CursoConFirma = {
  firmado_por_la_plataforma?: boolean | null
  instructor?: unknown
}

/**
 * Deja el curso sin objeto de autor cuando lo firma la plataforma.
 *
 * Se aplica en las lecturas públicas —el catálogo, la ficha y las sugerencias—,
 * que son las que sirve una página a quien no ha iniciado sesión. Las pantallas
 * de instructor y de administración necesitan saber de quién es cada curso y no
 * pasan por aquí.
 *
 * Devuelve un objeto nuevo; no toca el que recibe.
 */
export function sinElAutorSiFirmaLaPlataforma<C extends CursoConFirma>(curso: C): C {
  if (!curso.firmado_por_la_plataforma) return curso
  return { ...curso, instructor: null }
}

/** La misma cosa sobre una lista, que es como llegan el catálogo y las sugerencias. */
export function sinLosAutoresQueFirmaLaPlataforma<C extends CursoConFirma>(cursos: C[]): C[] {
  return cursos.map(sinElAutorSiFirmaLaPlataforma)
}
