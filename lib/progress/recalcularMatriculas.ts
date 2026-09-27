import { createClient } from '@/lib/supabase/server'

/**
 * Pone al dia el progreso de todas las matriculas de un curso.
 *
 * POR QUE HACE FALTA
 *   progress_percentage vive guardado en course_enrollments y solo se
 *   recalculaba al completar una leccion (app/api/progress). Ampliar un curso
 *   de 6 a 9 lecciones dejaba obsoletas, en ese mismo instante, todas las
 *   matriculas de quien no volviera: seguian diciendo 100% con 6 de 9 hechas.
 *   Se arreglo dos veces a mano, en las migraciones 047 y 052, escribiendo los
 *   porcentajes uno a uno. Esto hace lo mismo, solo que sin esperar a que
 *   alguien se de cuenta.
 *
 * POR QUE NO TOCA completed_at
 *   Ni para ponerlo ni para quitarlo, y las dos mitades importan.
 *
 *   No lo quita porque el certificado acredita lo que la persona completo
 *   entonces, sobre el temario de entonces, y sigue siendo valido. Borrarlo le
 *   diria "has perdido progreso" a quien no ha perdido nada: es contenido
 *   nuevo, no un retroceso. Es la postura que dejo escrita la migracion 047 y
 *   la que sostiene la pagina del certificado.
 *
 *   Y no lo pone porque escribir completed_at es lo que emite un certificado, y
 *   esa decision tiene una sola puerta: createCertificate, que comprueba el
 *   examen. Un recalculo que ademas certificara seria justo el fallo que quito
 *   la migracion 070, con otro disfraz.
 *
 *   Que la matricula diga "completada" con lecciones sin hacer deja de ser un
 *   problema en cuanto nadie deduce "completado" de ese campo a solas: ver
 *   estadoDeLaMatricula() en @/lib/progress/estadoMatricula.
 */
export async function recalcularMatriculasDelCurso(
  courseId: string
): Promise<{ revisadas: number; actualizadas: number }> {
  const supabase = await createClient()

  const { data: lecciones, error: errorLecciones } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)

  if (errorLecciones) {
    console.error('❌ [recalcularMatriculas] Error leyendo lecciones:', errorLecciones.message)
    return { revisadas: 0, actualizadas: 0 }
  }

  const idsLeccion = (lecciones ?? []).map((l) => l.id)
  const total = idsLeccion.length

  const { data: matriculas, error: errorMatriculas } = await supabase
    .from('course_enrollments')
    .select('user_id, progress_percentage')
    .eq('course_id', courseId)

  if (errorMatriculas || !matriculas?.length) {
    if (errorMatriculas) {
      console.error('❌ [recalcularMatriculas] Error leyendo matriculas:', errorMatriculas.message)
    }
    return { revisadas: 0, actualizadas: 0 }
  }

  // Un curso sin lecciones deja a todo el mundo a 0: no hay nada que completar.
  const progreso = total
    ? (
        await supabase
          .from('user_progress')
          .select('user_id, lesson_id')
          .eq('is_completed', true)
          .in('lesson_id', idsLeccion)
      ).data ?? []
    : []

  const hechasPorPersona = new Map<string, number>()
  for (const fila of progreso) {
    hechasPorPersona.set(fila.user_id, (hechasPorPersona.get(fila.user_id) ?? 0) + 1)
  }

  let actualizadas = 0

  for (const matricula of matriculas) {
    const hechas = hechasPorPersona.get(matricula.user_id) ?? 0
    const porcentaje = total > 0 ? Math.round((hechas / total) * 100) : 0

    // Solo se escribe si cambia: un recalculo no tiene por que tocar filas.
    if (porcentaje === matricula.progress_percentage) continue

    const { error } = await supabase
      .from('course_enrollments')
      .update({ progress_percentage: porcentaje })
      .eq('user_id', matricula.user_id)
      .eq('course_id', courseId)

    if (error) {
      console.error('❌ [recalcularMatriculas] Error actualizando matricula:', error.message)
      continue
    }
    actualizadas++
  }

  if (actualizadas > 0) {
    console.log(
      `♻️ [recalcularMatriculas] Curso ${courseId.slice(0, 8)}: ${actualizadas} de ${matriculas.length} matriculas al dia (${total} lecciones)`
    )
  }

  return { revisadas: matriculas.length, actualizadas }
}
