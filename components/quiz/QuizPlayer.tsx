'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Quiz, Question, QuizResult, QuizAttempt } from '@/types/quiz'
import { QuizResultsDisplay } from './QuizResultsDisplay'
import { Clock, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'

interface QuizPlayerProps {
  quiz: Quiz
  userId: string
  onComplete?: (result: QuizResult) => void
  onClose?: () => void
}

export function QuizPlayer({ quiz, userId, onComplete, onClose }: QuizPlayerProps) {
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Shuffle questions and options if needed
  const questions = useMemo(() => {
    let qs = [...(quiz.questions || [])]
    if (quiz.shuffle_questions) {
      qs = qs.sort(() => Math.random() - 0.5)
    }
    if (quiz.shuffle_options) {
      qs = qs.map(q => ({
        ...q,
        options: [...(q.options || [])].sort(() => Math.random() - 0.5)
      }))
    }
    return qs
  }, [quiz])

  const currentQuestion = questions[currentIndex]

  // Start attempt on mount
  useEffect(() => {
    const startAttempt = async () => {
      const supabase = createClient()

      try {
        // Check existing attempts
        const { data: existingAttempts, error: fetchError } = await (supabase as any)
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quiz.id)
          .eq('user_id', userId)
          .order('attempt_number', { ascending: false })
          .limit(1)

        if (fetchError) throw fetchError

        const lastAttempt = existingAttempts?.[0]
        const attemptNumber = lastAttempt ? lastAttempt.attempt_number + 1 : 1

        // Check if max attempts exceeded
        if (attemptNumber > quiz.max_attempts) {
          setError(`Has alcanzado el maximo de ${quiz.max_attempts} intentos`)
          setLoading(false)
          return
        }

        // Create new attempt
        const { data: newAttempt, error: createError } = await (supabase as any)
          .from('quiz_attempts')
          .insert({
            quiz_id: quiz.id,
            user_id: userId,
            attempt_number: attemptNumber,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) throw createError

        setAttempt(newAttempt)
        if (quiz.time_limit_minutes) {
          setTimeRemaining(quiz.time_limit_minutes * 60)
        }
      } catch (err) {
        console.error('[QuizPlayer] Start error:', err)
        setError('Error al iniciar el quiz')
      } finally {
        setLoading(false)
      }
    }

    startAttempt()
  }, [quiz, userId])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || result) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, result])

  const handleSelectOption = useCallback((questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return

    setAnswers(prev => {
      const current = prev[questionId] || []

      if (question.question_type === 'single' || question.question_type === 'boolean') {
        return { ...prev, [questionId]: [optionId] }
      } else {
        // Multiple choice - toggle selection
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter(id => id !== optionId) }
        } else {
          return { ...prev, [questionId]: [...current, optionId] }
        }
      }
    })
  }, [questions])

  const handleSubmit = useCallback(async () => {
    if (!attempt) return

    setSubmitting(true)
    const supabase = createClient()

    try {
      const startTime = new Date(attempt.started_at).getTime()
      const endTime = Date.now()
      const timeSpentSeconds = Math.floor((endTime - startTime) / 1000)

      // Calculate score
      let totalPoints = 0
      let earnedPoints = 0
      let correctAnswers = 0
      const answerRecords: Array<{
        attempt_id: string
        question_id: string
        selected_options: string[]
        is_correct: boolean
        points_earned: number
      }> = []

      for (const question of questions) {
        totalPoints += question.points
        const selectedIds = answers[question.id] || []
        const correctIds = question.options?.filter(o => o.is_correct).map(o => o.id) || []

        // Check if answer is correct
        const isCorrect =
          selectedIds.length === correctIds.length &&
          selectedIds.every(id => correctIds.includes(id))

        const pointsEarned = isCorrect ? question.points : 0
        earnedPoints += pointsEarned

        if (isCorrect) correctAnswers++

        answerRecords.push({
          attempt_id: attempt.id,
          question_id: question.id,
          selected_options: selectedIds,
          is_correct: isCorrect,
          points_earned: pointsEarned
        })
      }

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
      const passed = score >= quiz.passing_score

      // Save answers
      if (answerRecords.length > 0) {
        await (supabase as any)
          .from('quiz_answers')
          .insert(answerRecords)
      }

      // Update attempt
      await (supabase as any)
        .from('quiz_attempts')
        .update({
          completed_at: new Date().toISOString(),
          score,
          passed,
          time_spent_seconds: timeSpentSeconds
        })
        .eq('id', attempt.id)

      // Award XP if passed (first time only)
      let xpEarned = 0
      if (passed && attempt.attempt_number === 1) {
        xpEarned = quiz.xp_reward
        // XP award logic would go here (call to gamification system)
      }

      const quizResult: QuizResult = {
        attempt: {
          ...attempt,
          completed_at: new Date().toISOString(),
          score,
          passed,
          time_spent_seconds: timeSpentSeconds
        },
        score,
        passed,
        totalPoints,
        earnedPoints,
        correctAnswers,
        totalQuestions: questions.length,
        timeSpent: timeSpentSeconds,
        xpEarned
      }

      setResult(quizResult)
      if (onComplete) onComplete(quizResult)

    } catch (err) {
      console.error('[QuizPlayer] Submit error:', err)
      setError('Error al enviar respuestas')
    } finally {
      setSubmitting(false)
    }
  }, [attempt, answers, questions, quiz, onComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-brand-light" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <p className="text-white mb-4">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
          >
            Cerrar
          </button>
        )}
      </div>
    )
  }

  if (result) {
    return (
      <QuizResultsDisplay
        result={result}
        quiz={quiz}
        questions={questions}
        answers={answers}
        onRetry={attempt && attempt.attempt_number < quiz.max_attempts ? () => window.location.reload() : undefined}
        onClose={onClose}
      />
    )
  }

  if (!currentQuestion) {
    return null
  }

  const selectedOptions = answers[currentQuestion.id] || []
  const answeredCount = Object.keys(answers).length

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">{quiz.title}</h3>
          <span className="text-xs text-white/50">
            {answeredCount}/{questions.length} respondidas
          </span>
        </div>
        {timeRemaining !== null && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            timeRemaining < 60 ? 'bg-error/20 text-error' : 'bg-white/10 text-white/70'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-brand-light transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="p-6">
        <div className="mb-6">
          <span className="text-xs text-white/50 uppercase tracking-wide">
            Pregunta {currentIndex + 1} de {questions.length}
          </span>
          <p className="text-lg text-white mt-2">{currentQuestion.question_text}</p>
          <span className="text-xs text-white/40 mt-1">
            {currentQuestion.points} punto{currentQuestion.points !== 1 ? 's' : ''}
            {currentQuestion.question_type === 'multiple' && ' - Selecciona todas las correctas'}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options?.map((option) => {
            const isSelected = selectedOptions.includes(option.id)

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition text-left ${
                  isSelected
                    ? 'bg-brand-light/20 border-brand-light text-white'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-brand-light bg-brand-light' : 'border-white/30'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <span>{option.option_text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
        <button
          type="button"
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-brand-light/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-2 px-4 py-2 text-white hover:text-brand-light transition"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question dots navigation */}
      <div className="flex items-center justify-center gap-2 p-3 border-t border-white/10">
        {questions.map((q, i) => {
          const isAnswered = !!answers[q.id]
          const isCurrent = i === currentIndex

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition ${
                isCurrent
                  ? 'bg-brand-light'
                  : isAnswered
                    ? 'bg-success'
                    : 'bg-white/20 hover:bg-white/40'
              }`}
              title={`Pregunta ${i + 1}`}
            />
          )
        })}
      </div>
    </div>
  )
}
