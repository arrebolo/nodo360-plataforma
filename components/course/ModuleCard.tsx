'use client'

import { BookOpen, Clock, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface Lesson {
  id: string
  title: string
  slug: string
  duration_minutes: number
  is_completed?: boolean
}

interface ModuleCardProps {
  title: string
  description?: string
  lessons: Lesson[]
  totalDuration: number
  completedCount: number
  onClick?: () => void
  isExpanded?: boolean
}

export function ModuleCard({
  title,
  description,
  lessons,
  totalDuration,
  completedCount,
  onClick,
  isExpanded: controlledExpanded
}: ModuleCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded ?? internalExpanded
  const isCompleted = completedCount === lessons.length && lessons.length > 0

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  return (
    <div className="
      group
      bg-nodo-card
      border border-nodo-icon
      rounded-xl
      overflow-hidden
      transition-all duration-300
      hover:shadow-2xl
      hover:shadow-bitcoin-orange/20
      hover:border-bitcoin-orange/50
    ">
      {/* Module Header - Clickable */}
      <button
        onClick={handleClick}
        className="w-full p-8 text-left transition-all duration-300 hover:bg-nodo-bg"
      >
        <div className="flex items-start gap-4">
          {/* Icon container with gradient */}
          <div className="
            w-14 h-14
            bg-gradient-to-br from-bitcoin-orange to-bitcoin-gold
            rounded-xl
            flex items-center justify-center
            flex-shrink-0
            transition-transform duration-300
            group-hover:scale-110
          ">
            <BookOpen className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              {title}
              {isCompleted && (
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
            </h3>

            {/* Description */}
            {description && (
              <p className="text-base text-slate-400 leading-relaxed mb-3">
                {description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{lessons.length} lecciones</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{totalDuration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>{completedCount}/{lessons.length}</span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Lessons List - Expandable */}
      {isExpanded && lessons.length > 0 && (
        <div className="border-t border-nodo-icon">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="px-8 py-4 border-b border-nodo-icon last:border-b-0 hover:bg-nodo-bg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {lesson.is_completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {index + 1}. {lesson.title}
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex-shrink-0">
                  {lesson.duration_minutes} min
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


