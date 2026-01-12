'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  currentLessonId: string
  currentLessonSlug: string
  courseSlug: string
  moduleTitle: string
  nextLesson: {
    slug: string
    title: string
  } | null
  isLastLessonOfCourse: boolean
  isAlreadyCompleted: boolean
}

export default function NextLessonButton({
  currentLessonId,
  currentLessonSlug,
  courseSlug,
  moduleTitle,
  nextLesson,
  isLastLessonOfCourse,
  isAlreadyCompleted
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Prefetch siguiente lección para navegación instantánea
  useEffect(() => {
    if (nextLesson) {
      router.prefetch(`/cursos/${courseSlug}/${nextLesson.slug}`)
    }
  }, [nextLesson, courseSlug, router])

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter o flecha derecha para siguiente
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && !loading) {
        // Solo si no estamos en un input/textarea
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [loading])

  const handleNext = async () => {
    console.log('🔍 [NextLessonButton] Procesando siguiente lección...')
    setLoading(true)
    setMessage('')

    try {
      // 1. Marcar lección actual como completada (si no lo está ya)
      if (!isAlreadyCompleted) {
        console.log('📝 [NextLessonButton] Completando lección actual...')

        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: currentLessonId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al guardar progreso')
        }

        console.log('✅ [NextLessonButton] Lección completada')
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        console.log('ℹ️  [NextLessonButton] Lección ya estaba completada')
      }

      // 2. Determinar a dónde navegar
      if (nextLesson) {
        // Hay siguiente lección
        console.log('➡️  [NextLessonButton] Navegando a siguiente lección:', nextLesson.title)
        setMessage('Cargando siguiente lección...')

        // Pequeña pausa para feedback visual
        await new Promise(resolve => setTimeout(resolve, 300))

        router.push(`/cursos/${courseSlug}/${nextLesson.slug}`)
      } else {
        // Es la última lección
        console.log('🎉 [NextLessonButton] Última lección completada, volviendo al curso')
        setMessage(
          isLastLessonOfCourse
            ? '¡Curso completado! 🎉'
            : '¡Módulo completado! Siguiente módulo desbloqueado 🎉'
        )

        // Pausa para mostrar mensaje
        await new Promise(resolve => setTimeout(resolve, 1500))

        router.push(`/cursos/${courseSlug}`)
      }
    } catch (err) {
      console.error('❌ [NextLessonButton] Error:', err)
      setMessage(err instanceof Error ? err.message : 'Error al procesar')
      setLoading(false)
    }
  }

  // Determinar texto del botón
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Procesando...</span>
        </>
      )
    }

    if (nextLesson) {
      return (
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm opacity-80">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-bold truncate">{nextLesson.title}</span>
        </div>
      )
    }

    const text = isLastLessonOfCourse ? 'Finalizar Curso' : 'Finalizar Módulo'
    return (
      <>
        <CheckCircle className="w-5 h-5" />
        <span>{text}</span>
      </>
    )
  }

  return (
    <>
      {/* Notificación de éxito flotante */}
      {showSuccess && (
        <div className="fixed top-4 right-4 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg animate-slide-in-right flex items-center gap-2 z-50">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">¡Lección completada! ✓</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Botón principal */}
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-brand-light/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 flex-1">
            {getButtonContent()}
          </div>

          {!loading && (
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          )}
        </button>

        {/* Indicadores y hints */}
        <div className="flex flex-col gap-2">
          {/* Indicador de auto-completado */}
          {!isAlreadyCompleted && !loading && (
            <p className="text-xs text-white/60 text-center">
              ✓ Esta lección se marcará como completada automáticamente
            </p>
          )}

          {/* Hint de teclado */}
          {!loading && (
            <p className="text-xs text-white/50 text-center">
              Presiona{' '}
              <kbd className="px-2 py-1 bg-white/10 rounded text-[10px]">Enter</kbd>
              {' '}o{' '}
              <kbd className="px-2 py-1 bg-white/10 rounded text-[10px]">→</kbd>
              {' '}para continuar
            </p>
          )}

          {/* Mensaje de feedback */}
          {message && (
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded-lg text-sm text-center animate-fade-in">
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


