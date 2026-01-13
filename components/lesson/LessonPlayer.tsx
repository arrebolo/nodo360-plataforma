'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { LessonHeader } from '@/components/lesson/LessonHeader'
import { LessonVideo } from '@/components/lesson/LessonVideo'
import { LessonHeroFallback } from '@/components/lesson/LessonHeroFallback'
import { LessonContent } from '@/components/lesson/LessonContent'
import { LessonSidebar } from '@/components/lesson/LessonSidebar'
import { LessonFooter } from '@/components/lesson/LessonFooter'
import { SlidesEmbed } from '@/components/lesson/SlidesEmbed'
import { useCourseCompletion } from '@/hooks/useCourseCompletion'
import type { LessonPlayerProps } from '@/types/lesson-player'

// Dynamic import for modal (only loaded when needed)
const CourseCompletionModal = dynamic(
  () => import('@/components/lesson/CourseCompletionModal').then(mod => ({ default: mod.CourseCompletionModal })),
  { ssr: false }
)

export default function LessonPlayer({
  userId,
  course,
  lesson,
  module,
  modules,
  progress,
  navigation,
  quizStatus,
}: LessonPlayerProps) {
  const router = useRouter()

  // Optimistic UI state for completion (array for easier manipulation)
  const [completedIds, setCompletedIds] = useState<string[]>(progress.completedLessonIds)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [shouldCelebrateModal, setShouldCelebrateModal] = useState(false)

  const isCompleted = completedIds.includes(lesson.id)

  // Detectar si es la ultima leccion del curso
  const isLastLesson = useMemo(() => {
    return navigation.nextLesson === null
  }, [navigation.nextLesson])

  // Idempotencia: key para localStorage de celebracion
  const celebratedKey = useMemo(() => {
    if (!userId) return null
    return `nodo360_celebrated_${userId}_${course.slug}`
  }, [userId, course.slug])

  // Verificar si debe celebrar (logueado + no celebrado antes)
  const shouldCelebrate = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (!celebratedKey) return false
    return window.localStorage.getItem(celebratedKey) !== '1'
  }, [celebratedKey])

  // Fetch completion data lazily when modal opens
  const completionData = useCourseCompletion(
    course.slug,
    userId,
    showCompletionModal
  )

  // Marcar como celebrado en localStorage
  const markCelebrated = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!celebratedKey) return
    window.localStorage.setItem(celebratedKey, '1')
  }, [celebratedKey])

  // Detectar recursos disponibles
  const hasSlides = !!lesson.slides_url
  const hasPdf = !!lesson.pdf_url
  const hasExternalResources = !!lesson.resources_url
  const hasVideo = !!lesson.video_url
  const hasResources = hasSlides || hasPdf || hasExternalResources

  // Handler: Mark as complete with guards and optimistic UI
  const handleMarkComplete = useCallback(async () => {
    // Guard 1: no logueado
    if (!userId) {
      router.push(`/login?redirect=/cursos/${course.slug}/${lesson.slug}`)
      return
    }

    // Guard 2: ya completada
    if (isCompleted) {
      console.log('⚠️ Leccion ya completada')
      return
    }

    // Guard 3: ya en proceso
    if (isMarkingComplete) {
      console.log('⚠️ Ya guardando progreso')
      return
    }

    setIsMarkingComplete(true)

    // Optimistic: marcar ANTES del POST
    setCompletedIds((prev) => [...prev, lesson.id])

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      })

      if (!res.ok) {
        // Rollback si falla
        console.error('❌ Error guardando progreso')
        setCompletedIds((prev) => prev.filter((id) => id !== lesson.id))
      } else {
        console.log('✅ Progreso guardado')
        // Dispatch event for other components
        window.dispatchEvent(
          new CustomEvent('lesson-completed', {
            detail: { courseSlug: course.slug, lessonId: lesson.id },
          })
        )
      }
    } catch (error) {
      // Rollback
      console.error('❌ Error:', error)
      setCompletedIds((prev) => prev.filter((id) => id !== lesson.id))
    } finally {
      setIsMarkingComplete(false)
    }
  }, [userId, isCompleted, isMarkingComplete, lesson.id, lesson.slug, course.slug, router])

  // Handler: Login redirect
  const handleLogin = useCallback(() => {
    router.push(`/login?redirect=/cursos/${course.slug}/${lesson.slug}`)
  }, [course.slug, lesson.slug, router])

  // Handler: Next lesson
  const handleNext = useCallback(() => {
    if (navigation.nextLesson) {
      router.push(`/cursos/${course.slug}/${navigation.nextLesson.slug}`)
    }
  }, [course.slug, navigation.nextLesson, router])

  // Handler: Previous lesson
  const handlePrev = useCallback(() => {
    if (navigation.prevLesson) {
      router.push(`/cursos/${course.slug}/${navigation.prevLesson.slug}`)
    }
  }, [course.slug, navigation.prevLesson, router])

  // Handler: Finish course (show modal or redirect to quiz)
  const handleFinishCourse = useCallback(() => {
    console.log('[LessonPlayer] Finalizando curso...')
    console.log('[LessonPlayer] Quiz status:', quizStatus)

    // 1. Si hay quiz y el usuario NO lo ha pasado → redirigir al quiz
    if (quizStatus?.hasQuiz && !quizStatus.userPassed) {
      console.log('[LessonPlayer] Redirigiendo al quiz final...')
      router.push(`/cursos/${course.slug}/quiz-final`)
      return
    }

    // 2. Si NO hay quiz o ya lo paso → mostrar modal de celebracion
    console.log('[LessonPlayer] Mostrando modal de celebracion...')
    const willCelebrate = shouldCelebrate()

    // Marcar como celebrado antes de abrir modal
    if (willCelebrate) {
      markCelebrated()
    }

    // Guardar estado de celebracion y abrir modal
    setShouldCelebrateModal(willCelebrate)
    setShowCompletionModal(true)

    // Evento para analytics futuros
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('course-finished', {
          detail: {
            courseSlug: course.slug,
            courseId: course.id,
            userId,
            celebrated: willCelebrate,
          },
        })
      )
    }
  }, [course.slug, course.id, userId, shouldCelebrate, markCelebrated, quizStatus, router])

  // Handler: Close completion modal
  const handleCloseCompletionModal = useCallback(() => {
    setShowCompletionModal(false)
    setShouldCelebrateModal(false)
  }, [])

  // Handle lesson selection from sidebar
  const handleLessonSelect = useCallback(
    (lessonSlug: string) => {
      router.push(`/cursos/${course.slug}/${lessonSlug}`)
    },
    [course.slug, router]
  )

  // Handlers para CTAs del fallback
  const handleOpenSlides = useCallback(() => {
    document.getElementById('lesson-content')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleOpenResources = useCallback(() => {
    document.getElementById('lesson-content')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Footer props (shared between desktop and mobile)
  const footerProps = {
    isCompleted,
    isLoading: isMarkingComplete,
    hasNext: !!navigation.nextLesson,
    hasPrev: !!navigation.prevLesson,
    isLastLesson,
    nextTitle: navigation.nextLesson?.title,
    prevTitle: navigation.prevLesson?.title,
    userId,
    lessonId: lesson.id,
    onMarkComplete: handleMarkComplete,
    onNext: handleNext,
    onPrev: handlePrev,
    onLogin: handleLogin,
    onFinishCourse: handleFinishCourse,
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header with breadcrumb - full width */}
      <LessonHeader
        course={course}
        module={module}
        lesson={lesson}
        navigation={navigation}
      />

      {/* Main content container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column (video + content) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video o Fallback */}
            {hasVideo ? (
              <LessonVideo videoUrl={lesson.video_url} title={lesson.title} />
            ) : (
              <LessonHeroFallback
                title={lesson.title}
                description={lesson.description}
                hasSlides={hasSlides}
                hasPdf={hasPdf}
                hasExternalResources={hasExternalResources}
                onOpenSlides={hasSlides ? handleOpenSlides : undefined}
                onOpenResources={hasResources ? handleOpenResources : undefined}
              />
            )}

            {/* Slides embebidos (si existen) */}
            {hasSlides && lesson.slides_url && (
              <div className="mt-6 bg-dark-secondary border border-dark-border rounded-2xl p-4">
                <SlidesEmbed
                  url={lesson.slides_url}
                  type={lesson.slides_type || 'google_slides'}
                  title="Material de la lección"
                />
              </div>
            )}

            {/* Content with tabs */}
            <LessonContent
              lesson={lesson}
              userId={userId}
              courseSlug={course.slug}
            />

            {/* Footer with CTAs - desktop inline */}
            <div className="hidden sm:block">
              <LessonFooter {...footerProps} />
            </div>
          </div>

          {/* Sidebar - desktop only */}
          <div className="hidden lg:block">
            <LessonSidebar
              courseSlug={course.slug}
              modules={modules}
              currentLessonId={lesson.id}
              completedLessonIds={completedIds}
              onLessonSelect={handleLessonSelect}
            />
          </div>
        </div>

        {/* Fixed footer on mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-dark-secondary/95 backdrop-blur-sm border-t border-dark-border p-4 z-50">
          <LessonFooter {...footerProps} />
        </div>

        {/* Spacer for mobile footer */}
        <div className="sm:hidden h-24" />
      </div>

      {/* Course Completion Modal */}
      <CourseCompletionModal
        isOpen={showCompletionModal}
        onClose={handleCloseCompletionModal}
        courseTitle={course.title}
        courseSlug={course.slug}
        shouldCelebrate={shouldCelebrateModal}
        userName={completionData.userName}
        userProgress={completionData.userProgress}
        nextRecommendation={completionData.nextRecommendation}
        certificateUrl={completionData.certificateUrl}
      />
    </div>
  )
}


