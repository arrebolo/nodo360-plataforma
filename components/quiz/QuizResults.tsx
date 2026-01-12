'use client'

/**
 * QuizResults Component
 *
 * Displays quiz results with detailed feedback
 * - Shows score and pass/fail status
 * - Lists all questions with correct/incorrect indicators
 * - Shows explanations for each question
 * - Options to retry or continue
 * - Confetti animation when passed
 */

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { QuizQuestion } from '@/types/database'
import {
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface QuizResultsProps {
  moduleTitle: string
  results: {
    score: number
    totalQuestions: number
    correctAnswers: number
    passed: boolean
    answers: Array<{
      question_id: string
      selected_answer: number
      correct: boolean
    }>
  }
  questions: QuizQuestion[]
  userAnswers: Record<string, number>
  onRetry: () => void
  onComplete: () => void
}

export function QuizResults({
  moduleTitle,
  results,
  questions,
  userAnswers,
  onRetry,
  onComplete,
}: QuizResultsProps) {
  const { score, totalQuestions, correctAnswers, passed } = results

  // Confetti celebration when passed
  useEffect(() => {
    if (passed) {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Side cannons
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 200);
    }
  }, [passed]);

  // Get performance message
  const getPerformanceMessage = () => {
    if (score >= 90) return '¡Excelente trabajo! Dominas completamente este módulo.'
    if (score >= 80) return '¡Muy bien! Tienes un excelente entendimiento del tema.'
    if (score >= 70) return '¡Bien hecho! Has aprobado el quiz.'
    if (score >= 60) return 'Casi lo logras. Revisa el material y vuelve a intentarlo.'
    return 'Necesitas repasar el contenido del módulo antes de continuar.'
  }

  // Get score color
  const getScoreColor = () => {
    if (score >= 90) return 'from-green-400 to-emerald-500'
    if (score >= 70) return 'from-gold to-gold-light'
    return 'from-red-400 to-rose-500'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Results Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Trophy/Icon */}
        <div className="mb-6 flex justify-center">
          {passed ? (
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-r from-gold to-gold-light flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 0.5,
                repeat: 3,
                delay: 0.5
              }}
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-400 to-rose-500 flex items-center justify-center">
              <RotateCcw className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          {passed ? '¡Felicitaciones!' : '¡Sigue intentando!'}
        </h1>

        {/* Message */}
        <p className="text-lg text-white/70 mb-8">{getPerformanceMessage()}</p>

        {/* Score circle */}
        <div className="inline-block relative">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-white/10"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(score / 100) * 553} 553`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="text-brand-light" stopColor="currentColor" />
                <stop offset="100%" className="text-brand" stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
              {score}%
            </div>
            <div className="text-white/70 text-sm mt-1">
              {correctAnswers}/{totalQuestions} correctas
            </div>
          </div>
        </div>

        {/* Pass/Fail badge */}
        {passed ? (
          <motion.div
            className="mt-6 inline-block px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Aprobado - 70% o más</span>
              <Award className="w-5 h-5 text-green-400" />
            </div>
          </motion.div>
        ) : (
          <div className="mt-6 inline-block px-6 py-3 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold">
                Necesitas 70% o más para aprobar
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <Star className="w-8 h-8 text-gold mx-auto mb-2" />
          <div className="text-2xl font-bold text-white mb-1">{score}%</div>
          <div className="text-sm text-white/60">Calificación</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white mb-1">{correctAnswers}</div>
          <div className="text-sm text-white/60">Correctas</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white mb-1">{totalQuestions}</div>
          <div className="text-sm text-white/60">Total</div>
        </div>
      </div>

      {/* Question Review */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Revisión de Respuestas</h2>

        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[question.id]
            const isCorrect = userAnswer === question.correct_answer
            const resultItem = results.answers.find((a) => a.question_id === question.id)

            return (
              <div
                key={question.id}
                className={`bg-white/5 border-2 rounded-xl p-6 ${
                  isCorrect
                    ? 'border-green-500/30'
                    : 'border-red-500/30'
                }`}
              >
                {/* Question header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${
                      isCorrect
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {question.question}
                    </h3>
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <div className="flex items-center gap-1.5 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Correcto</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-400 text-sm">
                          <XCircle className="w-4 h-4" />
                          <span>Incorrecto</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {question.options.map((option, optionIndex) => {
                    const isUserAnswer = userAnswer === optionIndex
                    const isCorrectAnswer = question.correct_answer === optionIndex
                    const optionLabel = String.fromCharCode(65 + optionIndex)

                    let optionClass = 'bg-white/5 border border-white/10'
                    if (isCorrectAnswer) {
                      optionClass = 'bg-green-500/10 border-2 border-green-500/50'
                    } else if (isUserAnswer && !isCorrect) {
                      optionClass = 'bg-red-500/10 border-2 border-red-500/50'
                    }

                    return (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg ${optionClass}`}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrectAnswer && (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                          {isUserAnswer && !isCorrect && (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          )}
                          <span className="text-white/90 font-medium">{optionLabel}.</span>
                          <span
                            className={
                              isCorrectAnswer
                                ? 'text-green-300'
                                : isUserAnswer && !isCorrect
                                ? 'text-red-300'
                                : 'text-white/70'
                            }
                          >
                            {option}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-sm text-blue-200">
                      <span className="font-semibold">Explicación:</span>{' '}
                      {question.explanation}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onRetry}
          className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reintentar Quiz
        </button>

        {passed && (
          <button
            onClick={onComplete}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white font-semibold hover:shadow-lg hover:shadow-brand-light/50 transition-all flex items-center gap-2"
          >
            Continuar al Siguiente Módulo
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Certificate Generation Note */}
      {passed && (
        <motion.div
          className="mt-8 bg-gradient-to-r from-brand/10 to-brand/10 border border-brand-light/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-light to-brand flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">
                🎉 ¡Certificado Disponible!
              </h3>
              <p className="text-white/70 text-sm mb-3">
                Has aprobado el quiz con {score}%. Tu certificado se ha generado automáticamente
                y está listo para descargar.
              </p>
              <button
                onClick={onComplete}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-light/50 transition-all"
              >
                Ver Certificado
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}


