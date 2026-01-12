'use client'

import { Quiz, Question, QuizResult } from '@/types/quiz'
import { Trophy, XCircle, RotateCcw, Check, X, Clock, Star } from 'lucide-react'

interface QuizResultsDisplayProps {
  result: QuizResult
  quiz: Quiz
  questions: Question[]
  answers: Record<string, string[]>
  onRetry?: () => void
  onClose?: () => void
}

export function QuizResultsDisplay({
  result,
  quiz,
  questions,
  answers,
  onRetry,
  onClose
}: QuizResultsDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Result header */}
      <div className={`p-8 text-center ${result.passed ? 'bg-success/10' : 'bg-error/10'}`}>
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
          result.passed ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
        }`}>
          {result.passed ? (
            <Trophy className="w-10 h-10" />
          ) : (
            <XCircle className="w-10 h-10" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {result.passed ? 'Felicidades!' : 'Sigue intentando'}
        </h2>

        <p className="text-white/70 mb-4">
          {result.passed
            ? 'Has aprobado el quiz exitosamente'
            : `Necesitas ${quiz.passing_score}% para aprobar`}
        </p>

        {/* Score circle */}
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-white/10 relative mb-4">
          <div
            className={`absolute inset-0 rounded-full ${result.passed ? 'border-success' : 'border-error'}`}
            style={{
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: 'transparent',
              borderTopColor: result.passed ? 'rgb(34 197 94)' : 'rgb(239 68 68)',
              borderRightColor: result.score >= 25 ? (result.passed ? 'rgb(34 197 94)' : 'rgb(239 68 68)') : 'transparent',
              borderBottomColor: result.score >= 50 ? (result.passed ? 'rgb(34 197 94)' : 'rgb(239 68 68)') : 'transparent',
              borderLeftColor: result.score >= 75 ? (result.passed ? 'rgb(34 197 94)' : 'rgb(239 68 68)') : 'transparent',
              transform: `rotate(${(result.score / 100) * 360}deg)`
            }}
          />
          <span className="text-4xl font-bold text-white">{result.score}%</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-success mb-1">
              <Check className="w-4 h-4" />
              <span className="text-lg font-bold">{result.correctAnswers}</span>
            </div>
            <p className="text-xs text-white/50">Correctas</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-white/70 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-bold">{formatTime(result.timeSpent)}</span>
            </div>
            <p className="text-xs text-white/50">Tiempo</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-brand-light mb-1">
              <Star className="w-4 h-4" />
              <span className="text-lg font-bold">+{result.xpEarned || 0}</span>
            </div>
            <p className="text-xs text-white/50">XP</p>
          </div>
        </div>
      </div>

      {/* Review answers */}
      {quiz.show_correct_answers && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revision de respuestas</h3>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const selectedIds = answers[question.id] || []
              const correctIds = question.options?.filter(o => o.is_correct).map(o => o.id) || []
              const isCorrect =
                selectedIds.length === correctIds.length &&
                selectedIds.every(id => correctIds.includes(id))

              return (
                <div key={question.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCorrect ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                    }`}>
                      {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/50 mb-1">Pregunta {index + 1}</p>
                      <p className="text-white">{question.question_text}</p>
                    </div>
                  </div>

                  <div className="ml-9 space-y-2">
                    {question.options?.map((option) => {
                      const wasSelected = selectedIds.includes(option.id)
                      const isCorrectOption = option.is_correct

                      let optionStyle = 'bg-white/5 border-white/10 text-white/60'
                      if (wasSelected && isCorrectOption) {
                        optionStyle = 'bg-success/20 border-success text-success'
                      } else if (wasSelected && !isCorrectOption) {
                        optionStyle = 'bg-error/20 border-error text-error'
                      } else if (!wasSelected && isCorrectOption) {
                        optionStyle = 'bg-success/10 border-success/50 text-success/70'
                      }

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border ${optionStyle}`}
                        >
                          {wasSelected && isCorrectOption && <Check className="w-4 h-4 flex-shrink-0" />}
                          {wasSelected && !isCorrectOption && <X className="w-4 h-4 flex-shrink-0" />}
                          {!wasSelected && isCorrectOption && <Check className="w-4 h-4 flex-shrink-0 opacity-50" />}
                          {!wasSelected && !isCorrectOption && <div className="w-4 h-4 flex-shrink-0" />}
                          <span className="text-sm">{option.option_text}</span>
                        </div>
                      )
                    })}
                  </div>

                  {question.explanation && (
                    <div className="ml-9 mt-3 p-3 bg-brand-light/10 border border-brand-light/20 rounded-lg">
                      <p className="text-sm text-brand-light">{question.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-white/10 bg-white/5">
        {onRetry && !result.passed && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Intentar de nuevo
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-brand-light/30 transition"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  )
}
