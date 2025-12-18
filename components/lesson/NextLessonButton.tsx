'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import { CertificateModal } from '@/components/certificates/CertificateModal'

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
  const [certificateModal, setCertificateModal] = useState<{
    isOpen: boolean
    certificate: { certificate_number: string; course_title: string } | null
  }>({ isOpen: false, certificate: null })

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
      // =====================================================
      // CASO 1: Es la ÚLTIMA lección del curso
      // SIEMPRE llamar a /api/progress para verificar quiz
      // =====================================================
      if (isLastLessonOfCourse && !nextLesson) {
        console.log('🎯 [NextLessonButton] Última lección del curso, verificando estado...')

        // Usar forceCheck para verificar estado del curso sin re-completar lección
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: currentLessonId,
            courseSlug: courseSlug,
            forceCheck: isAlreadyCompleted,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al verificar progreso')
        }

        console.log('✅ [NextLessonButton] Respuesta:', data)

        // Mostrar éxito si se completó la lección
        if (!isAlreadyCompleted) {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 2000)
        }

        // Manejar redirección a quiz final
        if (data?.status === 'NEEDS_FINAL_QUIZ' && data.redirectTo) {
          console.log('🎓 [NextLessonButton] Quiz final requerido, redirigiendo...')
          setMessage('Quiz final requerido para obtener certificado...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          router.push(data.redirectTo)
          return
        }

        // Verificar si se completó el curso y hay certificado
        const hasCertificate = data.certificate_issued || data.certificate || data.certificate_number
        const certNumber = data.certificate_number || data.certificate?.number || data.certificate?.certificate_number
        const courseTitle = data.course_title || data.certificate?.title || 'Curso'

        if (hasCertificate && certNumber) {
          console.log('🎉 [NextLessonButton] ¡Curso completado con certificado!', certNumber)
          setCertificateModal({
            isOpen: true,
            certificate: {
              certificate_number: certNumber,
              course_title: courseTitle,
            }
          })
          setLoading(false)
          return
        }

        // Curso completado sin certificado (no certificable)
        if (data.course_completed || data.status === 'COURSE_COMPLETED') {
          console.log('🎉 [NextLessonButton] Curso completado (sin certificado)')
          setMessage('¡Curso completado! 🎉')
          await new Promise(resolve => setTimeout(resolve, 1500))
          router.push(`/cursos/${courseSlug}?completed=1`)
          return
        }

        // Fallback: ir al curso
        router.push(`/cursos/${courseSlug}`)
        return
      }

      // =====================================================
      // CASO 2: NO es la última lección (hay nextLesson)
      // =====================================================

      // Marcar lección actual como completada (si no lo está ya)
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

        console.log('✅ [NextLessonButton] Lección completada:', data)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        console.log('ℹ️  [NextLessonButton] Lección ya estaba completada')
      }

      // Navegar a la siguiente lección
      if (nextLesson) {
        console.log('➡️  [NextLessonButton] Navegando a siguiente lección:', nextLesson.title)
        setMessage('Cargando siguiente lección...')
        await new Promise(resolve => setTimeout(resolve, 300))
        router.push(`/cursos/${courseSlug}/${nextLesson.slug}`)
      } else {
        // Fin de módulo (pero no del curso)
        console.log('✅ [NextLessonButton] Módulo completado')
        setMessage('¡Módulo completado! Siguiente módulo desbloqueado 🎉')
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

  const handleCloseCertificateModal = () => {
    setCertificateModal({ isOpen: false, certificate: null })
    // Navegar al curso después de cerrar el modal
    router.push(`/cursos/${courseSlug}`)
  }

  return (
    <>
      {/* Modal de Certificado */}
      {certificateModal.certificate && (
        <CertificateModal
          isOpen={certificateModal.isOpen}
          onClose={handleCloseCertificateModal}
          certificate={certificateModal.certificate}
        />
      )}

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
          className="w-full px-6 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-[#ff6b35]/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
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
            <p className="text-xs text-gray-400 text-center">
              ✓ Esta lección se marcará como completada automáticamente
            </p>
          )}

          {/* Hint de teclado */}
          {!loading && (
            <p className="text-xs text-gray-500 text-center">
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
