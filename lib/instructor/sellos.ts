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
  /** Solo en las especialidades que se verifican por pais. */
  jurisdiccion: string | null
  jurisdiccion_nombre: string | null
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
  // La jurisdiccion llega con la migracion 109. Pedirla antes devuelve 42703 y
  // tumba la consulta entera, y esto se lee en paginas publicas: el sello
  // desapareceria de todas ellas hasta aplicar la migracion. Se pide y, si no
  // esta, se repite sin ella.
  const CAMPOS = 'certification_number, especialidad, especialidad_slug, issued_at, expires_at, vigente'

  const pedir = (conJurisdiccion: boolean) =>
    supabase
      .from('sellos_de_instructor')
      .select(conJurisdiccion ? `${CAMPOS}, jurisdiccion, jurisdiccion_nombre` : CAMPOS)
      .eq('user_id', userId)
      .order('issued_at', { ascending: false })

  let { data, error } = await pedir(true)

  if (error) {
    console.warn('[sellos] Reintento sin jurisdiccion:', error.message)
    ;({ data, error } = await pedir(false))
  }

  if (error) {
    console.error('[sellos] No se pudieron leer los sellos:', error.message)
    return []
  }

  // Sin la 109 las dos columnas no vienen; el sello se pinta sin jurisdiccion.
  return ((data ?? []) as Array<Partial<Sello>>)
    .map((s) => ({
      ...s,
      jurisdiccion: s.jurisdiccion ?? null,
      jurisdiccion_nombre: s.jurisdiccion_nombre ?? null,
    }) as Sello)
    .filter((s) => s.vigente)
}

/**
 * El texto del tick, para que no sea un adorno sin explicacion.
 * Sin sellos devuelve null, y entonces NO se pinta nada.
 */
/**
 * «Fiscalidad · España», o solo «Fiscalidad».
 *
 * La jurisdiccion se pinta pegada a la especialidad porque forma parte de lo que
 * se ha verificado: en fiscalidad y derecho, «verificado en Fiscalidad» a secas
 * no dice nada, porque la normativa es de un pais.
 */
export function materiaDelSello(sello: Sello): string {
  const j = sello.jurisdiccion_nombre?.trim() || sello.jurisdiccion?.trim()
  return j ? `${sello.especialidad} · ${j}` : sello.especialidad
}

export function textoDelSello(sellos: Sello[]): string | null {
  if (sellos.length === 0) return null
  if (sellos.length === 1) return `Verificado en ${materiaDelSello(sellos[0])}`
  return `Verificado en ${sellos.length} especialidades: ${sellos.map(materiaDelSello).join(', ')}`
}
