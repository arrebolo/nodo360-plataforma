import { createClient } from '@/lib/supabase/server'

/**
 * Verifica si un curso tiene preguntas de quiz
 */
export async function courseHasQuiz(courseId: string): Promise<boolean> {
  const supabase = await createClient()

  // Obtener módulos del curso
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)

  if (!modules || modules.length === 0) return false

  // Verificar si hay preguntas para algún módulo
  const moduleIds = modules.map(m => m.id)
  const { count } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .in('module_id', moduleIds)

  return (count ?? 0) > 0
}

/**
 * Verifica si el usuario ya pasó el quiz del curso
 */
export async function userPassedQuiz(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('quiz_attempts')
    .select('id, passed')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('passed', true)
    .limit(1)
    .single()

  return !!data
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

  // Obtener módulos del curso
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)

  if (!modules || modules.length === 0) {
    return { hasQuiz: false, questionCount: 0, userPassed: false, bestScore: null }
  }

  // Contar preguntas
  const moduleIds = modules.map(m => m.id)
  const { count: questionCount } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .in('module_id', moduleIds)

  const hasQuiz = (questionCount ?? 0) > 0

  // Si no hay usuario o no hay quiz, retornar
  if (!userId || !hasQuiz) {
    return { hasQuiz, questionCount: questionCount ?? 0, userPassed: false, bestScore: null }
  }

  // Obtener mejor intento del usuario
  const { data: bestAttempt } = await supabase
    .from('quiz_attempts')
    .select('score, passed')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('score', { ascending: false })
    .limit(1)
    .single()

  return {
    hasQuiz,
    questionCount: questionCount ?? 0,
    userPassed: bestAttempt?.passed ?? false,
    bestScore: bestAttempt?.score ?? null,
  }
}
