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
  /** Sin sesion, en la ultima leccion: lleva al registro con el examen delante. */
  onRegistrarseParaExamen: () => void
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
  onRegistrarseParaExamen,
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
    // Sin sesion se navega y punto. Antes esto mandaba al login, y era
    // incoherente con el temario lateral, desde el que se podia abrir
    // cualquier leccion sin que nadie preguntara nada: el mismo sitio se
    // alcanzaba por un camino y no por el otro.
    if (!userId) {
      if (hasNext) onNext()
      return
    }

    setIsNavigating(true)

    try {
      // 1. Marcar como completada si no lo esta
      if (!isCompleted) {
        await onMarkComplete()
      }

      // 2. Navegar a siguiente lección
      if (hasNext) {
        onNext()
      }
    } catch (error) {
      console.error('Error al procesar navegacion:', error)
    } finally {
      setIsNavigating(false)
    }
  }

  // Handler para finalizar curso (última lección)
  const handleFinishAndComplete = async () => {
    // Fin del curso sin sesion: aqui SI hace falta cuenta, porque lo que
    // viene es el examen y el certificado. Se dice, en vez de mandar a un
    // login pelado que no explica por que.
    if (!userId) {
      onRegistrarseParaExamen()
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
              Inicia sesión para guardar progreso
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
            // Ultima leccion → finalizar curso, o registrarse si no hay sesion
            <div className="flex flex-col items-end gap-1.5">
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
                  <span>{userId ? 'Finalizar curso' : 'Crear cuenta y hacer el examen'}</span>
                </>
              )}
            </button>
            {!userId && (
              <span className="text-xs text-white/40 text-right max-w-[15rem]">
                Has llegado al final. El examen y el certificado son lo único que
                necesita cuenta.
              </span>
            )}
            </div>
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
