'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

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
  className = ''
}: EnrollButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
  const [error, setError] = useState<string | null>(null)

  const handleEnroll = async () => {
    console.log('🔍 [EnrollButton] Iniciando inscripción...')
    console.log('📊 [EnrollButton] Datos:', {
      courseId,
      courseSlug,
      isEnrolled,
      isAuthenticated,
      firstLessonSlug
    })

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      console.log('⚠️  [EnrollButton] Usuario no autenticado, redirigiendo a login')
      router.push(`/login?redirect=/cursos/${courseSlug}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('📤 [EnrollButton] Enviando inscripción...')
      console.log('   courseId:', courseId)

      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      console.log('📥 [EnrollButton] Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      const data = await response.json()
      console.log('📊 [EnrollButton] Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Error al inscribirse')
      }

      console.log('✅ [EnrollButton] Inscripción exitosa')
      setEnrolled(true)

      // Redirigir a primera lección si existe
      if (firstLessonSlug) {
        router.push(`/cursos/${courseSlug}/${firstLessonSlug}`)
      } else {
        // Si no hay primera lección, refrescar página para mostrar botón actualizado
        router.refresh()
      }
    } catch (err) {
      console.error('❌ [EnrollButton] Error:', err)
      setError(err instanceof Error ? err.message : 'Error al inscribirse')
    } finally {
      setLoading(false)
    }
  }

  // Si ya está inscrito, mostrar botón de "Ir al curso"
  if (enrolled) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Inscrito en este curso</span>
        </div>

        {firstLessonSlug && (
          <button
            onClick={() => router.push(`/cursos/${courseSlug}/${firstLessonSlug}`)}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-[#ff6b35]/50 transition"
          >
            Continuar Curso
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-[#ff6b35]/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Inscribiendo...
          </>
        ) : (
          <>
            {isAuthenticated ? 'Inscribirse Gratis' : 'Iniciar Sesión para Inscribirse'}
          </>
        )}
      </button>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
