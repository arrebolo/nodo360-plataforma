'use client'

import { ReactNode } from 'react'
import { AccessGuard } from './AccessGuard'
import { CompleteButton } from './CompleteButton'

interface LessonPageWrapperProps {
  children: ReactNode
  courseSlug: string
  lessonSlug: string
  lessonId: string
  isPremium: boolean
  allLessons: Array<{ slug: string; order_index: number }>
  nextLessonSlug?: string
}

export function LessonPageWrapper({
  children,
  courseSlug,
  lessonSlug,
  lessonId,
  isPremium,
  allLessons,
  nextLessonSlug
}: LessonPageWrapperProps) {
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
                lessonSlug={lessonSlug}
                lessonId={lessonId}
                nextLessonSlug={nextLessonSlug}
              />
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  )
}
