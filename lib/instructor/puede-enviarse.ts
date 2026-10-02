/**
 * ¿Se puede enviar este curso a revisión? Las mismas cinco reglas del servidor.
 *
 * POR QUE EXISTE
 *   El botón «Enviar a revisión» de cada tarjeta en «Mis cursos» mandaba la petición a
 *   ciegas y enseñaba el rechazo en un `alert()` del navegador. Así que se podía intentar
 *   enviar un curso sin especialidad, recibir un mensaje que desaparece al primer clic y
 *   quedarse sin saber qué arreglar ni dónde. El editor, en cambio, ya avisa con el
 *   checklist a la vista.
 *
 *   Esto es lo que permite que la tarjeta diga lo mismo que va a decir el servidor, y
 *   que lleve al editor cuando falta algo.
 *
 * LAS REGLAS SON LAS DE app/api/instructor/courses/[id]/submit-review, en su orden:
 *   1. el estado lo permite (draft, rejected o changes_requested)
 *   2. tiene especialidad
 *   3. `puede_ensenar(especialidad, jurisdicción)` dice sí  ← la función de verdad
 *   4. al menos un módulo
 *   5. al menos una lección
 *
 * La 3 se pregunta a la base, no se reimplementa: la verificación es por especialidad Y
 * por jurisdicción, caduca, y se puede retirar. Cualquier copia en TypeScript se
 * desfasaría, y el único síntoma sería un rechazo que la pantalla no vio venir.
 */
import { createClient } from '@/lib/supabase/server'

export type ClaveDelImpedimento =
  | 'estado'
  | 'sin-especialidad'
  | 'sin-verificacion'
  | 'sin-modulos'
  | 'sin-lecciones'

export type Impedimento = {
  clave: ClaveDelImpedimento
  /** La frase que se le enseña a quien escribe el curso. */
  motivo: string
}

export const MOTIVOS: Record<ClaveDelImpedimento, string> = {
  estado: 'Solo se pueden enviar a revisión los cursos en borrador, rechazados o con cambios solicitados.',
  'sin-especialidad':
    'Este curso no tiene especialidad asignada. Elígela en el editor y guarda antes de enviarlo.',
  'sin-verificacion':
    'No estás verificado en la especialidad de este curso, o no para su jurisdicción. Puedes pedirlo en Mi verificación.',
  'sin-modulos': 'El curso necesita al menos un módulo antes de enviarlo a revisión.',
  'sin-lecciones': 'El curso necesita al menos una lección antes de enviarlo a revisión.',
}

const SE_PUEDE_ENVIAR = new Set(['draft', 'rejected', 'changes_requested'])

export type CursoParaEnviar = {
  id: string
  status?: string | null
  specialty_id?: string | null
  jurisdiccion?: string | null
}

/**
 * Lo que impide enviar cada uno de estos cursos, o `null` si nada lo impide.
 *
 * En lote: una consulta para los módulos de todos y otra para las lecciones, en vez de
 * dos por curso. `puede_ensenar` hay que preguntarlo curso a curso —es una función con
 * argumentos—, pero solo para los que de verdad podrían enviarse.
 */
export async function impedimentosParaEnviar(
  cursos: CursoParaEnviar[]
): Promise<Record<string, Impedimento | null>> {
  const resultado: Record<string, Impedimento | null> = {}
  if (cursos.length === 0) return resultado

  const candidatos = cursos.filter((c) => SE_PUEDE_ENVIAR.has(c.status ?? ''))
  for (const c of cursos) {
    if (!SE_PUEDE_ENVIAR.has(c.status ?? '')) {
      resultado[c.id] = { clave: 'estado', motivo: MOTIVOS.estado }
    }
  }
  if (candidatos.length === 0) return resultado

  const supabase = await createClient()
  const ids = candidatos.map((c) => c.id)

  const [{ data: modulos }, { data: lecciones }] = await Promise.all([
    supabase.from('modules').select('course_id').in('course_id', ids),
    supabase.from('lessons').select('course_id').in('course_id', ids),
  ])

  const cuenta = (filas: { course_id: string }[] | null) => {
    const m: Record<string, number> = {}
    for (const f of filas ?? []) m[f.course_id] = (m[f.course_id] ?? 0) + 1
    return m
  }
  const porModulos = cuenta(modulos as { course_id: string }[] | null)
  const porLecciones = cuenta(lecciones as { course_id: string }[] | null)

  for (const c of candidatos) {
    if (!c.specialty_id) {
      resultado[c.id] = { clave: 'sin-especialidad', motivo: MOTIVOS['sin-especialidad'] }
      continue
    }

    const { data: puede, error } = await supabase.rpc('puede_ensenar', {
      p_specialty_id: c.specialty_id,
      p_jurisdiccion: c.jurisdiccion ?? null,
    })
    // SI NO SE PUDO PREGUNTAR, no se afirma que falte la verificación: se deja pasar y
    // que lo diga el servidor. Inventarse un impedimento bloquearía a quien sí puede.
    if (error) {
      console.error('[impedimentosParaEnviar] puede_ensenar:', error.message)
    } else if (puede !== true) {
      resultado[c.id] = { clave: 'sin-verificacion', motivo: MOTIVOS['sin-verificacion'] }
      continue
    }

    if (!(porModulos[c.id] > 0)) {
      resultado[c.id] = { clave: 'sin-modulos', motivo: MOTIVOS['sin-modulos'] }
      continue
    }
    if (!(porLecciones[c.id] > 0)) {
      resultado[c.id] = { clave: 'sin-lecciones', motivo: MOTIVOS['sin-lecciones'] }
      continue
    }

    resultado[c.id] = null
  }

  return resultado
}

/**
 * La pregunta suelta, para el editor: ¿está verificada la especialidad de este curso,
 * para su jurisdicción? `null` si no se pudo averiguar —y entonces no se afirma nada.
 */
export async function especialidadVerificadaDelCurso(
  specialtyId: string | null | undefined,
  jurisdiccion: string | null | undefined
): Promise<boolean | null> {
  if (!specialtyId) return false
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('puede_ensenar', {
    p_specialty_id: specialtyId,
    p_jurisdiccion: jurisdiccion ?? null,
  })
  if (error) {
    console.error('[especialidadVerificadaDelCurso] puede_ensenar:', error.message)
    return null
  }
  return data === true
}
