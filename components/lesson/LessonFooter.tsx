'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, ArrowLeft, ArrowRight, LogIn, Trophy } from 'lucide-react'
import { cx } from '@/lib/design/tokens'

type Props = {
  isCompleted: boolean
  isLoading: boolean
  hasNext: boolean
  hasPrev: boolean
  isLastLesson: boolean
  nextTitle?: string
  prevTitle?: string
  userId: string | null
  lessonId?: string
  onMarkComplete: () => Promise<void> | void
  onNext: () => void
  onPrev: () => void
  onLogin: () => void
  onFinishCourse: () => void
}

// Mensajes motivacionales para variedad
const completionMessages = [
  '¡Buen trabajo!',
  '¡Sigue asi!',
  '¡Excelente!',
  '¡Lo lograste!',
  '¡Genial!',
]

export function LessonFooter({
  isCompleted,
  isLoading,
  hasNext,
  hasPrev,
  isLastLesson,
  nextTitle,
  prevTitle,
  userId,
  lessonId,
  onMarkComplete,
  onNext,
  onPrev,
  onLogin,
  onFinishCourse,
}: Props) {
  const [isNavigating, setIsNavigating] = useState(false)

  // Seleccionar mensaje basado en lessonId para consistencia
  const completionMessage = useMemo(() => {
    if (!lessonId) return completionMessages[0]
    const index = lessonId.charCodeAt(0) % completionMessages.length
    return completionMessages[index]
  }, [lessonId])

  // Handler combinado: marcar completada + navegar
  const handleNextAndComplete = async () => {
    if (!userId) {
      onLogin()
      return
    }

    setIsNavigating(true)

    try {
      // 1. Marcar como completada si no lo esta
      if (!isCompleted) {
        await onMarkComplete()
      }

      // 2. Navegar a siguiente leccion
      if (hasNext) {
        onNext()
      }
    } catch (error) {
      console.error('Error al procesar navegacion:', error)
    } finally {
      setIsNavigating(false)
    }
  }

  // Handler para finalizar curso (ultima leccion)
  const handleFinishAndComplete = async () => {
    if (!userId) {
      onLogin()
      return
    }

    setIsNavigating(true)

    try {
      // 1. Marcar como completada si no lo esta
      if (!isCompleted) {
        await onMarkComplete()
      }

      // 2. Llamar a finalizar curso
      onFinishCourse()
    } catch (error) {
      console.error('Error al finalizar curso:', error)
    } finally {
      setIsNavigating(false)
    }
  }

  const isProcessing = isLoading || isNavigating

  return (
    <div className="bg-dark-secondary border border-dark-border rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navegacion izquierda */}
        <div className="flex-1 flex justify-start">
          {hasPrev && (
            <button
              onClick={onPrev}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}
        </div>

        {/* Centro: estado de completado (solo badge informativo) */}
        <div className="flex-shrink-0">
          {!userId ? (
            <span className="text-sm text-white/40">
              Inicia sesion para guardar progreso
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/20 text-success text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              {completionMessage}
            </span>
          ) : (
            <span className="text-sm text-white/40">
              Se marcara como completada al continuar
            </span>
          )}
        </div>

        {/* Navegacion derecha - Boton principal */}
        <div className="flex-1 flex justify-end">
          {isLastLesson ? (
            // Ultima leccion → Finalizar curso
            <button
              onClick={handleFinishAndComplete}
              disabled={isProcessing}
              className={cx(
                "inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl transition-all",
                isProcessing
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-lg hover:shadow-brand/25"
              )}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  <span>Finalizar curso</span>
                </>
              )}
            </button>
          ) : hasNext ? (
            // Tiene siguiente → Siguiente (marca completada automaticamente)
            <button
              onClick={handleNextAndComplete}
              disabled={isProcessing}
              className={cx(
                "inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl transition-all",
                isProcessing
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-lg hover:shadow-brand/25"
              )}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Siguiente</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <span className="text-sm text-white/40">Fin del contenido</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default LessonFooter
