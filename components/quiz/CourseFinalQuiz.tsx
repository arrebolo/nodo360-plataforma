'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw } from 'lucide-react'
import type { QuizQuestion } from '@/types/database'
import { useBadgeNotification } from '@/hooks/useBadgeNotification'

interface CourseFinalQuizProps {
  courseId: string
  courseTitle: string
  questions: QuizQuestion[]
  userId: string
  redirectTo: string
  fallbackUrl: string
}

export function CourseFinalQuiz({
  courseId,
  courseTitle,
  questions,
  userId,
  redirectTo,
  fallbackUrl,
}: CourseFinalQuizProps) {
  const router = useRouter()
  const { notifyBadges } = useBadgeNotification()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  // Si no hay preguntas
  if (totalQuestions === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white mb-4">¡Curso completado!</h2>
        <p className="text-white/70 mb-6">
          No hay quiz final para este curso. Ya puedes obtener tu certificado.
        </p>
        <button
          onClick={() => router.push(redirectTo)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white font-semibold hover:opacity-90 transition"
        >
          Ver certificados
        </button>
      </div>
    )
  }

  const handleAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }))
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const calculateScore = () => {
    let correct = 0
    let totalPoints = 0
    let earnedPoints = 0

    questions.forEach((q) => {
      totalPoints += q.points || 1
      if (answers[q.id] === q.correct_answer) {
        correct++
        earnedPoints += q.points || 1
      }
    })

    return {
      correct,
      total: totalQuestions,
      percentage: Math.round((correct / totalQuestions) * 100),
      earnedPoints,
      totalPoints,
    }
  }

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true)
    const score = calculateScore()

    try {
      // Guardar resultado del quiz
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          user_id: userId,
          score: score.percentage,
          passed: score.percentage >= 70,
          answers: answers,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar resultado')
      }

      // Parsear respuesta para obtener badges
      const data = await response.json().catch(() => ({}))

      // Mostrar badges ganados (si hay)
      if (data.awarded_badges && data.awarded_badges.length > 0) {
        notifyBadges(data.awarded_badges)
      }

      // Redirigir según resultado (con pequeño delay para ver el badge)
      const redirectDelay = data.awarded_badges?.length > 0 ? 500 : 0
      setTimeout(() => {
        if (score.percentage >= 70) {
          router.push(redirectTo)
        } else {
          router.push(fallbackUrl)
        }
      }, redirectDelay)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      // Permitir navegación aunque falle el guardado
      if (score.percentage >= 70) {
        router.push(redirectTo)
      } else {
        router.push(fallbackUrl)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setCurrentIndex(0)
    setAnswers({})
    setShowResults(false)
  }

  // Mostrar resultados
  if (showResults) {
    const score = calculateScore()
    const passed = score.percentage >= 70

    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="text-center mb-8">
          {passed ? (
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-2">
            {passed ? '¡Felicidades!' : 'Sigue practicando'}
          </h2>

          <p className="text-5xl font-bold text-white mb-2">{score.percentage}%</p>

          <p className="text-white/70">
            Respuestas correctas: {score.correct} de {score.total}
          </p>
        </div>

        {/* Resumen de respuestas */}
        <div className="bg-white/5 rounded-xl p-4 mb-8">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
            Resumen
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((q, index) => {
              const isCorrect = answers[q.id] === q.correct_answer
              return (
                <div
                  key={q.id}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                    isCorrect
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {index + 1}
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-white/60 mb-8">
          {passed
            ? 'Has aprobado el quiz final. ¡Ya puedes obtener tu certificado!'
            : 'Necesitas al menos 70% para aprobar. Revisa el contenido del curso e inténtalo de nuevo.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!passed && (
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 transition"
            >
              <RotateCcw className="w-5 h-5" />
              Intentar de nuevo
            </button>
          )}

          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : passed ? 'Obtener certificado' : 'Volver al curso'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Mostrar pregunta actual
  const selectedAnswer = answers[currentQuestion.id]

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Quiz Final: {courseTitle}</h2>
        <p className="text-white/60 text-sm">
          Responde todas las preguntas. Necesitas al menos 70% para aprobar.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-white/60">
          Pregunta {currentIndex + 1} de {totalQuestions}
        </span>
        <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-light to-brand transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-sm text-white/60">
          {Object.keys(answers).length}/{totalQuestions}
        </span>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-light/20 text-brand-light flex items-center justify-center text-sm font-semibold">
            {currentIndex + 1}
          </span>
          <h3 className="text-lg font-semibold text-white pt-1">{currentQuestion.question}</h3>
        </div>

        {currentQuestion.difficulty && (
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            currentQuestion.difficulty === 'easy'
              ? 'bg-green-500/20 text-green-400'
              : currentQuestion.difficulty === 'medium'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {currentQuestion.difficulty === 'easy' ? 'Fácil' : currentQuestion.difficulty === 'medium' ? 'Media' : 'Difícil'}
          </span>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedAnswer === index
                ? 'bg-brand-light/20 border-brand-light/50 text-white'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${
                selectedAnswer === index
                  ? 'border-brand-light bg-brand-light text-white'
                  : 'border-white/30 text-white/50'
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-white/60 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        <div className="flex gap-1">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex
                  ? 'bg-brand-light'
                  : answers[questions[index].id] !== undefined
                  ? 'bg-white/40'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedAnswer === undefined}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentIndex < totalQuestions - 1 ? 'Siguiente' : 'Ver resultados'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}


