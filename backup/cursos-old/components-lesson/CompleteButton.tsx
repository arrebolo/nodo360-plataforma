'use client'

import { useState } from 'react'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { ProgressManager } from '@/lib/progress-manager'
import { useRouter } from 'next/navigation'

interface CompleteButtonProps {
  courseSlug: string
  lessonSlug: string
  lessonId: string
  nextLessonSlug?: string
  isCompleted: boolean
}

export function CompleteButton({
  courseSlug,
  lessonSlug,
  lessonId,
  nextLessonSlug,
  isCompleted: initialCompleted
}: CompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const router = useRouter()

  const handleComplete = () => {
    // Marcar como completada
    ProgressManager.markLessonCompleted(courseSlug, lessonSlug, lessonId)
    setIsCompleted(true)

    // CRÍTICO: Disparar evento para actualizar la UI
    window.dispatchEvent(new CustomEvent('lesson-completed', {
      detail: { courseSlug, lessonSlug }
    }))

    // Log para debug
    console.log('✅ Lección marcada como completada:', lessonSlug)

    // Pequeño delay antes de navegar para asegurar que el evento se procese
    setTimeout(() => {
      if (nextLessonSlug) {
        router.push(`/cursos/${courseSlug}/${nextLessonSlug}`)
      } else {
        // Volver a la página del curso para ver progreso
        router.push(`/cursos/${courseSlug}`)
      }
    }, 300)
  }

  const handleNext = () => {
    if (nextLessonSlug) {
      router.push(`/cursos/${courseSlug}/${nextLessonSlug}`)
    } else {
      router.push(`/cursos/${courseSlug}`)
    }
  }

  if (isCompleted && nextLessonSlug) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-green-500 justify-center">
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">¡Lección Completada!</span>
        </div>
        <button
          onClick={handleNext}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] hover:from-[#ff8c5a] hover:to-[#FFD700] text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
        >
          Siguiente Lección
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-green-500">
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">Lección Completada</span>
        </div>
        <button
          onClick={() => router.push(`/cursos/${courseSlug}`)}
          className="text-[#ff6b35] hover:text-[#ff8c5a] transition-colors"
        >
          ← Volver al curso
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleComplete}
      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] hover:from-[#ff8c5a] hover:to-[#FFD700] text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
    >
      <CheckCircle className="w-5 h-5" />
      Marcar como Completada
    </button>
  )
}
