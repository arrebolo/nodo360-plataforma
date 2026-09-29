import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * EL SELLO DE INSTRUCTOR
 *
 * Un sello es una verificacion aprobada, viva y no retirada, en UNA
 * especialidad. Sale de la vista `sellos_de_instructor` que creo la 093, que es
 * la unica puerta publica a instructor_certifications: la tabla lleva dentro el
 * numero de colegiacion y las notas del evaluador, y desde la 093 no la lee ni
 * `anon` ni cualquier sesion.
 *
 * QUE HABIA ANTES, Y POR QUE NO VALIA
 *
 *   instructores/[id]          leia instructor_profiles.is_verified. Esa tabla
 *                              tiene UNA fila, con is_verified a true y
 *                              specialties a NULL: el sello decia «verificado»
 *                              sin nada detras.
 *
 *   InstructorPreviewModal     calculaba
 *                                is_verified: user.role === 'instructor'
 *                                             || user.role === 'mentor'
 *                              Es decir: TENER EL ROL era estar verificado. Con
 *                              eso, el tick no significaba nada.
 *
 * Ahora significa una cosa concreta y comprobable: alguien decidio que esta
 * persona puede enseñar esa materia, y la decision consta con fecha, numero y
 * quien la tomo.
 */

export type Sello = {
  certification_number: string
  especialidad: string
  especialidad_slug: string
  issued_at: string | null
  expires_at: string | null
  vigente: boolean
}

/**
 * Los sellos vivos de una persona, del mas reciente al mas antiguo.
 *
 * La vista ya filtra por status 'aprobada' y revoked_at nulo; aqui se descartan
 * ademas los caducados. Un sello caducado no es un sello: es un sello que fue.
 */
export async function obtenerSellos(
  supabase: SupabaseClient,
  userId: string
): Promise<Sello[]> {
  const { data, error } = await supabase
    .from('sellos_de_instructor')
    .select('certification_number, especialidad, especialidad_slug, issued_at, expires_at, vigente')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })

  if (error) {
    console.error('[sellos] No se pudieron leer los sellos:', error.message)
    return []
  }

  return ((data ?? []) as Sello[]).filter((s) => s.vigente)
}

/**
 * El texto del tick, para que no sea un adorno sin explicacion.
 * Sin sellos devuelve null, y entonces NO se pinta nada.
 */
export function textoDelSello(sellos: Sello[]): string | null {
  if (sellos.length === 0) return null
  if (sellos.length === 1) return `Verificado en ${sellos[0].especialidad}`
  return `Verificado en ${sellos.length} especialidades: ${sellos.map((s) => s.especialidad).join(', ')}`
}
