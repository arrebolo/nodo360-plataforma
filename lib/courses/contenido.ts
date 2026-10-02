/**
 * Borrar y reordenar módulos y lecciones: la lógica, una sola vez.
 *
 * POR QUE EXISTE
 *   Estas cuatro acciones vivían solo en `/api/admin/{modules,lessons}/...` con
 *   `exigirAdminEnApi()`, así que los cuatro botones del editor del instructor —subir,
 *   bajar, borrar módulo, borrar lección— recibían **403**. Para que el instructor pueda
 *   ordenar su propio curso hacen falta rutas suyas, y lo que no puede haber es dos
 *   copias del reordenado: es un intercambio con índice temporal, y la segunda copia se
 *   desfasaría.
 *
 *   Aquí está el trabajo; cada ruta pone su permiso: `/api/admin/...` exige admin y
 *   `/api/instructor/...` exige que el curso sea tuyo (lib/courses/permiso-sobre-el-curso).
 *
 * EL PADRE SE DERIVA DE LA FILA, NO DEL CUERPO DE LA PETICION
 *   El reordenado recibía `courseId` (o `moduleId`) en el cuerpo y buscaba con él el
 *   vecino con el que intercambiar. Quien llama no decide a qué curso pertenece un
 *   módulo: se lee de la propia fila. Sin esto, comprobar el permiso sobre el curso del
 *   cuerpo no probaría nada sobre el módulo que se mueve.
 *
 * BORRAR CONTENIDO CAMBIA EL PROGRESO DE OTRA GENTE
 *   `progress_percentage` vive guardado en `course_enrollments` y es «hechas / total».
 *   Al quitar una lección, el total baja: quien tenía 1 de 2 pasa a tener 1 de 1. Si no
 *   se recalcula, su matrícula se queda diciendo 50 % para siempre. La ruta de admin ya
 *   lo hacía y yo lo perdí al refactorizar; está restaurado, y ahora también al borrar
 *   un módulo, que se lleva sus lecciones por delante.
 *
 *   Lo que el recálculo NO hace, a propósito, es poner `completed_at` ni emitir
 *   certificados: ver la cabecera de lib/progress/recalcularMatriculas.ts y la
 *   migración 070. El certificado tiene una sola puerta, `createCertificate`, que exige
 *   haber aprobado el examen final.
 *
 * SIN HUECOS EN order_index
 *   Al borrar, los hermanos que quedan se renumeran 0..n-1 en la misma operación. Un
 *   hueco no es cosmético: el escalonado de acceso buscaba el módulo anterior como
 *   «order_index - 1», y con un hueco no lo encontraba y abría el módulo sin pedir
 *   nada. Eso se ha arreglado también en lib/progress/checkLessonAccess.ts —el anterior
 *   es el inmediatamente anterior en orden, no el de índice uno menos—, pero las dos
 *   cosas hacen falta: la numeración limpia y un control que no dependa de ella.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { recalcularMatriculasDelCurso } from '@/lib/progress/recalcularMatriculas'

export type Direccion = 'up' | 'down'

export type Resultado =
  | { ok: true }
  | { ok: false; error: string; estado: number }

const mal = (error: string, estado: number): Resultado => ({ ok: false, error, estado })

export type Modulo = { id: string; course_id: string; order_index: number }
export type Leccion = { id: string; module_id: string; course_id: string; order_index: number }

/** El módulo con el curso al que pertenece de verdad. */
export async function moduloConSuCurso(moduleId: string): Promise<Modulo | null> {
  if (!moduleId) return null
  const { data } = await createAdminClient()
    .from('modules')
    .select('id, course_id, order_index')
    .eq('id', moduleId)
    .maybeSingle()
  return (data as Modulo | null) ?? null
}

/**
 * La lección con su módulo y su curso.
 *
 * El curso sale del MODULO, no de `lessons.course_id`: la relación que manda es
 * lección → módulo → curso, y `lessons.course_id` es una copia que podría quedarse
 * desfasada si una lección cambia de módulo.
 */
