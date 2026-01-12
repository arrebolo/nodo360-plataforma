'use client'

import { useState } from 'react'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBadgeNotification } from '@/hooks/useBadgeNotification'

interface CompleteButtonProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  lessonId: string
  nextLessonSlug?: string
  nextLessonModuleSlug?: string
  isCompleted: boolean
}

export function CompleteButton({
  courseSlug,
  moduleSlug,
  lessonSlug,
  lessonId,
  nextLessonSlug,
  nextLessonModuleSlug,
  isCompleted: initialCompleted,
}: CompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { notifyBadges } = useBadgeNotification()

  const handleComplete = async () => {
    try {
      setLoading(true)

      // ✅ Contrato real de tu API: solo { lessonId }
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'Error al guardar progreso')
      }

      // Mostrar badges ganados (si hay)
      if (data.awardedBadges && data.awardedBadges.length > 0) {
        notifyBadges(data.awardedBadges)
      }

      setIsCompleted(true)

      // CRÍTICO: evento para refrescar UI dependiente
      window.dispatchEvent(
        new CustomEvent('lesson-completed', {
          detail: { courseSlug, moduleSlug, lessonSlug, lessonId },
        })
      )

      console.log('✅ Lección marcada como completada:', lessonSlug)

      // Refresca server components/progreso
      router.refresh()

      // Navegación como antes (con pequeño delay)
      setTimeout(() => {
        if (nextLessonSlug) {
          router.push(`/cursos/${courseSlug}/${nextLessonSlug}`)
        } else {
          router.push(`/cursos/${courseSlug}`)
        }
      }, 200)
    } catch (e) {
      console.error('❌ Error completando lección:', e)
      // MVP: dejamos solo log. Si quieres, añadimos toast.
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (nextLessonSlug) router.push(`/cursos/${courseSlug}/${nextLessonSlug}`)
    else router.push(`/cursos/${courseSlug}`)
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
          disabled={loading}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-light to-brand-light/80 hover:from-brand-light/80 hover:to-gold text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
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
          disabled={loading}
          className="text-brand-light hover:text-brand-light/80 transition-colors disabled:opacity-60"
        >
          ← Volver al curso
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-light to-brand-light/80 hover:from-brand-light/80 hover:to-gold text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
    >
      <CheckCircle className="w-5 h-5" />
      {loading ? 'Guardando…' : 'Marcar como Completada'}
    </button>
  )
}

