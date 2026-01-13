'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
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
  return (
    <div className="bg-dark-secondary border-b border-dark-border px-4 sm:px-6 py-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Breadcrumb + Title */}
          <div className="min-w-0 flex-1">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-white/50 mb-1">
              <Link
                href={`/cursos/${course.slug}`}
                className="hover:text-white transition-colors truncate max-w-[200px]"
              >
                {course.title}
              </Link>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <span className="text-white/40 truncate">{module.title}</span>
            </nav>

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
  )
}

export default LessonHeader


