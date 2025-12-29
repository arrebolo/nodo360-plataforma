'use client'

import Link from 'next/link'
import { ChevronDown, CheckCircle2, PlayCircle, Lock } from 'lucide-react'
import { useState } from 'react'

interface Lesson {
  id: string
  title: string
  slug: string
  order_index: number
}

interface Module {
  id: string
  title: string
  slug: string
  order_index: number
  lessons: Lesson[]
}

interface LessonSidebarProps {
  modules: Module[]
  courseSlug: string
  currentLessonId: string
}

export function LessonSidebar({ modules, courseSlug, currentLessonId }: LessonSidebarProps) {
  // Find which module contains the current lesson
  const currentModuleId = modules.find(m =>
    m.lessons.some(l => l.id === currentLessonId)
  )?.id

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(currentModuleId ? [currentModuleId] : [])
  )

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  return (
    <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Contenido del curso</h3>
        <p className="text-sm text-white/50 mt-1">
          {modules.length} módulos · {modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones
        </p>
      </div>

      <div className="p-2">
        {modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id)
          const hasCurrentLesson = module.lessons.some(l => l.id === currentLessonId)

          return (
            <div key={module.id} className="mb-2">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                  hasCurrentLesson
                    ? 'bg-[#ff6b35]/10 text-white'
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  hasCurrentLesson
                    ? 'bg-[#ff6b35] text-white'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {moduleIndex + 1}
                </div>
                <span className="flex-1 text-left text-sm font-medium truncate">
                  {module.title}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Lessons List */}
              {isExpanded && (
                <div className="ml-4 pl-5 border-l border-white/10 mt-1 space-y-1">
                  {module.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId

                    return (
                      <Link
                        key={lesson.id}
                        href={`/cursos/${courseSlug}/${lesson.slug}`}
                        className={`flex items-center gap-3 p-2 rounded-lg text-sm transition ${
                          isCurrent
                            ? 'bg-[#ff6b35]/20 text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {isCurrent ? (
                          <PlayCircle className="w-4 h-4 text-[#ff6b35] flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
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
