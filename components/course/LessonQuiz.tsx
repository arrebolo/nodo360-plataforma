'use client'

import { useState, useMemo } from 'react'
import type { QuizQuestionDTO } from '@/lib/db/quiz'

interface LessonQuizProps {
  moduleId: string
  moduleTitle: string
  questions: QuizQuestionDTO[]
}

/**
 * Función para mezclar un array (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Randomiza preguntas y opciones manteniendo el índice correcto
 */
function randomizeQuestions(questions: QuizQuestionDTO[]): QuizQuestionDTO[] {
  // 1. Mezclar orden de preguntas
  let shuffled = shuffleArray(questions)

  // 2. Mezclar opciones de cada pregunta
  shuffled = shuffled.map((q) => {
    const optionsWithIndex = q.options.map((opt, idx) => ({ opt, originalIdx: idx }))
    const shuffledOptions = shuffleArray(optionsWithIndex)

    const newCorrectIndex = shuffledOptions.findIndex(
      (o) => o.originalIdx === q.correctAnswerIndex
    )

    return {
      ...q,
      options: shuffledOptions.map((o) => o.opt),
      correctAnswerIndex: newCorrectIndex,
    }
  })

  return shuffled
}

export function LessonQuiz({
  moduleId,
  moduleTitle,
  questions: initialQuestions,
}: LessonQuizProps) {
  // Estado para las preguntas actuales (puede cambiar en reintentos)
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestionDTO[]>(initialQuestions)
  const [answers, setAnswers] = useState<number[]>(Array(currentQuestions.length).fill(-1))
  const [attemptCount, setAttemptCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    correctAnswers: number
    totalQuestions: number
  } | null>(null)

  const handleChange = (qIndex: number, optionIndex: number) => {
    const next = [...answers]
    next[qIndex] = optionIndex
    setAnswers(next)
  }

  const handleSubmit = async () => {
    if (answers.some((a) => a === -1)) {
      alert('Responde todas las preguntas antes de enviar.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          answers,
          questions: currentQuestions,
        }),
      })

      if (!res.ok) {
        console.error('Error enviando quiz', await res.text())
        alert('No se ha podido guardar el intento. Intenta de nuevo.')
        return
      }

      const data = await res.json()
      setResult({
        score: data.score,
        passed: data.passed,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
      })
    } catch (error) {
      console.error('[LessonQuiz] Error en handleSubmit', error)
      alert('Error al enviar el quiz.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentQuestions.length) {
    return null
  }

  const allAnswered = answers.every((a) => a !== -1)

  return (
    <section className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">
          Quiz del Módulo
        </h2>
        <p className="text-sm text-neutral-400">
          {moduleTitle} — Responde estas {currentQuestions.length} preguntas para consolidar lo aprendido.
          {attemptCount > 0 && (
            <span className="ml-2 text-amber-400">(Intento {attemptCount + 1})</span>
          )}
        </p>
      </header>

      {/* Preguntas */}
      <div className="space-y-8">
        {currentQuestions.map((q, qIndex) => (
          <div
            key={q.id}
            className="rounded-xl border border-neutral-800 bg-neutral-950 p-6"
          >
            <p className="mb-5 text-base font-medium text-white">
              <span className="text-neutral-500 mr-3">{qIndex + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-3">
              {q.options.map((opt, optIndex) => {
                const isSelected = answers[qIndex] === optIndex
                const showResult = result !== null
                const isCorrect = q.correctAnswerIndex === optIndex
                const wasWrong = showResult && isSelected && !isCorrect

                return (
                  <label
                    key={optIndex}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl px-5 py-4 text-sm transition-all ${
                      showResult
                        ? isCorrect
                          ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                          : wasWrong
                          ? 'bg-red-950/50 border border-red-800 text-red-300'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                        : isSelected
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value={optIndex}
                      checked={isSelected}
                      onChange={() => handleChange(qIndex, optIndex)}
                      disabled={result !== null}
                      className="h-4 w-4 accent-white"
                    />
                    <span className="flex-1">{opt}</span>
                    {showResult && isCorrect && (
                      <span className="text-emerald-400 text-xs font-medium">Correcta</span>
                    )}
                    {showResult && wasWrong && (
                      <span className="text-red-400 text-xs font-medium">Incorrecta</span>
                    )}
                  </label>
                )
              })}
            </div>

            {/* Explicación después de responder */}
            {result && q.explanation && (
              <div className="mt-4 p-4 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-300">
                <span className="font-medium text-white">Explicación:</span> {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resultado */}
      {result && (
        <div className={`mt-8 rounded-xl p-6 ${
          result.passed
            ? 'bg-emerald-950/50 border border-emerald-800'
            : 'bg-red-950/50 border border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">
                {result.passed ? '¡Felicidades!' : 'No has superado el quiz'}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Resultado: <span className="text-white font-medium">{result.score}%</span>
                <span className="text-neutral-500 ml-2">({result.correctAnswers}/{result.totalQuestions} correctas)</span>
              </p>
            </div>
            <div className={`text-4xl font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.score}%
            </div>
          </div>
          <p className={`mt-4 text-sm ${result.passed ? 'text-emerald-300' : 'text-red-300'}`}>
            {result.passed
              ? 'Has superado el quiz de este módulo. ¡Continúa con el siguiente!'
              : 'Necesitas un 50% para aprobar. Revisa el contenido e intenta de nuevo.'}
          </p>
        </div>
      )}

      {/* Botón enviar */}
      {!result && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {allAnswered
              ? 'Todas las preguntas respondidas'
              : `${answers.filter(a => a !== -1).length}/${currentQuestions.length} respondidas`}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !allAnswered}
            className={`px-8 py-3 rounded-full font-semibold text-sm transition-all ${
              allAnswered && !isSubmitting
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        </div>
      )}

      {/* Botón reintentar */}
      {result && !result.passed && (
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              // Randomizar preguntas y opciones para el nuevo intento
              const newQuestions = randomizeQuestions(initialQuestions)
              setCurrentQuestions(newQuestions)
              setResult(null)
              setAnswers(Array(newQuestions.length).fill(-1))
              setAttemptCount((prev) => prev + 1)
            }}
            className="px-8 py-3 rounded-full font-semibold text-sm bg-amber-600 text-white hover:bg-amber-500 transition-all"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </section>
  )
}
