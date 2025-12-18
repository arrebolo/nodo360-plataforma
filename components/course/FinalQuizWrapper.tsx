// components/course/FinalQuizWrapper.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { QuizQuestionDTO } from '@/lib/db/quiz'
import type { ProgressResponse } from '@/types/progress'

interface FinalQuizWrapperProps {
  moduleId: string
  moduleTitle: string
  questions: QuizQuestionDTO[]
  courseSlug: string
  courseId: string
}

export function FinalQuizWrapper({
  moduleId,
  moduleTitle,
  questions,
  courseSlug,
  courseId,
}: FinalQuizWrapperProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    correctAnswers: number
    totalQuestions: number
  } | null>(null)
  const [isGeneratingCert, setIsGeneratingCert] = useState(false)
  const [certGenerated, setCertGenerated] = useState(false)

  const handleChange = (qIndex: number, optionIndex: number) => {
    if (result) return
    setAnswers(prev => {
      const clone = [...prev]
      clone[qIndex] = optionIndex
      return clone
    })
  }

  const handleSubmit = async () => {
    if (answers.some(a => a === -1)) {
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
          questions,
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

      // Si aprobo, generar certificado
      if (data.passed) {
        await generateCertificate()
      }
    } catch (error) {
      console.error('[FinalQuizWrapper] Error en handleSubmit', error)
      alert('Error al enviar el quiz.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateCertificate = async () => {
    setIsGeneratingCert(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseSlug,
          forceCheck: true,
        }),
      })

      const data: ProgressResponse = await res.json()

      if (data.success && (data.status === 'COURSE_COMPLETED' || data.certificate_issued || data.certificate)) {
        setCertGenerated(true)
        console.log('Certificado generado!')
      }
    } catch (error) {
      console.error('Error generando certificado:', error)
    } finally {
      setIsGeneratingCert(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setAnswers(Array(questions.length).fill(-1))
  }

  const allAnswered = answers.every(a => a !== -1)

  // Pantalla de felicitacion con certificado generado
  if (result?.passed && certGenerated) {
    return (
      <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Felicidades! Has completado el curso
        </h2>
        <p className="text-sm text-emerald-300/80 mb-2">
          Puntuacion final: {result.score}%
        </p>
        <p className="text-sm text-emerald-300/60 mb-6">
          Tu certificado ha sido generado y esta disponible en tu perfil.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href={`/cursos/${courseSlug}`}
            className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-all"
          >
            Volver al curso
          </Link>
          <Link
            href="/dashboard/certificados"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-all"
          >
            Ver mi certificado
          </Link>
        </div>
      </div>
    )
  }

  // Generando certificado
  if (result?.passed && isGeneratingCert) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-8 text-center">
        <div className="animate-pulse text-4xl mb-4">...</div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Generando tu certificado...
        </h2>
        <p className="text-sm text-neutral-400">
          Esto solo tomara un momento.
        </p>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">
          {moduleTitle}
        </h2>
        <p className="text-sm text-neutral-400">
          Responde estas {questions.length} preguntas para obtener tu certificado.
          Necesitas un 60% para aprobar.
        </p>
      </header>

      {/* Preguntas */}
      <div className="space-y-8">
        {questions.map((q, qIndex) => (
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
                      name={`final-quiz-q-${qIndex}`}
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

            {result && q.explanation && (
              <div className="mt-4 p-4 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-300">
                <span className="font-medium text-white">Explicacion:</span> {q.explanation}
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
                {result.passed ? 'Felicidades!' : 'No has superado el quiz'}
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
              ? 'Has superado el quiz final. Tu certificado se esta generando...'
              : 'Necesitas un 60% para aprobar. Revisa el contenido e intenta de nuevo.'}
          </p>
        </div>
      )}

      {/* Boton enviar */}
      {!result && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {allAnswered
              ? 'Todas las preguntas respondidas'
              : `${answers.filter(a => a !== -1).length}/${questions.length} respondidas`}
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

      {/* Boton reintentar */}
      {result && !result.passed && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleRetry}
            className="px-8 py-3 rounded-full font-semibold text-sm bg-neutral-800 text-white hover:bg-neutral-700 transition-all"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </section>
  )
}
