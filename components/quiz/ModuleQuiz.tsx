'use client'

/**
 * ModuleQuiz Component
 *
 * Interactive quiz component for module assessments
 * - Displays questions one at a time or all at once
 * - Tracks answers and time spent
 * - Validates on submit
 * - Shows results with feedback
 */

import { useState, useEffect, useCallback } from 'react'
import type { QuizQuestion } from '@/types/database'
import { validateQuizAnswers, submitQuizAttempt } from '@/lib/quiz/validateQuizAttempt'
import { QuizResults } from './QuizResults'
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react'

interface ModuleQuizProps {
  moduleId: string
  moduleTitle: string
  questions: QuizQuestion[]
  userId: string | null
  onComplete?: (passed: boolean, score: number) => void
  onCancel?: () => void
}

export function ModuleQuiz({
  moduleId,
  moduleTitle,
  questions,
  userId,
  onComplete,
  onCancel,
}: ModuleQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [startTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === totalQuestions

  // Select answer
  const selectAnswer = useCallback((questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }, [])

  // Navigate questions
  const goToNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }, [currentQuestionIndex, totalQuestions])

  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }, [currentQuestionIndex])

  const goToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index)
  }, [])

  // Submit quiz
  const handleSubmit = useCallback(async () => {
    if (!allAnswered) {
      setError('Por favor responde todas las preguntas antes de enviar.')
      return
    }

    if (!userId) {
      setError('Debes iniciar sesión para guardar tu progreso.')
      // Still allow local validation
    }

    setIsSubmitting(true)
    setError(null)

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    const submission = {
      userId: userId!,
      moduleId,
      answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        question_id: questionId,
        selected_answer: selectedAnswer,
        correct: false, // Se calcula en el servidor
      })),
      timeSpentSeconds: timeSpent,
    }

    try {
      if (userId) {
        // Save to database
        const result = await submitQuizAttempt(submission, questions)

        if ('error' in result) {
          setError(result.error)
          setIsSubmitting(false)
          return
        }

        setResults(result)
      } else {
        // Local validation only
        const result = validateQuizAnswers(questions, submission.answers)
        setResults(result)
      }

      setShowResults(true)
    } catch (err) {
      console.error('Error submitting quiz:', err)
      setError('Ocurrió un error al enviar el quiz. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }, [allAnswered, userId, answers, startTime, moduleId, questions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showResults) return

      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1
        if (index < currentQuestion.options.length) {
          selectAnswer(currentQuestion.id, index)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showResults, currentQuestion, goToPrevious, goToNext, selectAnswer])

  // Show results screen
  if (showResults && results) {
    return (
      <QuizResults
        moduleTitle={moduleTitle}
        results={results}
        questions={questions}
        userAnswers={answers}
        onRetry={() => {
          setShowResults(false)
          setAnswers({})
          setCurrentQuestionIndex(0)
          setResults(null)
          setError(null)
        }}
        onComplete={() => {
          if (onComplete) {
            onComplete(results.passed, results.score)
          }
        }}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Quiz: {moduleTitle}
        </h1>
        <p className="text-white/70">
          Responde todas las preguntas para evaluar tu conocimiento. Necesitas un 70% para aprobar.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">
            Pregunta {currentQuestionIndex + 1} de {totalQuestions}
          </span>
          <span className="text-sm text-white/70">
            {answeredCount}/{totalQuestions} respondidas
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-light to-brand transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-2 mb-8">
        {questions.map((q, index) => {
          const isAnswered = answers[q.id] !== undefined
          const isCurrent = index === currentQuestionIndex

          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(index)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                isCurrent
                  ? 'bg-gradient-to-r from-brand-light to-brand text-white scale-110'
                  : isAnswered
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'
              }`}
              title={`Pregunta ${index + 1}${isAnswered ? ' (respondida)' : ''}`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>

      {/* Question card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
        {/* Question */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-light to-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentQuestionIndex + 1}
            </div>
            <h2 className="text-xl font-semibold text-white flex-1">
              {currentQuestion.question}
            </h2>
          </div>

          {currentQuestion.difficulty && (
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                currentQuestion.difficulty === 'easy'
                  ? 'bg-green-500/20 text-green-400'
                  : currentQuestion.difficulty === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {currentQuestion.difficulty === 'easy'
                ? 'Fácil'
                : currentQuestion.difficulty === 'medium'
                ? 'Medio'
                : 'Difícil'}
            </span>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestion.id] === index
            const optionLabel = String.fromCharCode(65 + index) // A, B, C, D

            return (
              <button
                key={index}
                onClick={() => selectAnswer(currentQuestion.id, index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-brand-light bg-brand-light/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'border-brand-light bg-brand-light'
                        : 'border-white/30'
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-white/90 font-medium mr-2">
                    {optionLabel}.
                  </span>
                  <span className="text-white/90">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Hint */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200">
              Tip: Puedes usar las teclas 1-4 para seleccionar opciones y las flechas para navegar.
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3">
          <button
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              onClick={goToNext}
              className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              Siguiente →
            </button>
          ) : null}
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white font-semibold hover:shadow-lg hover:shadow-brand-light/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}


