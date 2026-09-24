import { createClient } from '@/lib/supabase/server'

/**
 * Control de acceso escalonado a las lecciones.
 *
 * REGLA
 *   El modulo 1 esta abierto. El modulo N se abre cuando TODAS las lecciones
 *   del N-1 estan completadas. Dentro de un modulo abierto, todas sus
 *   lecciones son accesibles: el escalonado es entre modulos, no dentro.
 *
 * POR QUE EN EL SERVIDOR
 *   La version anterior de este archivo usaba el cliente de navegador y solo
 *   la consumia un componente que nadie montaba. Una comprobacion en cliente
 *   no impide escribir la URL a mano, asi que esto tiene que decidirse aqui.
 *
 * EXCEPCIONES
 *   Sin ellas, activar el escalonado le quitaria a gente el acceso a
 *   contenido que ya habia hecho. Medido antes de implementarlo: 7 de los 13
 *   usuarios con progreso tenian lecciones en modulos cuyo anterior estaba
 *   incompleto, porque hasta hoy nada lo impedia.
 */
export type LessonAccess = {
  canAccess: boolean
  /** Por que se concede o se deniega. Util para el mensaje y para depurar. */
  reason:
    | 'primer_modulo'
    | 'modulo_anterior_completo'
    | 'ya_completada'
    | 'vista_previa'
    | 'curso_completado'
    | 'admin_o_instructor'
    | 'modulo_anterior_incompleto'
    | 'no_encontrada'
  /** Cuando se deniega: que modulo falta y cuanto queda de el. */
  bloqueo?: {
    moduloTitulo: string
    pendientes: number
    total: number
    /** Primera leccion sin completar del modulo que falta. */
    siguienteSlug: string | null
    siguienteTitulo: string | null
  }
}

export async function checkLessonAccess(
  userId: string | null,
  lessonId: string,
  courseId: string
): Promise<LessonAccess> {
  const supabase = await createClient()

  const { data: leccion, error: errorLeccion } = await supabase
    .from('lessons')
    .select('id, module_id, is_free_preview')
    .eq('id', lessonId)
    .single()

  if (errorLeccion || !leccion) {
    console.error('[checkLessonAccess] Leccion no encontrada:', errorLeccion?.message)
    return { canAccess: false, reason: 'no_encontrada' }
  }

  // --- Excepcion 4: vista previa gratuita --------------------------------
  if (leccion.is_free_preview) {
    return { canAccess: true, reason: 'vista_previa' }
  }

  // Sin sesion no hay progreso que consultar; la pagina ya exige login antes
  // de llegar aqui, asi que esto solo cubre llamadas sueltas.
  if (!userId) {
    return { canAccess: true, reason: 'vista_previa' }
  }

  const { data: modulos, error: errorModulos } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index')

  if (errorModulos || !modulos?.length) {
    console.error('[checkLessonAccess] Error leyendo modulos:', errorModulos?.message)
    return { canAccess: true, reason: 'no_encontrada' }
  }

  const moduloActual = modulos.find((m) => m.id === leccion.module_id)
  if (!moduloActual) return { canAccess: true, reason: 'no_encontrada' }

  // --- Excepcion 1: ya la completo ---------------------------------------
  const { data: yaHecha } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('is_completed', true)
    .limit(1)

  if ((yaHecha ?? []).length > 0) {
    return { canAccess: true, reason: 'ya_completada' }
  }

  // --- Regla general: el primer modulo siempre esta abierto ---------------
  if (moduloActual.order_index === 0) {
    return { canAccess: true, reason: 'primer_modulo' }
  }

  // --- Excepcion 3: admin o instructor del curso -------------------------
  const [{ data: perfil }, { data: curso }] = await Promise.all([
    supabase.from('users').select('role').eq('id', userId).maybeSingle(),
    supabase.from('courses').select('instructor_id').eq('id', courseId).maybeSingle(),
  ])

  if (perfil?.role === 'admin' || curso?.instructor_id === userId) {
    return { canAccess: true, reason: 'admin_o_instructor' }
  }

  // --- Excepcion 2: curso ya completado o certificado --------------------
  // Importa mas de lo que parece: al ampliar un curso de 6 a 9 lecciones,
  // quien lo habia terminado se queda con el curso completo y lecciones sin
  // registrar. Sin esto, alguien con certificado quedaria bloqueado en un
  // curso que ya termino.
  const [{ data: certificados }, { data: matricula }] = await Promise.all([
    supabase.from('certificates').select('id').eq('user_id', userId).eq('course_id', courseId).limit(1),
    supabase.from('course_enrollments').select('completed_at').eq('user_id', userId).eq('course_id', courseId).maybeSingle(),
  ])

  if ((certificados ?? []).length > 0 || matricula?.completed_at) {
    return { canAccess: true, reason: 'curso_completado' }
  }

  // --- Regla general: el modulo anterior tiene que estar completo ---------
  const anterior = modulos.find((m) => m.order_index === moduloActual.order_index - 1)
  if (!anterior) return { canAccess: true, reason: 'primer_modulo' }

  const { data: leccionesAnterior } = await supabase
    .from('lessons')
    .select('id, title, slug, order_index')
    .eq('module_id', anterior.id)
    .order('order_index')

  const lista = leccionesAnterior ?? []
  if (lista.length === 0) return { canAccess: true, reason: 'modulo_anterior_completo' }

  const { data: hechas } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .in('lesson_id', lista.map((l) => l.id))

  const completadas = new Set((hechas ?? []).map((h) => h.lesson_id))
  const pendientes = lista.filter((l) => !completadas.has(l.id))

  if (pendientes.length === 0) {
    return { canAccess: true, reason: 'modulo_anterior_completo' }
  }

  return {
    canAccess: false,
    reason: 'modulo_anterior_incompleto',
    bloqueo: {
      moduloTitulo: anterior.title,
      pendientes: pendientes.length,
      total: lista.length,
      // La PRIMERA pendiente, no el inicio del curso: es donde hay que seguir.
      siguienteSlug: pendientes[0]?.slug ?? null,
      siguienteTitulo: pendientes[0]?.title ?? null,
    },
  }
}
