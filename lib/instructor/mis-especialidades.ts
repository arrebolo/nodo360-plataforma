import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Las especialidades en las que ESTA persona está verificada, y en qué países.
 *
 * POR QUE EXISTE
 *   El formulario del instructor no tenía campo de especialidad, así que un curso se
 *   creaba sin `specialty_id` y al enviarlo a revisión el servidor lo rechazaba con
 *   «Este curso no tiene especialidad asignada» — un error imposible de arreglar desde
 *   la interfaz, y que además solo se veía en la consola. El checklist decía 7/7.
 *
 *   El desplegable no puede ofrecer las once especialidades: estar verificado en una
 *   habilita SOLO en esa, y es lo que comprueba `puede_ensenar()` al enviar. Ofrecer
 *   las que no tiene sería invitar a un rechazo.
 *
 * LAS CONDICIONES SON LAS DE puede_ensenar() (migración 109), no una aproximación:
 *   status = 'aprobada', sin revocar, y sin caducar.
 *
 * LA JURISDICCION VA POR ESPECIALIDAD, no por persona: una verificación de Fiscalidad
 * en España no habilita en México. Así que cada especialidad trae las jurisdicciones
 * que esa persona tiene aprobadas, y el formulario solo ofrece esas.
 *
 * `requiereJurisdiccion` sale de `instructor_specialties.requiere_acreditacion`, que es
 * la columna que mira el trigger de la 109. No de una lista de slugs escrita a mano:
 * el día que una tercera especialidad pase a verificarse por país, esto ya lo sabe.
 */
export type EspecialidadVerificada = {
  id: string
  slug: string
  nombre: string
  requiereJurisdiccion: boolean
  /** Las jurisdicciones aprobadas para esta especialidad. Vacío si no aplica. */
  jurisdicciones: string[]
}

export async function misEspecialidadesVerificadas(
  userId: string
): Promise<EspecialidadVerificada[]> {
  // Con el cliente de servicio: `instructor_certifications` está cerrada a
  // `authenticated` salvo lo propio, y aquí hace falta cruzarla con las
  // especialidades sin depender de qué columnas estén abiertas.
  const admin = createAdminClient()

  const { data: verificaciones, error } = await admin
    .from('instructor_certifications')
    .select('specialty_id, jurisdiccion, expires_at, revoked_at, status')
    .eq('user_id', userId)
    .eq('status', 'aprobada')
    .is('revoked_at', null)

  if (error) {
    console.error('[misEspecialidadesVerificadas]', error.message)
    return []
  }

  const ahora = Date.now()
  const vigentes = (verificaciones ?? []).filter(
    (v) => !v.expires_at || new Date(v.expires_at).getTime() > ahora
  )

  if (vigentes.length === 0) return []

  const ids = [...new Set(vigentes.map((v) => v.specialty_id))]
  const { data: especialidades, error: errorEsp } = await admin
    .from('instructor_specialties')
    .select('id, slug, nombre, requiere_acreditacion')
    .in('id', ids)
    .order('position')

  if (errorEsp) {
    console.error('[misEspecialidadesVerificadas] especialidades:', errorEsp.message)
    return []
  }

  return (especialidades ?? []).map((e) => ({
    id: e.id as string,
    slug: e.slug as string,
    nombre: e.nombre as string,
    requiereJurisdiccion: Boolean(e.requiere_acreditacion),
    jurisdicciones: vigentes
      .filter((v) => v.specialty_id === e.id && v.jurisdiccion)
      .map((v) => v.jurisdiccion as string),
  }))
}

/**
 * La especialidad de un curso, se esté verificado en ella o no.
 *
 * POR QUE NO VALE BUSCARLA EN `misEspecialidadesVerificadas`
 *   Si la verificación se retiró o caducó, la especialidad no está en esa lista, y
 *   `requiereJurisdiccion` caía a `false`: el checklist dejaba de pedir la jurisdicción
 *   justo en el caso en que hay que arreglar algo. Lo que pide jurisdicción es la
 *   especialidad (`requiere_acreditacion`), no el estado de la verificación.
 */
export async function laEspecialidadDelCurso(
  specialtyId: string
): Promise<{ id: string; slug: string; nombre: string; requiereJurisdiccion: boolean } | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_specialties')
    .select('id, slug, nombre, requiere_acreditacion')
    .eq('id', specialtyId)
    .maybeSingle()

  if (error) {
    console.error('[laEspecialidadDelCurso]', error.message)
    return null
  }
  if (!data) return null

  return {
    id: data.id as string,
    slug: data.slug as string,
    nombre: data.nombre as string,
    requiereJurisdiccion: Boolean(data.requiere_acreditacion),
  }
}
