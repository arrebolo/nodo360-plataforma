'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Trophy, ArrowRight, Award, X, BookOpen, TrendingUp } from 'lucide-react'
import confetti from 'canvas-confetti'

type NextCourseRecommendation = {
  slug: string
  title: string
  level: string
  lessonsCount: number
}

type UserProgress = {
  totalCoursesCompleted: number
  totalLessonsCompleted: number
  currentStreak?: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
  courseTitle: string
  courseSlug: string
  shouldCelebrate?: boolean
  userName?: string | null
  userProgress?: UserProgress | null
  nextRecommendation?: NextCourseRecommendation | null
  certificateUrl?: string | null
}

export function CourseCompletionModal({
  isOpen,
  onClose,
  courseTitle,
  courseSlug,
  shouldCelebrate = false,
  userName,
  userProgress,
  nextRecommendation,
  certificateUrl,
}: Props) {
  const router = useRouter()
  const confettiFiredRef = useRef(false)
  const primaryBtnRef = useRef<HTMLButtonElement>(null)

  // Disparar confeti UNA sola vez cuando se abre (si debe celebrar)
  useEffect(() => {
    if (isOpen && shouldCelebrate && !confettiFiredRef.current) {
      confettiFiredRef.current = true

      const duration = 1500
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#f97316', '#fbbf24', '#10b981'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#f97316', '#fbbf24', '#10b981'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [isOpen, shouldCelebrate])

  // Reset confetti flag cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      confettiFiredRef.current = false
    }
  }, [isOpen])

  // Focus al boton primario cuando se abre
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        primaryBtnRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // ESC para cerrar
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevenir scroll del body cuando esta abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleViewCertificate = useCallback(() => {
    if (certificateUrl) {
      router.push(certificateUrl)
    } else {
      router.push(`/dashboard/certificados?curso=${courseSlug}`)
    }
    onClose()
  }, [router, courseSlug, certificateUrl, onClose])

  const handleNextCourse = useCallback(() => {
    if (nextRecommendation) {
      router.push(`/cursos/${nextRecommendation.slug}`)
    } else {
      router.push('/cursos')
    }
    onClose()
  }, [router, nextRecommendation, onClose])

  const handleGoToDashboard = useCallback(() => {
    router.push('/dashboard')
    onClose()
  }, [router, onClose])

  const handleExploreRoutes = useCallback(() => {
    router.push('/dashboard/rutas')
    onClose()
  }, [router, onClose])

  if (!isOpen) return null

  const displayName = userName || 'Estudiante'
  const coursesCompleted = userProgress?.totalCoursesCompleted || 1
  const lessonsCompleted = userProgress?.totalLessonsCompleted || 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Contenedor centrado */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-complete-title"
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Boton cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-neutral-400" />
          </button>

          {/* Header con gradiente */}
          <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 px-6 py-8 text-center text-white">
            {/* Icono de trofeo */}
            <div className="mx-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-white" />
            </div>

            {/* Titulo personalizado */}
            <h2
              id="course-complete-title"
              className="text-2xl font-bold mb-1"
            >
              Felicidades, {displayName}!
            </h2>

            <p className="text-white/90">
              Has completado el curso
            </p>
            <p className="text-lg font-semibold mt-1">
              {courseTitle}
            </p>
          </div>

          {/* Contenido principal */}
          <div className="p-6 space-y-5">
            {/* CTA Certificado - Primario */}
            <Card className="p-4 border-2 border-orange-200 bg-orange-50/50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    Tu certificado esta listo
                  </h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    Descarga tu certificado y comparte tu logro en redes sociales.
                  </p>
                  <Button
                    ref={primaryBtnRef}
                    variant="primary"
                    size="sm"
                    onClick={handleViewCertificate}
                  >
                    <Award className="h-4 w-4" />
                    Ver certificado
                  </Button>
                </div>
              </div>
            </Card>

            {/* Progreso global */}
            {userProgress && (
              <div className="flex items-center gap-4 px-4 py-3 bg-neutral-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <div className="text-sm">
                  <span className="font-semibold text-neutral-900">{coursesCompleted}</span>
                  <span className="text-neutral-600"> cursos completados</span>
                  {lessonsCompleted > 0 && (
                    <>
                      <span className="text-neutral-400 mx-2">·</span>
                      <span className="font-semibold text-neutral-900">{lessonsCompleted}</span>
                      <span className="text-neutral-600"> lecciones</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Siguiente curso recomendado */}
            {nextRecommendation && (
              <Card className="p-4 hover:border-orange-200 transition-colors cursor-pointer" onClick={handleNextCourse}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                      Siguiente recomendado
                    </p>
                    <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-1">
                      {nextRecommendation.title}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {nextRecommendation.level} · {nextRecommendation.lessonsCount} lecciones
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-1" />
                </div>
              </Card>
            )}

            {/* Navegacion secundaria */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-center gap-4">
              <button
                onClick={handleGoToDashboard}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
              >
                Ir al dashboard
              </button>
              <span className="text-neutral-300">|</span>
              <button
                onClick={handleExploreRoutes}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
              >
                Explorar rutas
              </button>
              {!nextRecommendation && (
                <>
                  <span className="text-neutral-300">|</span>
                  <button
                    onClick={handleNextCourse}
                    className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition flex items-center gap-1"
                  >
                    Ver mas cursos
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCompletionModal
