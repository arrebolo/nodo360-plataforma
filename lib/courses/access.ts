import { createClient } from '@/lib/supabase/server'

/**
 * Quien puede ver un curso segun su estado.
 *
 * Regla unica para todas las rutas que sirven contenido de un curso
 * (ficha, lecciones, examen final):
 *
 *   - Curso publicado        -> lo ve cualquiera
 *   - Curso no publicado     -> solo el admin y el instructor del curso
 *   - Cualquier otro usuario -> 404
 *
 * Antes cada pagina lo resolvia a su manera: la ficha filtraba por
 * status = 'published' en la propia consulta (y por eso el boton "Vista previa"
 * del panel admin daba 404), la pagina de leccion no comprobaba el estado en
 * absoluto (cualquier usuario autenticado leia borradores por URL directa) y el
 * examen final si lo comprobaba. Esta funcion es ahora el unico sitio donde se
 * decide.
 */

export type CourseAccessInput = {
  status?: string | null
  instructor_id?: string | null
}

export type CourseAccess = {
  /** Si false, la pagina debe llamar a notFound() */
  canView: boolean
  /**
   * true cuando se ve un curso NO publicado por ser admin o su instructor.
   * La pagina debe mostrar el aviso de vista previa y no indexarse.
   */
  isPreview: boolean
}

const DENY: CourseAccess = { canView: false, isPreview: false }
const PUBLIC: CourseAccess = { canView: true, isPreview: false }
const PREVIEW: CourseAccess = { canView: true, isPreview: true }

/**
 * Resuelve el acceso a un curso.
 *
 * @param course       Debe traer al menos `status` e `instructor_id`.
 * @param knownUserId  Id del usuario de la sesion, si la pagina ya lo tiene.
 *                     Se pasa solo para ahorrar una llamada; nunca se usa como
 *                     fuente de identidad para conceder permisos sin comprobar.
 *
 * Para un curso publicado no consulta nada: es el camino habitual y sale por la
 * primera condicion.
 */
export async function resolveCourseAccess(
  course: CourseAccessInput | null | undefined,
  knownUserId?: string | null
): Promise<CourseAccess> {
  if (!course) return DENY

  if (course.status === 'published') return PUBLIC

  const supabase = await createClient()

  let userId = knownUserId ?? null
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  }

  if (!userId) return DENY

  // El instructor del curso ve su propio borrador
  if (course.instructor_id && course.instructor_id === userId) return PREVIEW

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'admin') return PREVIEW

  return DENY
}

/**
 * Igual que resolveCourseAccess, pero devuelve solo si hay que mostrar el aviso
 * de vista previa. Pensada para generateMetadata, donde no se llama a
 * notFound() sino que se devuelve un titulo generico.
 */
export async function isCourseVisible(
  course: CourseAccessInput | null | undefined,
  knownUserId?: string | null
): Promise<boolean> {
  const { canView } = await resolveCourseAccess(course, knownUserId)
  return canView
}
