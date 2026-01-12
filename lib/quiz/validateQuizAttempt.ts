/**
 * Quiz Validation and Attempt Management
 *
 * - Valida respuestas
 * - Calcula score
 * - Guarda intentos
 * - Otorga XP usando awardXP()
 */

import { createClient } from '@/lib/supabase/server'
import { awardXP } from '@/lib/gamification/awardXP'
import type {
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  InsertQuizAttempt
} from '@/types/database'

export interface QuizSubmission {
  userId: string
  moduleId: string
  answers: QuizAnswer[]
  timeSpentSeconds?: number
}

export interface QuizResult {
  score: number
  passed: boolean
  answers: QuizAnswer[]
  attemptId?: string
}

const PASSING_SCORE = 70 // 70% para aprobar

/* ======================================================
   VALIDAR RESPUESTAS Y CALCULAR SCORE
====================================================== */
export function validateQuizAnswers(
  questions: QuizQuestion[],
  userAnswers: QuizAnswer[]
): QuizResult {
  const detailedAnswers: QuizAnswer[] = userAnswers.map((userAnswer) => {
    const question = questions.find((q) => q.id === userAnswer.question_id)

    return {
      ...userAnswer,
      correct: question?.correct_answer === userAnswer.selected_answer
    }
  })

  const totalQuestions = questions.length
  const correctAnswers = detailedAnswers.filter((a) => a.correct).length

  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const passed = score >= PASSING_SCORE

  return {
    score,
    passed,
    answers: detailedAnswers
  }
}

/* ======================================================
   GUARDAR INTENTO + OTORGAR XP (CENTRALIZADO)
====================================================== */
export async function submitQuizAttempt(
  submission: QuizSubmission,
  questions: QuizQuestion[]
): Promise<QuizResult | { error: string }> {
  const supabase = await createClient()

  const { userId, moduleId, answers, timeSpentSeconds } = submission

  // 1️⃣ Validar respuestas
  const result = validateQuizAnswers(questions, answers)

  // 2️⃣ Comprobar si el usuario YA había aprobado antes
  const { data: previousAttempts, error: previousError } = await supabase
    .from('quiz_attempts')
    .select('id, passed')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('passed', true)

  if (previousError) {
    console.error('Error comprobando intentos previos:', previousError)
    return { error: 'Error interno comprobando intentos previos' }
  }

  const alreadyPassedBefore = (previousAttempts?.length || 0) > 0

  // 3️⃣ Guardar intento
  const correctCount = result.answers.filter((a) => a.correct).length
  const attemptData: InsertQuizAttempt = {
    user_id: userId,
    module_id: moduleId,
    score: result.score,
    passed: result.passed,
    total_questions: questions.length,
    correct_answers: correctCount,
    answers: result.answers,
    time_spent_seconds: timeSpentSeconds ?? null,
    completed_at: new Date().toISOString(),
  }

  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .insert(attemptData as any)
    .select()
    .single()

  if (error || !attempt) {
    console.error('Error guardando intento de quiz:', error)
    return { error: 'Error guardando intento de quiz' }
  }

  // 4️⃣ Otorgar XP SOLO si:
  // - Ha aprobado
  // - No había aprobado antes (anti farming)
  if (result.passed && !alreadyPassedBefore) {
    // XP por aprobar quiz
    await awardXP({
      userId,
      eventType: 'quiz_passed',
      context: { quizId: attempt.id, moduleId },
      description: `Quiz aprobado (módulo ${moduleId})`
    })

    // XP extra por puntuación perfecta
    if (result.score === 100) {
      await awardXP({
        userId,
        eventType: 'perfect_score',
        context: { quizId: attempt.id, moduleId },
        description: `Puntuación perfecta en quiz (módulo ${moduleId})`
      })
    }
  }

  return {
    ...result,
    attemptId: attempt.id
  }
}

/* ======================================================
   HELPERS (SIN CAMBIOS)
====================================================== */
export async function getBestQuizAttempt(
  userId: string,
  moduleId: string
): Promise<QuizAttempt | null> {
  const supabase = await createClient()

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('score', { ascending: false })
    .limit(1)
    .single()

  return (attempt as QuizAttempt | null) || null
}

export async function getQuizAttempts(
  userId: string,
  moduleId: string
): Promise<QuizAttempt[]> {
  const supabase = await createClient()

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)

  return (attempts as QuizAttempt[]) || []
}

export async function hasPassedModuleQuiz(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('passed', true)
    .limit(1)

  return (attempts?.length || 0) > 0
}


