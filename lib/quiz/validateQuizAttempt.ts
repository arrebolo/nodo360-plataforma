/**
 * Quiz Validation and Attempt Management
 *
 * Handles quiz answer validation, scoring, and attempt recording
 */

import type {
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  InsertQuizAttempt,
} from '@/types/database'
import { supabase } from '@/lib/supabase/client'

export interface QuizSubmission {
  moduleId: string
  answers: {
    questionId: string
    selectedAnswer: number
  }[]
  timeSpentSeconds?: number
}

export interface QuizResult {
  score: number
  totalQuestions: number
  correctAnswers: number
  passed: boolean
  answers: QuizAnswer[]
  attemptId?: string
}

const PASSING_SCORE = 70 // 70% to pass

/**
 * Validate quiz answers and calculate score
 *
 * @param questions - Array of quiz questions
 * @param userAnswers - User's selected answers
 * @returns QuizResult with score and detailed results
 */
export function validateQuizAnswers(
  questions: QuizQuestion[],
  userAnswers: { questionId: string; selectedAnswer: number }[]
): QuizResult {
  const totalQuestions = questions.length
  let correctAnswers = 0

  const detailedAnswers: QuizAnswer[] = userAnswers.map((userAnswer) => {
    const question = questions.find((q) => q.id === userAnswer.questionId)

    if (!question) {
      return {
        question_id: userAnswer.questionId,
        selected_answer: userAnswer.selectedAnswer,
        correct: false,
      }
    }

    const isCorrect = userAnswer.selectedAnswer === question.correct_answer

    if (isCorrect) {
      correctAnswers++
    }

    return {
      question_id: userAnswer.questionId,
      selected_answer: userAnswer.selectedAnswer,
      correct: isCorrect,
    }
  })

  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const passed = score >= PASSING_SCORE

  return {
    score,
    totalQuestions,
    correctAnswers,
    passed,
    answers: detailedAnswers,
  }
}

/**
 * Submit quiz attempt and save to database
 *
 * @param userId - User ID
 * @param submission - Quiz submission data
 * @param questions - Quiz questions
 * @returns QuizResult with attempt ID
 */
export async function submitQuizAttempt(
  userId: string,
  submission: QuizSubmission,
  questions: QuizQuestion[]
): Promise<QuizResult | { error: string }> {

  // Validate answers
  const result = validateQuizAnswers(questions, submission.answers)

  // Prepare attempt data
  const attemptData: InsertQuizAttempt = {
    user_id: userId,
    module_id: submission.moduleId,
    score: result.score,
    total_questions: result.totalQuestions,
    correct_answers: result.correctAnswers,
    passed: result.passed,
    answers: result.answers as any, // Will be stored as JSONB
    time_spent_seconds: submission.timeSpentSeconds || null,
    completed_at: new Date().toISOString(),
  }

  // Save attempt to database
  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .insert(attemptData as any)
    .select()
    .single()

  if (error) {
    console.error('Error saving quiz attempt:', error)
    return { error: 'Failed to save quiz attempt' }
  }

  return {
    ...result,
    attemptId: (attempt as any).id,
  }
}

/**
 * Get user's best attempt for a module
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @returns Best quiz attempt or null
 */
export async function getBestQuizAttempt(
  userId: string,
  moduleId: string
): Promise<QuizAttempt | null> {

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('score', { ascending: false })
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  return attempt || null
}

/**
 * Get all attempts for a module
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @returns Array of quiz attempts
 */
export async function getQuizAttempts(
  userId: string,
  moduleId: string
): Promise<QuizAttempt[]> {

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('completed_at', { ascending: false })

  return attempts || []
}

/**
 * Check if user has passed module quiz
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @returns true if user has at least one passing attempt
 */
export async function hasPassedModuleQuiz(
  userId: string,
  moduleId: string
): Promise<boolean> {

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('passed', true)
    .limit(1)

  return (attempts?.length || 0) > 0
}

/**
 * Get quiz questions for a module
 *
 * @param moduleId - Module ID
 * @returns Array of quiz questions (without correct answers for client)
 */
export async function getQuizQuestions(
  moduleId: string,
  includeAnswers: boolean = false
): Promise<QuizQuestion[]> {

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (!questions) {
    return []
  }

  const questionsData = questions as any[]

  // For client-side, hide correct answers
  if (!includeAnswers) {
    return questionsData.map((q) => ({
      ...q,
      correct_answer: -1, // Hide correct answer
      explanation: null, // Hide explanation until after submission
    }))
  }

  return questionsData
}

/**
 * Get quiz statistics for a module
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @returns Quiz statistics
 */
export async function getQuizStats(
  userId: string,
  moduleId: string
): Promise<{
  totalAttempts: number
  bestScore: number
  averageScore: number
  passed: boolean
  lastAttemptDate: string | null
}> {
  const attempts = await getQuizAttempts(userId, moduleId)

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      bestScore: 0,
      averageScore: 0,
      passed: false,
      lastAttemptDate: null,
    }
  }

  const scores = attempts.map((a) => a.score)
  const bestScore = Math.max(...scores)
  const averageScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  )
  const passed = attempts.some((a) => a.passed)
  const lastAttemptDate = attempts[0].completed_at

  return {
    totalAttempts: attempts.length,
    bestScore,
    averageScore,
    passed,
    lastAttemptDate,
  }
}

/**
 * Shuffle quiz questions (for randomization)
 *
 * @param questions - Array of questions
 * @returns Shuffled array
 */
export function shuffleQuestions<T>(questions: T[]): T[] {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Shuffle quiz options (for randomization)
 *
 * @param question - Quiz question
 * @returns Question with shuffled options and updated correct_answer index
 */
export function shuffleQuestionOptions(
  question: QuizQuestion
): QuizQuestion {
  const optionsWithIndex = question.options.map((opt, idx) => ({
    text: opt,
    originalIndex: idx,
  }))

  // Shuffle
  for (let i = optionsWithIndex.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[optionsWithIndex[i], optionsWithIndex[j]] = [
      optionsWithIndex[j],
      optionsWithIndex[i],
    ]
  }

  // Find new index of correct answer
  const newCorrectAnswerIndex = optionsWithIndex.findIndex(
    (opt) => opt.originalIndex === question.correct_answer
  )

  return {
    ...question,
    options: optionsWithIndex.map((opt) => opt.text),
    correct_answer: newCorrectAnswerIndex,
  }
}
