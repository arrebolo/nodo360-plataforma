'use client'

/**
 * QuizStartCard Component
 *
 * Displays quiz information and start button
 * - Shows previous attempts and best score
 * - Lists quiz requirements
 * - Start button to begin quiz
 */

import { Trophy, Clock, HelpCircle, Target, TrendingUp } from 'lucide-react'
import type { QuizAttempt } from '@/types/database'

interface QuizStartCardProps {
  moduleTitle: string
  questionCount: number
  passingScore?: number
  estimatedMinutes?: number
  bestAttempt?: QuizAttempt | null
  previousAttempts?: QuizAttempt[]
  onStart: () => void
  disabled?: boolean
}

export function QuizStartCard({
  moduleTitle,
  questionCount,
  passingScore = 70,
  estimatedMinutes = 15,
  bestAttempt,
  previousAttempts = [],
  onStart,
  disabled = false,
}: QuizStartCardProps) {
  const hasPreviousAttempts = previousAttempts.length > 0
  const hasPassed = bestAttempt?.passed || false

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-gradient-to-r from-brand-light/20 to-brand/20 rounded-2xl mb-4">
          <HelpCircle className="w-12 h-12 text-brand-light" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Quiz del Módulo</h2>
        <p className="text-lg text-white/70">{moduleTitle}</p>
      </div>

      {/* Previous attempt banner */}
      {hasPreviousAttempts && bestAttempt && (
        <div
          className={`mb-6 p-6 rounded-xl border-2 ${
            hasPassed
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                hasPassed
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}
            >
              {hasPassed ? (
                <Trophy className="w-8 h-8 text-white" />
              ) : (
                <TrendingUp className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-lg font-bold ${
                    hasPassed ? 'text-green-400' : 'text-yellow-400'
                  }`}
                >
                  {hasPassed ? '¡Quiz Aprobado!' : 'Mejor Intento'}
                </span>
              </div>
              <div className="text-white/70 text-sm">
                Mejor calificación: <span className="font-semibold text-white">{bestAttempt.score}%</span>
                {' • '}
                Intentos: <span className="font-semibold text-white">{previousAttempts.length}</span>
              </div>
            </div>
            {hasPassed && (
              <div className="text-sm text-green-400 font-semibold px-4 py-2 bg-green-500/20 rounded-lg">
                ✓ Módulo Desbloqueado
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-6">
        <h3 className="text-xl font-bold text-white mb-6">Información del Quiz</h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{questionCount}</div>
              <div className="text-sm text-white/60">Preguntas</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">~{estimatedMinutes}</div>
              <div className="text-sm text-white/60">Minutos</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{passingScore}%</div>
              <div className="text-sm text-white/60">Para Aprobar</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">∞</div>
              <div className="text-sm text-white/60">Intentos</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-white mb-3">Instrucciones:</h4>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-light text-sm font-bold">1</span>
            </div>
            <p className="text-white/70 text-sm">
              Lee cada pregunta cuidadosamente antes de seleccionar tu respuesta.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-light text-sm font-bold">2</span>
            </div>
            <p className="text-white/70 text-sm">
              Puedes navegar entre preguntas y cambiar tus respuestas antes de enviar.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-light text-sm font-bold">3</span>
            </div>
            <p className="text-white/70 text-sm">
              Necesitas responder correctamente al menos {passingScore}% de las preguntas para aprobar.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-light text-sm font-bold">4</span>
            </div>
            <p className="text-white/70 text-sm">
              Puedes reintentar el quiz las veces que necesites. Se guardará tu mejor calificación.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-light text-sm font-bold">5</span>
            </div>
            <p className="text-white/70 text-sm">
              Al aprobar, desbloquearás el siguiente módulo del curso.
            </p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="text-center">
        <button
          onClick={onStart}
          disabled={disabled}
          className="px-12 py-4 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white text-lg font-bold hover:shadow-lg hover:shadow-brand-light/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {hasPreviousAttempts ? 'Reintentar Quiz' : 'Comenzar Quiz'}
        </button>

        {!hasPassed && hasPreviousAttempts && (
          <p className="mt-4 text-sm text-white/60">
            Necesitas un {passingScore}% o más para desbloquear el siguiente módulo
          </p>
        )}
      </div>
    </div>
  )
}


