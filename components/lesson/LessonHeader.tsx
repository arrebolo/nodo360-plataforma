'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Info, X } from 'lucide-react'
import type { LessonHeaderProps } from '@/types/lesson-player'
import { LessonBookmarkButton } from './LessonBookmarkButton'

/**
 * Circular progress indicator SVG
 */
function CircularProgress({
  current,
  total,
  size = 40,
  strokeWidth = 3,
}: {
  current: number
  total: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? current / total : 0
  const offset = circumference - progress * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-brand transition-all duration-300"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-white/80">
          {current}/{total}
        </span>
      </div>
    </div>
  )
}

export function LessonHeader({
  course,
  module,
  lesson,
  navigation,
}: LessonHeaderProps) {
  const [showModuleInfo, setShowModuleInfo] = useState(false)

  return (
    <>
      <div className="bg-dark-secondary border-b border-dark-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Breadcrumb + Title */}
            <div className="min-w-0 flex-1">
              {/* Breadcrumb + Module Info */}
              <div className="flex items-center gap-3 flex-wrap mb-1">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-white/50">
                  <Link
                    href={`/cursos/${course.slug}`}
                    className="hover:text-white transition-colors truncate max-w-[200px]"
                  >
                    {course.title}
                  </Link>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <span className="text-white/60 truncate">{module.title}</span>
                </nav>

                {/* Divider + Info Button */}
                {module.description && (
                  <>
                    <span className="text-white/20">|</span>
                    <button
                      onClick={() => setShowModuleInfo(true)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-brand border border-brand/30 rounded-full hover:bg-brand/10 hover:border-brand/60 transition-all"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Ver módulo
                    </button>
                  </>
                )}
              </div>

              {/* Lesson title */}
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white truncate">
                {lesson.title}
              </h1>
            </div>

            {/* Right side: Bookmark + Progress indicator */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <LessonBookmarkButton lessonId={lesson.id} />
              <CircularProgress
                current={navigation.currentIndex}
                total={navigation.totalLessons}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module Info Modal */}
      {showModuleInfo && module.description && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModuleInfo(false)}
        >
          <div
            className="bg-dark-secondary border border-dark-border rounded-2xl p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Modulo {module.order_index + 1}</p>
                <h3 className="text-lg font-semibold text-white">{module.title}</h3>
              </div>
              <button
                onClick={() => setShowModuleInfo(false)}
                className="p-1 text-white/40 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 leading-relaxed">{module.description}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default LessonHeader


