'use client'

import * as React from 'react'
import Link from 'next/link'
import { cx } from '@/lib/design/tokens'
import { CheckCircle, Circle, PlayCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { LessonSidebarProps } from '@/types/lesson-player'

/**
 * Small circular progress for module completion
 */
function ModuleProgress({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  const size = 24
  const strokeWidth = 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? completed / total : 0
  const offset = circumference - progress * circumference
  const isComplete = completed === total && total > 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
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
          className={isComplete ? 'text-success' : 'text-brand'}
        />
      </svg>
    </div>
  )
}

export function LessonSidebar({
  courseSlug,
  modules,
  currentLessonId,
  completedLessonIds,
  onLessonSelect,
}: LessonSidebarProps) {
  const completedSet = new Set(completedLessonIds)

  // Find which module contains the current lesson
  const currentModuleId = modules.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId)
  )?.id

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(currentModuleId ? [currentModuleId] : modules[0] ? [modules[0].id] : [])
  )

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => completedSet.has(l.id)).length,
    0
  )

  return (
    <div className="bg-dark-secondary border border-dark-border rounded-2xl h-fit sticky top-4 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <h3 className="font-semibold text-white">Contenido del curso</h3>
        <p className="text-xs text-white/50 mt-1">
          {completedLessons}/{totalLessons} completadas
        </p>
      </div>

      {/* Lista de módulos y lecciones */}
      <div className="max-h-[60vh] overflow-y-auto">
        {modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id)
          const hasCurrentLesson = module.lessons.some((l) => l.id === currentLessonId)
          const moduleCompletedCount = module.lessons.filter((l) => completedSet.has(l.id)).length
          const isModuleCompleted = moduleCompletedCount === module.lessons.length && module.lessons.length > 0

          return (
            <div key={module.id} className="border-b border-dark-border last:border-b-0">
              {/* Module Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleModule(module.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleModule(module.id)
                  }
                }}
                className={cx(
                  'w-full flex items-center gap-3 p-3 transition-colors text-left cursor-pointer',
                  hasCurrentLesson ? 'bg-brand/10' : 'hover:bg-white/5'
                )}
              >
                {/* Module number or progress */}
                <div
                  className={cx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                    isModuleCompleted
                      ? 'bg-success/20 text-success'
                      : hasCurrentLesson
                      ? 'bg-brand/20 text-brand'
                      : 'bg-white/10 text-white/60'
                  )}
                >
                  {isModuleCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    moduleIndex + 1
                  )}
                </div>

                {/* Module title */}
                <span className={cx(
                  'flex-1 text-sm font-medium truncate',
                  hasCurrentLesson ? 'text-white' : 'text-white/80'
                )}>
                  {module.title}
                </span>

                {/* Progress + Chevron */}
                <div className="flex items-center gap-2">
                  <ModuleProgress
                    completed={moduleCompletedCount}
                    total={module.lessons.length}
                  />
                  <ChevronDown
                    className={cx(
                      'w-4 h-4 text-white/40 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </div>
              </div>

              {/* Lessons List */}
              {isExpanded && (
                <div className="divide-y divide-dark-border bg-dark-tertiary/50">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCurrent = lesson.id === currentLessonId
                    const isCompleted = completedSet.has(lesson.id)

                    // Determine icon
                    const LessonIcon = isCompleted
                      ? CheckCircle
                      : isCurrent
                      ? PlayCircle
                      : Circle

                    const iconColor = isCompleted
                      ? 'text-success'
                      : isCurrent
                      ? 'text-brand'
                      : 'text-white/30'

                    const handleClick = (e: React.MouseEvent) => {
                      if (onLessonSelect) {
                        e.preventDefault()
                        onLessonSelect(lesson.slug)
                      }
                    }

                    return (
                      <Link
                        key={lesson.id}
                        href={`/cursos/${courseSlug}/${lesson.slug}`}
                        onClick={handleClick}
                        className={cx(
                          'px-4 py-3 flex items-center gap-3 transition-colors',
                          isCurrent ? 'bg-brand/10' : 'hover:bg-white/5'
                        )}
                      >
                        <LessonIcon className={cx('h-5 w-5 flex-shrink-0', iconColor)} />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cx(
                              'text-sm truncate',
                              isCurrent
                                ? 'font-medium text-brand'
                                : isCompleted
                                ? 'text-white/50'
                                : 'text-white/80'
                            )}
                          >
                            {lessonIndex + 1}. {lesson.title}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LessonSidebar


