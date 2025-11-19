'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AccessGuard } from './AccessGuard'
import { CompleteButton } from './CompleteButton'
import { ProgressManager } from '@/lib/progress-manager'

interface LessonPageWrapperProps {
  children: ReactNode
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  lessonId: string
  isPremium: boolean
  allLessons: Array<{ slug: string; order_index: number; moduleSlug?: string }>
  nextLessonSlug?: string
  nextLessonModuleSlug?: string
}

export function LessonPageWrapper({
  children,
  courseSlug,
  moduleSlug,
  lessonSlug,
  lessonId,
  isPremium,
  allLessons,
  nextLessonSlug,
  nextLessonModuleSlug
}: LessonPageWrapperProps) {
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Check if lesson is completed
    const completed = ProgressManager.isLessonCompleted(courseSlug, lessonSlug)
    setIsCompleted(completed)
  }, [courseSlug, lessonSlug])

  return (
    <AccessGuard
      courseSlug={courseSlug}
      lessonSlug={lessonSlug}
      isPremium={isPremium}
      allLessons={allLessons}
    >
      {children}

      {/* Complete button at the bottom */}
      <div className="bg-gradient-to-b from-[#252b3d] to-[#1a1f2e] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-white mb-2">
                  ¿Terminaste esta lección?
                </h3>
                <p className="text-white/70 text-sm">
                  Marca como completada para desbloquear la siguiente lección
                </p>
              </div>
              <CompleteButton
                courseSlug={courseSlug}
                moduleSlug={moduleSlug}
                lessonSlug={lessonSlug}
                lessonId={lessonId}
                nextLessonSlug={nextLessonSlug}
                nextLessonModuleSlug={nextLessonModuleSlug}
                isCompleted={isCompleted}
              />
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  )
}
