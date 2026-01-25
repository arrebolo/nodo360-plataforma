'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  order_index: number
  points: number
}

interface ExamAttemptClientProps {
  exam: {
    id: string
    title: string
    time_limit_minutes: number
    total_questions: number
    pass_threshold: number
  }
  examId: string
  modelId: string
  questions: Question[]
  timeLimitMinutes: number
}

export function ExamAttemptClient({
  exam,
  examId,
  modelId,
  questions,
  timeLimitMinutes,
}: ExamAttemptClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    setShowConfirmModal(false)

    try {
      const response = await fetch(`/api/instructor/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          answers: Object.entries(answers).map(([questionId, optionIndex]) => ({
            question_id: questionId,
            selected_option: optionIndex,
          })),
          time_spent_seconds: (timeLimitMinutes * 60) - timeLeft,
          auto_submitted: autoSubmit,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al enviar el examen')
      }

      router.push(`/dashboard/instructor/examen/${examId}/resultado/${result.attempt_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setIsSubmitting(false)
    }
  }, [answers, examId, modelId, timeLeft, timeLimitMinutes, router, isSubmitting])

  const timeWarning = timeLeft < 300 // 5 minutes
  const timeCritical = timeLeft < 60 // 1 minute

  return (
    <div className="min-h-screen bg-dark">
      {/* Header fijo con timer */}
      <div className="sticky top-0 z-50 bg-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">{exam.title}</h1>
              <p className="text-sm text-gray-400">
                Pregunta {currentIndex + 1} de {totalQuestions} · {answeredCount} respondidas
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg ${
              timeCritical
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : timeWarning
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-white/10 text-white'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex gap-1">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  answers[q.id] !== undefined
                    ? 'bg-brand-light'
                    : idx === currentIndex
                      ? 'bg-white/40'
                      : 'bg-white/10'
                }`}
                title={`Pregunta ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Pregunta actual */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-light/20 flex items-center justify-center text-brand-light font-bold">
              {currentIndex + 1}
            </span>
            <h2 className="text-xl text-white font-medium leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQuestion.id, idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQuestion.id] === idx
                    ? 'border-brand-light bg-brand-light/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                    answers[currentQuestion.id] === idx
                      ? 'bg-brand-light text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Enviar Examen
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Resumen de preguntas */}
        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Resumen de respuestas</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  answers[q.id] !== undefined
                    ? 'bg-brand-light/20 text-brand-light border border-brand-light/30'
                    : idx === currentIndex
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-brand-light/20 border border-brand-light/30" />
              Respondida
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-white/5 border border-white/10" />
              Sin responder
            </span>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-dark-surface border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              {answeredCount < totalQuestions ? (
                <>
                  <AlertTriangle className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Preguntas sin responder
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Tienes {totalQuestions - answeredCount} pregunta(s) sin responder.
                    Las preguntas sin respuesta se contarán como incorrectas.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    ¿Enviar examen?
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Has respondido todas las preguntas. Una vez enviado, no podrás modificar tus respuestas.
                  </p>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  Revisar
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
