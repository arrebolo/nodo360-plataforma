// lib/db/quiz.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export interface QuizQuestionDTO {
  id: string
  question: string
  options: string[]
  correctAnswerIndex: number
  orderIndex: number
  explanation?: string | null
}

/**
 * Carga preguntas para un módulo con opción de randomizar
 * @param shuffle - Si es true, randomiza el orden de preguntas y opciones
 */
export async function getModuleQuizQuestions(
  supabase: SupabaseClient,
  moduleId: string,
  shuffle: boolean = false,
): Promise<QuizQuestionDTO[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('❌ [getModuleQuizQuestions] Error cargando preguntas', error)
    return []
  }

  let questions = (data ?? []).map((q: any) => ({
    id: q.id,
    question: q.question,
    options: (q.options as string[]) ?? [],
    correctAnswerIndex: q.correct_answer,
    orderIndex: q.order_index,
    explanation: q.explanation,
  }))

  // Randomizar si se solicita (para reintentos)
  if (shuffle) {
    // 1. Mezclar orden de preguntas
    questions = shuffleArray(questions)

    // 2. Mezclar opciones de cada pregunta (actualizando correctAnswerIndex)
    questions = questions.map((q) => {
      const optionsWithIndex = q.options.map((opt, idx) => ({ opt, originalIdx: idx }))
      const shuffledOptions = shuffleArray(optionsWithIndex)

      // Encontrar nuevo índice de la respuesta correcta
      const newCorrectIndex = shuffledOptions.findIndex(
        (o) => o.originalIdx === q.correctAnswerIndex
      )

      return {
        ...q,
        options: shuffledOptions.map((o) => o.opt),
        correctAnswerIndex: newCorrectIndex,
      }
    })
  }

  // Limitar a 4 preguntas (o las que haya si son menos)
  return questions.slice(0, 4)
}

/**
 * Función auxiliar para mezclar un array (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface CreateQuizAttemptInput {
  supabase: SupabaseClient
  userId: string
  moduleId: string
  answers: number[]
  questions: QuizQuestionDTO[]
}

/**
 * Crea un intento de quiz en quiz_attempts
 */
export async function createQuizAttempt({
  supabase,
  userId,
  moduleId,
  answers,
  questions,
}: CreateQuizAttemptInput) {
  const totalQuestions = questions.length
  const correctAnswers = questions.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.correctAnswerIndex ? 1 : 0)
  }, 0)

  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const passed = score >= 50 // Umbral mínimo: 50%

  const payload = {
    module_id: moduleId,
    user_id: userId,
    answers: answers,
    correct_answers: correctAnswers,
    total_questions: totalQuestions,
    score,
    passed,
    time_spent_seconds: null,
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert(payload as any)
    .select('*')
    .single()

  if (error) {
    console.error('❌ [createQuizAttempt] Error insertando intento', error)
    throw error
  }

  return { attempt: data, score, passed, correctAnswers, totalQuestions }
}

/**
 * Verifica si el usuario ya pasó el quiz de un módulo
 */
export async function hasUserPassedModuleQuiz(
  supabase: SupabaseClient,
  userId: string,
  moduleId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('passed')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('passed', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [hasUserPassedModuleQuiz] Error', error)
    return false
  }

  return !!data
}

/**
 * Obtiene el mejor intento del usuario en un quiz
 */
export async function getUserBestQuizAttempt(
  supabase: SupabaseClient,
  userId: string,
  moduleId: string,
) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [getUserBestQuizAttempt] Error', error)
    return null
  }

  return data
}
