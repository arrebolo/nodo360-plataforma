/**
 * Borrar y reordenar módulos y lecciones: la lógica, una sola vez.
 *
 * POR QUE EXISTE
 *   Estas cuatro acciones vivían solo en `/api/admin/{modules,lessons}/...` con
 *   `exigirAdminEnApi()`, así que los cuatro botones del editor del instructor —subir,
 *   bajar, borrar módulo, borrar lección— recibían **403**. Para que el instructor pueda
 *   ordenar su propio curso hacen falta rutas suyas, y lo que no puede haber es dos
 *   copias del reordenado: es un intercambio en tres pasos con un índice temporal, y la
 *   segunda copia se desfasaría.
 *
 *   Aquí está el trabajo; cada ruta pone su permiso: `/api/admin/...` exige admin y
 *   `/api/instructor/...` exige que el curso sea tuyo (lib/courses/permiso-sobre-el-curso).
 *
 * EL PADRE SE DERIVA DE LA FILA, NO DEL CUERPO DE LA PETICION
 *   El reordenado recibía `courseId` (o `moduleId`) en el cuerpo y buscaba con él el
 *   vecino con el que intercambiar. Quien llama no decide a qué curso pertenece un
 *   módulo: se lee de la propia fila. Sin esto, comprobar el permiso sobre el curso del
 *   cuerpo no probaría nada sobre el módulo que se mueve.
 */
import { createAdminClient } from '@/lib/supabase/admin'

export type Direccion = 'up' | 'down'

export type Resultado =
  | { ok: true }
  | { ok: false; error: string; estado: number }

const mal = (error: string, estado: number): Resultado => ({ ok: false, error, estado })

/** El módulo con el curso al que pertenece de verdad. */
export async function moduloConSuCurso(
  moduleId: string
): Promise<{ id: string; course_id: string; order_index: number } | null> {
  if (!moduleId) return null
  const { data } = await createAdminClient()
    .from('modules')
    .select('id, course_id, order_index')
    .eq('id', moduleId)
    .maybeSingle()
  return (data as { id: string; course_id: string; order_index: number } | null) ?? null
}

/**
 * La lección con su módulo y su curso.
 *
 * El curso sale del MODULO, no de `lessons.course_id`: la relación que manda es
 * lección → módulo → curso, y `lessons.course_id` es una copia que podría quedarse
 * desfasada si una lección cambia de módulo.
 */
export async function leccionConSuCurso(
  lessonId: string
): Promise<{ id: string; module_id: string; course_id: string; order_index: number } | null> {
  if (!lessonId) return null
  const admin = createAdminClient()
  const { data: leccion } = await admin
    .from('lessons')
    .select('id, module_id, course_id, order_index')
    .eq('id', lessonId)
    .maybeSingle()
  if (!leccion) return null

  const l = leccion as { id: string; module_id: string | null; course_id: string | null; order_index: number }
  let courseId = l.course_id ?? ''
  if (l.module_id) {
    const { data: modulo } = await admin
      .from('modules')
      .select('course_id')
      .eq('id', l.module_id)
      .maybeSingle()
    if (modulo?.course_id) courseId = modulo.course_id as string
  }
  if (!courseId) return null

  return { id: l.id, module_id: l.module_id ?? '', course_id: courseId, order_index: l.order_index }
}

export async function borrarModulo(moduleId: string): Promise<Resultado> {
  const { error } = await createAdminClient().from('modules').delete().eq('id', moduleId)
  if (error) {
    console.error('[contenido] borrarModulo:', error.message)
    return mal('No se pudo eliminar el módulo: ' + error.message, 500)
  }
  return { ok: true }
}

export async function borrarLeccion(lessonId: string): Promise<Resultado> {
  const { error } = await createAdminClient().from('lessons').delete().eq('id', lessonId)
  if (error) {
    console.error('[contenido] borrarLeccion:', error.message)
    return mal('No se pudo eliminar la lección: ' + error.message, 500)
  }
  return { ok: true }
}

/**
 * Intercambiar dos filas de orden, en tres pasos.
 *
 * `order_index` es único dentro del padre, así que no se pueden escribir los dos valores
 * definitivos de golpe: el primer UPDATE chocaría con el que todavía ocupa el sitio. Se
 * aparca el que se mueve en un índice temporal, se mueve el vecino al hueco y luego se
 * baja el primero a su destino. Si el paso 2 falla, se devuelve el primero a su sitio.
 */
async function intercambiar(
  tabla: 'modules' | 'lessons',
  columnaDelPadre: 'course_id' | 'module_id',
  padre: string,
  id: string,
  indiceActual: number,
  direccion: Direccion
): Promise<Resultado> {
  const admin = createAdminClient()
  const indiceNuevo = direccion === 'up' ? indiceActual - 1 : indiceActual + 1

  const { data: vecino } = await admin
    .from(tabla)
    .select('id')
    .eq(columnaDelPadre, padre)
    .eq('order_index', indiceNuevo)
    .maybeSingle()

  if (!vecino) return mal('No se puede mover más en esa dirección.', 400)

  // Un índice temporal que no puede chocar con ninguno real.
  const TEMPORAL = -1
  const paso1 = await admin.from(tabla).update({ order_index: TEMPORAL }).eq('id', id)
  if (paso1.error) {
    console.error('[contenido] intercambiar paso 1:', paso1.error.message)
    return mal('No se pudo reordenar: ' + paso1.error.message, 500)
  }

  const paso2 = await admin.from(tabla).update({ order_index: indiceActual }).eq('id', (vecino as { id: string }).id)
  if (paso2.error) {
    console.error('[contenido] intercambiar paso 2:', paso2.error.message)
    // Devolver el primero a su sitio: si no, se queda en -1 y desaparece del orden.
    await admin.from(tabla).update({ order_index: indiceActual }).eq('id', id)
    return mal('No se pudo reordenar: ' + paso2.error.message, 500)
  }

  const paso3 = await admin.from(tabla).update({ order_index: indiceNuevo }).eq('id', id)
  if (paso3.error) {
    console.error('[contenido] intercambiar paso 3:', paso3.error.message)
    return mal('No se pudo reordenar: ' + paso3.error.message, 500)
  }

  return { ok: true }
}

export async function moverModulo(
  modulo: { id: string; course_id: string; order_index: number },
  direccion: Direccion
): Promise<Resultado> {
  return intercambiar('modules', 'course_id', modulo.course_id, modulo.id, modulo.order_index, direccion)
}

export async function moverLeccion(
  leccion: { id: string; module_id: string; order_index: number },
  direccion: Direccion
): Promise<Resultado> {
  if (!leccion.module_id) return mal('Esta lección no está en ningún módulo.', 400)
  return intercambiar('lessons', 'module_id', leccion.module_id, leccion.id, leccion.order_index, direccion)
}

/** `up` o `down`, y nada más: lo que llega en el cuerpo no se usa tal cual. */
export function direccionValida(valor: unknown): Direccion | null {
  return valor === 'up' || valor === 'down' ? valor : null
}
