'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { isLessonCompleted, markLessonCompleted, markLessonIncomplete } from '@/lib/utils/progress'
import { toast } from 'sonner'

interface LessonNavigationProps {
  lessonId: string
  courseSlug: string
  courseId: string
  totalLessons: number
  prevLesson?: { slug: string; title: string } | null
  nextLesson?: { slug: string; title: string } | null
  onComplete?: () => void
}

export function LessonNavigation({
  lessonId,
  courseSlug,
  courseId,
  totalLessons,
  prevLesson,
  nextLesson,
  onComplete,
}: LessonNavigationProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    setIsCompleted(isLessonCompleted(lessonId))

    // Listener para cambios
    const handleUpdate = () => {
      setIsCompleted(isLessonCompleted(lessonId))
    }

    window.addEventListener('lesson-completed', handleUpdate)
    window.addEventListener('lesson-uncompleted', handleUpdate)

    return () => {
      window.removeEventListener('lesson-completed', handleUpdate)
      window.removeEventListener('lesson-uncompleted', handleUpdate)
    }
  }, [lessonId])

  const handleToggleComplete = () => {
    if (isCompleted) {
      markLessonIncomplete(lessonId, courseId)
      toast.success('Lección marcada como incompleta')
    } else {
      const progress = markLessonCompleted(lessonId, courseId, totalLessons)

      if (progress?.isCompleted) {
        toast.success('¡Felicitaciones! 🎉', {
          description: 'Has completado todo el curso'
        })
      } else {
        toast.success('Lección completada ✓')
      }

      if (onComplete) {
        onComplete()
      }
    }
  }

  const handleNext = () => {
    // 1. Marcar lección actual como completada automáticamente
    const progress = markLessonCompleted(lessonId, courseId, totalLessons)

    // 2. Verificar si curso se completó
    if (progress?.isCompleted) {
      toast.success('¡Felicitaciones! 🎉', {
        description: 'Has completado todo el curso'
      })
    } else {
      toast.success('Lección completada ✓')
    }

    // 3. Navegar a siguiente lección o al curso
    if (nextLesson) {
      router.push(`/cursos/${courseSlug}/${nextLesson.slug}`)
    } else {
      router.push(`/cursos/${courseSlug}`)
    }
  }

  return (
    <div className="sticky bottom-0 z-40 bg-nodo-bg border-t border-[#F7931A]/30 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Button */}
          {prevLesson ? (
            <Link
              href={`/cursos/${courseSlug}/${prevLesson.slug}`}
              className="flex items-center gap-2 px-4 py-2 bg-nodo-card border border-nodo-icon text-gray-400 rounded-lg hover:bg-nodo-bg hover:text-white hover:border-[#F7931A]/30 transition-all group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline text-sm font-medium">Anterior</span>
            </Link>
          ) : (
            <div className="w-24" />
          )}

          {/* Complete Button */}
          <button
            onClick={handleToggleComplete}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-gradient-to-r from-[#F7931A] to-[#FDB931] text-black hover:shadow-lg hover:shadow-[#F7931A]/30'
            }`}
            aria-label={isCompleted ? 'Marcar como incompleta' : 'Marcar como completada'}
          >
            <Check className="w-5 h-5" />
            <span className="hidden sm:inline">
              {isCompleted ? 'Completada' : 'Marcar como completada'}
            </span>
            <span className="sm:hidden">
              {isCompleted ? 'Hecho' : 'Completar'}
            </span>
          </button>

          {/* Next Button */}
          {nextLesson ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F7931A] to-[#FDB931] text-black rounded-lg hover:shadow-lg hover:shadow-[#F7931A]/30 transition-all group"
            >
              <span className="hidden sm:inline text-sm font-medium">Siguiente</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              <span className="text-sm font-medium">Finalizar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
