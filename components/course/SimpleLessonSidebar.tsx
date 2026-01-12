'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Play, CheckCircle, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Lesson {
  id: string
  slug: string
  title: string
  order_index: number
  isCompleted?: boolean
}

interface Module {
  id: string
  slug: string
  title: string
  lessons: Lesson[]
}

interface SimpleLessonSidebarProps {
  courseSlug: string
  currentLessonSlug: string
  modules: Module[]
  className?: string
}

export default function SimpleLessonSidebar({
  courseSlug,
  currentLessonSlug,
  modules,
  className = '',
}: SimpleLessonSidebarProps) {
  // Expandir el módulo de la lección actual por defecto
  const currentModuleId = modules.find((m) =>
    m.lessons.some((l) => l.slug === currentLessonSlug)
  )?.id

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(currentModuleId ? [currentModuleId] : [])
  )

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-bold text-white">Contenido del curso</h3>
      </div>

      {/* Modules List */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id)
          const completedCount = module.lessons.filter((l) => l.isCompleted).length
          const totalLessons = module.lessons.length

          return (
            <div key={module.id} className="border-b border-white/5 last:border-b-0">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                    {moduleIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-sm font-medium text-white truncate">
                      {module.title}
                    </h4>
                    <p className="text-xs text-white/50">
                      {completedCount}/{totalLessons} lecciones
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </motion.div>
              </button>

              {/* Lessons List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-white/5">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isCurrentLesson = lesson.slug === currentLessonSlug
                        const lessonUrl = `/cursos/${courseSlug}/${lesson.slug}`

                        return (
                          <Link
                            key={lesson.id}
                            href={lessonUrl}
                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${
                              isCurrentLesson ? 'bg-brand-light/10 border-l-2 border-brand-light' : ''
                            }`}
                          >
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                              {lesson.isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : isCurrentLesson ? (
                                <Play className="w-4 h-4 text-brand-light" />
                              ) : (
                                <Circle className="w-4 h-4 text-white/30" />
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm truncate ${
                                  isCurrentLesson
                                    ? 'text-brand-light font-medium'
                                    : lesson.isCompleted
                                    ? 'text-white/70'
                                    : 'text-white/60'
                                }`}
                              >
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}


