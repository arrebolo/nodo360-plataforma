'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EnrollButtonProps {
  courseId: string
  courseSlug: string
  isEnrolled: boolean
  isAuthenticated: boolean
  firstLessonSlug?: string
  className?: string
}

export default function EnrollButton({
  courseId,
  courseSlug,
  isEnrolled,
  isAuthenticated,
  firstLessonSlug,
  className = '',
}: EnrollButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
  const [error, setError] = useState<string | null>(null)

  const handleEnroll = async () => {
    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      router.push(`/login?redirect=/cursos/${courseSlug}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al inscribirse')
      }

      setEnrolled(true)

      // Redirigir a primera lección si existe
      if (firstLessonSlug) {
        router.push(`/cursos/${courseSlug}/${firstLessonSlug}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('[EnrollButton] Error:', err)
      setError(err instanceof Error ? err.message : 'Error al inscribirse')
    } finally {
      setLoading(false)
    }
  }

  // Si ya esta inscrito, mostrar boton de "Ir al curso"
  if (enrolled) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Inscrito en este curso</span>
        </div>

        {firstLessonSlug && (
          <Button
            variant="primary"
            onClick={() => router.push(`/cursos/${courseSlug}/${firstLessonSlug}`)}
            className="w-full"
          >
            Continuar curso
            <span aria-hidden className="text-white/80">→</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        variant="primary"
        onClick={handleEnroll}
        disabled={loading}
        isLoading={loading}
        className="w-full"
      >
        {loading
          ? 'Inscribiendo...'
          : isAuthenticated
          ? 'Inscribirse gratis'
          : 'Iniciar sesión para inscribirse'}
      </Button>

      {error && (
        <div className="px-3 py-2 bg-error/10 border border-error/20 text-error rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  )
}