export async function leccionConSuCurso(lessonId: string): Promise<Leccion | null> {
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

/**
 * Renumera 0..n-1 lo que quede bajo un padre, cerrando los huecos.
 *
 * De menor a mayor y escribiendo solo lo que cambia: así cada destino está libre antes
 * de usarlo —se van bajando valores— y no choca con el índice único del padre.
 */
async function renumerar(
  tabla: 'modules' | 'lessons',
  columnaDelPadre: 'course_id' | 'module_id',
  padre: string
): Promise<void> {
  if (!padre) return
  const admin = createAdminClient()
  const { data: filas, error } = await admin
    .from(tabla)
    .select('id, order_index')
    .eq(columnaDelPadre, padre)
    .order('order_index', { ascending: true })

  if (error) {
    console.error(`[contenido] renumerar ${tabla}:`, error.message)
    return
  }

  let esperado = 0
  for (const fila of (filas ?? []) as { id: string; order_index: number }[]) {
    if (fila.order_index !== esperado) {
      const { error: e } = await admin.from(tabla).update({ order_index: esperado }).eq('id', fila.id)
      if (e) {
        console.error(`[contenido] renumerar ${tabla} ${fila.id}:`, e.message)
        return
      }
    }
    esperado++
  }
}

export async function borrarModulo(modulo: Modulo): Promise<Resultado> {
  const { error } = await createAdminClient().from('modules').delete().eq('id', modulo.id)
  if (error) {
    console.error('[contenido] borrarModulo:', error.message)
    return mal('No se pudo eliminar el módulo: ' + error.message, 500)
  }

  await renumerar('modules', 'course_id', modulo.course_id)
  // Un módulo se lleva sus lecciones, así que el total del curso baja.
  await recalcularMatriculasDelCurso(modulo.course_id)
  return { ok: true }
}

export async function borrarLeccion(leccion: Leccion): Promise<Resultado> {
  // El curso y el módulo se guardan ANTES de borrar: después ya no hay fila que
  // preguntar, y los dos hacen falta para dejar las cosas en su sitio.
  const { course_id, module_id } = leccion

  const { error } = await createAdminClient().from('lessons').delete().eq('id', leccion.id)
  if (error) {
    console.error('[contenido] borrarLeccion:', error.message)
    return mal('No se pudo eliminar la lección: ' + error.message, 500)
  }

  await renumerar('lessons', 'module_id', module_id)
  await recalcularMatriculasDelCurso(course_id)
  return { ok: true }
}

/**
 * El vecino con el que intercambiar: el INMEDIATAMENTE anterior o posterior en orden.
 *
 * Antes se buscaba `order_index = actual ± 1`. Con un hueco —que es lo que dejaba un
 * borrado— no hay nadie en ese índice exacto y el botón contestaba «no se puede mover
 * más» teniendo vecino. Ahora se pide el más cercano por el lado que toca.
 */
async function vecino(
  tabla: 'modules' | 'lessons',
  columnaDelPadre: 'course_id' | 'module_id',
  padre: string,
  indiceActual: number,
  direccion: Direccion
): Promise<{ id: string; order_index: number } | null> {
  const admin = createAdminClient()
  const consulta = admin
    .from(tabla)
    .select('id, order_index')
    .eq(columnaDelPadre, padre)
    .limit(1)

  const { data } =
    direccion === 'up'
      ? await consulta.lt('order_index', indiceActual).order('order_index', { ascending: false })
      : await consulta.gt('order_index', indiceActual).order('order_index', { ascending: true })

  return ((data ?? [])[0] as { id: string; order_index: number } | undefined) ?? null
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
  const elVecino = await vecino(tabla, columnaDelPadre, padre, indiceActual, direccion)
  if (!elVecino) return mal('No se puede mover más en esa dirección.', 400)

  const TEMPORAL = -1
  const paso1 = await admin.from(tabla).update({ order_index: TEMPORAL }).eq('id', id)
  if (paso1.error) {
    console.error('[contenido] intercambiar paso 1:', paso1.error.message)
    return mal('No se pudo reordenar: ' + paso1.error.message, 500)
  }

  const paso2 = await admin.from(tabla).update({ order_index: indiceActual }).eq('id', elVecino.id)
  if (paso2.error) {
    console.error('[contenido] intercambiar paso 2:', paso2.error.message)
    // Devolver el primero a su sitio: si no, se queda en -1 y desaparece del orden.
    await admin.from(tabla).update({ order_index: indiceActual }).eq('id', id)
    return mal('No se pudo reordenar: ' + paso2.error.message, 500)
  }

  const paso3 = await admin.from(tabla).update({ order_index: elVecino.order_index }).eq('id', id)
  if (paso3.error) {
    console.error('[contenido] intercambiar paso 3:', paso3.error.message)
    return mal('No se pudo reordenar: ' + paso3.error.message, 500)
  }

  return { ok: true }
}

export async function moverModulo(modulo: Modulo, direccion: Direccion): Promise<Resultado> {
  return intercambiar('modules', 'course_id', modulo.course_id, modulo.id, modulo.order_index, direccion)
}

export async function moverLeccion(leccion: Leccion, direccion: Direccion): Promise<Resultado> {
  if (!leccion.module_id) return mal('Esta lección no está en ningún módulo.', 400)
  return intercambiar('lessons', 'module_id', leccion.module_id, leccion.id, leccion.order_index, direccion)
}

/** `up` o `down`, y nada más: lo que llega en el cuerpo no se usa tal cual. */
export function direccionValida(valor: unknown): Direccion | null {
  return valor === 'up' || valor === 'down' ? valor : null
}
