// components/learning/NextLessonButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NextLessonButtonProps {
  courseSlug: string
  lessonSlug: string
  isLastLesson?: boolean
}

export function NextLessonButton({
  courseSlug,
  lessonSlug,
  isLastLesson = false,
}: NextLessonButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleClick = async () => {
    if (isLoading) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/learning/next-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, lessonSlug }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('[NextLessonButton] Error API:', data)
        setErrorMsg(data.error || 'No se pudo avanzar a la siguiente lección.')
        setIsLoading(false)
        return
      }

      // Mostrar mensaje de éxito brevemente
      if (data.status === 'COURSE_COMPLETED') {
        setIsCompleted(true)
        // Esperar un momento para que el usuario vea el mensaje
        setTimeout(() => {
          if (data.redirectTo) {
            router.push(data.redirectTo)
          }
        }, 1500)
      } else if (data.redirectTo) {
        router.push(data.redirectTo)
      } else {
        setErrorMsg('No se recibió una ruta de redirección.')
        setIsLoading(false)
      }

    } catch (err) {
      console.error('[NextLessonButton] Error inesperado:', err)
      setErrorMsg('Ha ocurrido un error inesperado.')
      setIsLoading(false)
    }
  }

  // Estado: curso completado
  if (isCompleted) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] px-5 py-2 rounded-full text-[14px] font-semibold shadow-[0_8px_20px_rgba(247,147,26,0.35)]">
          🎉 ¡Curso completado!
        </div>
        <p className="text-[11px] text-[#4CAF7A]">Redirigiendo...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] px-5 py-2 rounded-full text-[14px] font-semibold shadow-[0_8px_20px_rgba(247,147,26,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(247,147,26,0.55)] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Guardando...
          </>
        ) : isLastLesson ? (
          '✓ Completar curso'
        ) : (
          'Siguiente lección →'
        )}
      </button>
      {errorMsg && (
        <p className="text-[11px] text-[#E15B5B] max-w-[200px] text-right">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
