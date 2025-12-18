// components/course/LessonMicroQuiz.tsx
'use client'

import { useState } from 'react'

export interface LessonMicroQuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

interface LessonMicroQuizProps {
  title?: string
  subtitle?: string
  questions: LessonMicroQuizQuestion[]
}

export function LessonMicroQuiz({
  title = 'Comprobacion rapida',
  subtitle = 'Responde estas preguntas para verificar que has entendido la leccion.',
  questions,
}: LessonMicroQuizProps) {
  const [answers, setAnswers] = useState<number[]>(
    questions.map(() => -1)
  )
  const [submitted, setSubmitted] = useState(false)

  if (!questions.length) return null

  const handleChange = (qIndex: number, optionIndex: number) => {
    if (submitted) return
    setAnswers(prev => {
      const clone = [...prev]
      clone[qIndex] = optionIndex
      return clone
    })
  }

  const handleSubmit = () => {
    if (answers.some(a => a === -1)) {
      alert('Responde todas las preguntas antes de comprobar.')
      return
    }
    setSubmitted(true)
  }

  const handleRetry = () => {
    setSubmitted(false)
    setAnswers(questions.map(() => -1))
  }

  const total = questions.length
  const correctCount = submitted
    ? questions.reduce((acc, q, idx) => {
        if (answers[idx] === q.correctIndex) return acc + 1
        return acc
      }, 0)
    : 0

  const allCorrect = correctCount === total

  return (
    <section className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 backdrop-blur-sm">
      {/* Header */}
      <header className="mb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
        <p className="text-xs text-neutral-400">{subtitle}</p>
      </header>

      {/* Preguntas */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4"
          >
            <p className="mb-3 text-sm font-medium text-neutral-100">
              <span className="text-neutral-500 mr-2">{qIndex + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, optIndex) => {
                const selected = answers[qIndex] === optIndex
                const isCorrectOption = optIndex === q.correctIndex

                // Determinar clases segun estado
                let stateClasses = ''
                if (submitted) {
                  if (selected && isCorrectOption) {
                    // Seleccionada y correcta
                    stateClasses = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                  } else if (selected && !isCorrectOption) {
                    // Seleccionada pero incorrecta
                    stateClasses = 'border-red-500/60 bg-red-500/10 text-red-100'
                  } else if (isCorrectOption) {
                    // No seleccionada pero es la correcta
                    stateClasses = 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100/80'
                  } else {
                    // No seleccionada y no es correcta
                    stateClasses = 'border-transparent bg-neutral-900 text-neutral-400'
                  }
                } else {
                  // Antes de enviar
                  stateClasses = selected
                    ? 'border-neutral-500 bg-neutral-800 text-neutral-50'
                    : 'border-transparent bg-neutral-900 text-neutral-300 hover:bg-neutral-800/80'
                }

                return (
                  <label
                    key={optIndex}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-all ${stateClasses}`}
                  >
                    <input
                      type="radio"
                      name={`lesson-micro-q-${q.id}`}
                      value={optIndex}
                      checked={selected}
                      onChange={() => handleChange(qIndex, optIndex)}
                      disabled={submitted}
                      className="h-3.5 w-3.5 accent-white"
                    />
                    <span className="flex-1">{opt}</span>
                    {submitted && isCorrectOption && (
                      <span className="text-emerald-400 text-xs font-medium">Correcta</span>
                    )}
                    {submitted && selected && !isCorrectOption && (
                      <span className="text-red-400 text-xs font-medium">Incorrecta</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer con resultado y botones */}
      <div className="mt-5 flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {submitted && (
          <div className="text-xs">
            <p className={`font-medium ${allCorrect ? 'text-emerald-300' : 'text-neutral-300'}`}>
              {allCorrect
                ? `Perfecto! ${correctCount}/${total} correctas`
                : `Has acertado ${correctCount} de ${total} preguntas.`
              }
            </p>
            {!allCorrect && (
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Revisa las respuestas correctas marcadas en verde.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {submitted && !allCorrect && (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-neutral-700 transition-all"
            >
              Reintentar
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitted}
            className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[11px] font-medium transition-all ${
              submitted
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {submitted ? 'Revisado' : 'Comprobar respuestas'}
          </button>
        </div>
      </div>
    </section>
  )
}
