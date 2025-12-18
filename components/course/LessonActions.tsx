// components/course/LessonActions.tsx

'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CheckCircle2, PlayCircle } from 'lucide-react'

interface LessonActionsProps {
  courseId: string
  courseSlug: string
  lessonId: string
  nextLessonSlug: string | null
  initialIsCompleted: boolean
}

export function LessonActions({
  courseId,
  courseSlug,
  lessonId,
  nextLessonSlug,
  initialIsCompleted
}: LessonActionsProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)
  const [isPending, startTransition] = useTransition()

  const markCompleted = () => {
    if (isPending) return

    startTransition(async () => {
      try {
        const res = await fetch('/api/lessons/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, lessonId })
        })

        if (!res.ok) {
          console.error('❌ Error marcando lección como completada')
          return
        }

        const data = await res.json()
        console.log('✅ Lección completada:', data)

        setIsCompleted(true)
        router.refresh()

        // Si hay siguiente lección, navegamos
        if (nextLessonSlug) {
          router.push(`/cursos/${courseSlug}/${nextLessonSlug}`)
        }
      } catch (error) {
        console.error('❌ Error en petición completado:', error)
      }
    })
  }

  const handleNextClick = () => {
    if (!nextLessonSlug) return

    // Si aún no está marcada como completada, la marcamos y luego navegamos
    if (!isCompleted) {
      markCompleted()
      return
    }

    router.push(`/cursos/${courseSlug}/${nextLessonSlug}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={markCompleted}
        disabled={isPending || isCompleted}
        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-emerald-400 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isCompleted
          ? 'Lección completada'
          : isPending
          ? 'Guardando...'
          : 'Marcar como completada'}
      </button>

      {nextLessonSlug && (
        <button
          type="button"
          onClick={handleNextClick}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f8a94a] to-[#f08c30] px-4 py-2 text-xs font-semibold text-[#050712] transition hover:shadow-md"
        >
          <PlayCircle className="h-4 w-4" />
          Siguiente lección
        </button>
      )}
    </div>
  )
}
