import { createClient } from '@/lib/supabase/server'
import { courseHasQuiz, userPassedQuiz } from '@/lib/quiz/checkCourseQuiz'

/**
 * Los cursos en los que esta persona YA CUMPLE y todavía no tiene certificado.
 *
 * POR QUE EXISTE
 *   El certificado se emite en dos momentos —al marcar la última lección y al aprobar
 *   el examen— y hay un tercero que no estaba cubierto: llegar al 100 % por otro camino
 *   después de haber aprobado el examen. Pasa, por ejemplo, cuando se borra la lección
 *   que le faltaba: desde la #307 eso recalcula las matrículas, y quien tenía 1 de 2 se
 *   queda a 100 % sin volver a pasar por ninguno de los dos momentos.
 *
 *   Sin esto, cumple las condiciones y no tiene forma de pedirlo.
 *
 * LAS CONDICIONES SON LAS DE createCertificate, en su mismo orden y con su misma
 * expresión (`completed_at` o `progress_percentage >= 100`, y examen aprobado si el
 * curso tiene examen). Si aquí se usara otra, la pantalla ofrecería un botón que el
 * servidor rechaza, o callaría cuando se puede.
 */
export type CursoListo = {
  courseId: string
  titulo: string
  slug: string
}

export async function cursosListosParaCertificado(userId: string): Promise<CursoListo[]> {
  const supabase = await createClient()

  const { data: matriculas, error } = await supabase
    .from('course_enrollments')
    .select('course_id, completed_at, progress_percentage')
    .eq('user_id', userId)

  if (error) {
    console.error('[listosParaCertificado] matrículas:', error.message)
    return []
  }

  const cumplen = (matriculas ?? []).filter((m) => {
    const p = m.progress_percentage
    return m.completed_at !== null || (p !== null && p >= 100)
  })
  if (cumplen.length === 0) return []

  const ids = cumplen.map((m) => m.course_id as string)

  const { data: yaTiene, error: errorCerts } = await supabase
    .from('certificates')
    .select('course_id')
    .eq('user_id', userId)
    .eq('type', 'course')
    .in('course_id', ids)

  if (errorCerts) {
    console.error('[listosParaCertificado] certificados:', errorCerts.message)
    return []
  }

  const conCertificado = new Set((yaTiene ?? []).map((c) => c.course_id as string))
  const sinCertificado = ids.filter((id) => !conCertificado.has(id))
  if (sinCertificado.length === 0) return []

  const { data: cursos } = await supabase
    .from('courses')
    .select('id, title, slug')
    .in('id', sinCertificado)

  const listos: CursoListo[] = []
  for (const curso of cursos ?? []) {
    // El examen, solo si el curso tiene examen: exigir uno que no existe dejaría el
    // certificado inalcanzable, que es la trampa que documenta createCertificate.
    if (await courseHasQuiz(curso.id as string)) {
      if (!(await userPassedQuiz(userId, curso.id as string))) continue
    }
    listos.push({
      courseId: curso.id as string,
      titulo: curso.title as string,
      slug: curso.slug as string,
    })
  }

  return listos
}
