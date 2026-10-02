import { createClient } from '@/lib/supabase/server'

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
 *
 * EN LOTE, NO CURSO A CURSO
 *   La primera versión preguntaba por cada curso: sus módulos, si esos módulos tienen
 *   preguntas y si hay un intento aprobado. Cuatro consultas en serie por curso, y
 *   quien tiene seis cursos acabados pagaba veinticuatro viajes para pintar una lista
 *   que casi siempre está vacía. Ahora son tres consultas en total, pase lo que pase:
 *   los módulos de todos los candidatos, qué módulos tienen preguntas, y los intentos
 *   aprobados de esta persona en esos módulos.
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
  const candidatos = ids.filter((id) => !conCertificado.has(id))
  if (candidatos.length === 0) return []

  // ── El examen, en lote ─────────────────────────────────────────────────────
  const { data: modulos, error: errorModulos } = await supabase
    .from('modules')
    .select('id, course_id')
    .in('course_id', candidatos)

  if (errorModulos) {
    console.error('[listosParaCertificado] módulos:', errorModulos.message)
    return []
  }

  const cursoDelModulo = new Map(
    (modulos ?? []).map((m) => [m.id as string, m.course_id as string])
  )
  const idsDeModulo = [...cursoDelModulo.keys()]

  /** Cursos con examen, y cursos en los que esta persona lo aprobó. */
  const conExamen = new Set<string>()
  const aprobados = new Set<string>()

  if (idsDeModulo.length > 0) {
    const [preguntas, intentos] = await Promise.all([
      supabase.from('quiz_questions').select('module_id').in('module_id', idsDeModulo),
      supabase
        .from('quiz_attempts')
        .select('module_id')
        .eq('user_id', userId)
        .eq('passed', true)
        .in('module_id', idsDeModulo),
    ])

    if (preguntas.error) {
      // Si no se puede saber si hay examen, no se ofrece nada: ofrecer de más sería un
      // botón que el servidor rechaza.
      console.error('[listosParaCertificado] preguntas:', preguntas.error.message)
      return []
    }
    if (intentos.error) {
      console.error('[listosParaCertificado] intentos:', intentos.error.message)
      return []
    }

    for (const p of preguntas.data ?? []) {
      const curso = cursoDelModulo.get(p.module_id as string)
      if (curso) conExamen.add(curso)
    }
    for (const i of intentos.data ?? []) {
      const curso = cursoDelModulo.get(i.module_id as string)
      if (curso) aprobados.add(curso)
    }
  }

  // Un curso SIN examen no exige examen: exigir uno que no existe dejaría el
  // certificado inalcanzable, que es la trampa que documenta createCertificate.
  const listosIds = candidatos.filter((id) => !conExamen.has(id) || aprobados.has(id))
  if (listosIds.length === 0) return []

  const { data: cursos, error: errorCursos } = await supabase
    .from('courses')
    .select('id, title, slug')
    .in('id', listosIds)

  if (errorCursos) {
    console.error('[listosParaCertificado] cursos:', errorCursos.message)
    return []
  }

  return (cursos ?? []).map((c) => ({
    courseId: c.id as string,
    titulo: c.title as string,
    slug: c.slug as string,
  }))
}
