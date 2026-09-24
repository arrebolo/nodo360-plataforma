import { createClient } from '@/lib/supabase/server'

/**
 * Los intentos de quiz NO guardan el curso.
 *
 * `quiz_attempts` tiene `module_id`, no `course_id`: las preguntas cuelgan de
 * un modulo y el intento se guarda contra el modulo de la primera pregunta.
 * Para buscar los intentos de un curso hay que pasar por sus modulos.
 *
 * Esto estuvo mal desde el principio. Las consultas filtraban por
 * `.eq('course_id', ...)`, PostgREST devolvia 400 —"column
 * quiz_attempts.course_id does not exist"— y el codigo usaba solo `data`
 * ignorando `error`, asi que `userPassed` salia SIEMPRE false sin que nada
 * fallara a la vista. Es el caso que describe la regla 12 del prompt maestro.
 *
 * De ahi que estas funciones comprueben el `error` y lo registren: si el
 * esquema vuelve a moverse, se vera.
 */
async function getModuleIdsForCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)

  if (error) {
    console.error('[checkCourseQuiz] Error leyendo modulos del curso:', error.message)
    return []
  }

  return (data ?? []).map((m) => m.id)
}

/**
 * Verifica si un curso tiene preguntas de quiz
 */
export async function courseHasQuiz(courseId: string): Promise<boolean> {
  const supabase = await createClient()
  const moduleIds = await getModuleIdsForCourse(supabase, courseId)

  if (moduleIds.length === 0) return false

  const { count, error } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .in('module_id', moduleIds)

  if (error) {
    console.error('[checkCourseQuiz] Error contando preguntas:', error.message)
    return false
  }

  return (count ?? 0) > 0
}

/**
 * Verifica si el usuario ya paso el quiz del curso
 */
export async function userPassedQuiz(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient()
  const moduleIds = await getModuleIdsForCourse(supabase, courseId)

  if (moduleIds.length === 0) return false

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .in('module_id', moduleIds)
    .eq('passed', true)
    .limit(1)

  if (error) {
    console.error('[checkCourseQuiz] Error buscando intentos aprobados:', error.message)
    return false
  }

  return (data ?? []).length > 0
}

/**
 * Obtiene el estado del quiz para un curso y usuario
 */
export async function getCourseQuizStatus(courseId: string, userId?: string | null): Promise<{
  hasQuiz: boolean
  questionCount: number
  userPassed: boolean
  bestScore: number | null
}> {
  const supabase = await createClient()
  const moduleIds = await getModuleIdsForCourse(supabase, courseId)

  if (moduleIds.length === 0) {
    return { hasQuiz: false, questionCount: 0, userPassed: false, bestScore: null }
  }

  const { count: questionCount, error: errorCount } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .in('module_id', moduleIds)

  if (errorCount) {
    console.error('[checkCourseQuiz] Error contando preguntas:', errorCount.message)
  }

  const hasQuiz = (questionCount ?? 0) > 0

  if (!userId || !hasQuiz) {
    return { hasQuiz, questionCount: questionCount ?? 0, userPassed: false, bestScore: null }
  }

  // Todos los intentos del usuario en este curso. Sin .single(): con cero
  // intentos devolveria error PGRST116, que es el caso normal de quien aun no
  // ha hecho el quiz.
  const { data: intentos, error: errorIntentos } = await supabase
    .from('quiz_attempts')
    .select('score, passed')
    .eq('user_id', userId)
    .in('module_id', moduleIds)
    .order('score', { ascending: false })
    .limit(1)

  if (errorIntentos) {
    console.error('[checkCourseQuiz] Error leyendo intentos:', errorIntentos.message)
    return { hasQuiz, questionCount: questionCount ?? 0, userPassed: false, bestScore: null }
  }

  const mejor = (intentos ?? [])[0]

  return {
    hasQuiz,
    questionCount: questionCount ?? 0,
    userPassed: mejor?.passed ?? false,
    bestScore: mejor?.score ?? null,
  }
}
