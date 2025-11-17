'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { isLessonCompleted } from '@/lib/utils/progress'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { CourseWithModules } from '@/types/database'

interface CourseSidebarProps {
  course: CourseWithModules
  currentLessonSlug?: string
  progress?: {
    completed: number
    total: number
    percentage: number
  }
}

export function CourseSidebar({ course, currentLessonSlug, progress }: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  // Cargar estado de lecciones completadas
  useEffect(() => {
    const updateCompletedLessons = () => {
      const completed = new Set<string>()
      course.modules.forEach((module) => {
        module.lessons?.forEach((lesson) => {
          if (isLessonCompleted(lesson.id)) {
            completed.add(lesson.id)
          }
        })
      })
      setCompletedLessons(completed)
    }

    // Initial load
    updateCompletedLessons()

    // Listeners para actualizaciones en tiempo real
    const handleProgressUpdate = () => {
      updateCompletedLessons()
    }

    window.addEventListener('lesson-completed', handleProgressUpdate)
    window.addEventListener('lesson-uncompleted', handleProgressUpdate)
    window.addEventListener('progress-updated', handleProgressUpdate)

    return () => {
      window.removeEventListener('lesson-completed', handleProgressUpdate)
      window.removeEventListener('lesson-uncompleted', handleProgressUpdate)
      window.removeEventListener('progress-updated', handleProgressUpdate)
    }
  }, [course])

  // Expandir módulo que contiene la lección actual
  useEffect(() => {
    if (currentLessonSlug) {
      course.modules.forEach((module) => {
        const hasCurrentLesson = module.lessons?.some((l) => l.slug === currentLessonSlug)
        if (hasCurrentLesson) {
          setExpandedModules((prev) => new Set(prev).add(module.id))
        }
      })
    }
  }, [currentLessonSlug, course])

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

  const sortedModules = [...course.modules].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-[#2a2a2a] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <h3 className="text-lg font-bold text-white mb-4">Contenido del curso</h3>
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progreso</span>
              <span className="font-bold text-[#F7931A]">{progress.percentage}%</span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F7931A] to-[#FDB931] rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {progress.completed} de {progress.total} lecciones
            </p>
          </div>
        )}
      </div>

      {/* Modules and Lessons */}
      <div className="max-h-[600px] overflow-y-auto">
        {sortedModules.map((module) => {
          const isExpanded = expandedModules.has(module.id)
          const sortedLessons = [...(module.lessons || [])].sort(
            (a, b) => a.order_index - b.order_index
          )

          return (
            <div key={module.id} className="border-b border-[#2a2a2a] last:border-b-0">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors text-left"
                aria-expanded={isExpanded}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-white">{module.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {sortedLessons.length} lecciones
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Lessons List */}
              {isExpanded && (
                <div className="bg-black/20">
                  {sortedLessons.map((lesson) => {
                    const isCompleted = completedLessons.has(lesson.id)
                    const isCurrent = lesson.slug === currentLessonSlug
                    const isLocked = false // TODO: Implementar lógica de bloqueo para premium

                    if (isLocked) {
                      return (
                        <div
                          key={lesson.id}
                          className="px-4 py-3 flex items-center gap-3 opacity-50"
                        >
                          <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-500 flex-1">{lesson.title}</span>
                          <span className="text-xs text-gray-600">🔒</span>
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={lesson.id}
                        href={`/cursos/${course.slug}/modulos/${module.slug}/lecciones/${lesson.slug}`}
                        className={`px-4 py-3 flex items-center gap-3 hover:bg-[#1a1a1a] transition-colors ${
                          isCurrent ? 'bg-[#F7931A]/10 border-l-2 border-[#F7931A]' : ''
                        }`}
                      >
                        <div className="w-4 h-4 flex-shrink-0">
                          {isCompleted ? (
                            <span className="text-emerald-400">✓</span>
                          ) : isCurrent ? (
                            <span className="text-[#F7931A]">→</span>
                          ) : (
                            <span className="text-gray-600">□</span>
                          )}
                        </div>
                        <span
                          className={`text-sm flex-1 ${
                            isCurrent
                              ? 'text-white font-medium'
                              : isCompleted
                              ? 'text-gray-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {lesson.title}
                        </span>
                        {lesson.video_duration_minutes > 0 && (
                          <span className="text-xs text-gray-600">
                            {lesson.video_duration_minutes}min
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resources Section */}
      <div className="p-6 border-t border-[#2a2a2a] space-y-4">
        <div>
          <h4 className="text-sm font-medium text-white mb-3">📚 Recursos Útiles</h4>
          <div className="space-y-2">
            <a
              href="#"
              className="block text-sm text-gray-400 hover:text-[#F7931A] transition-colors"
            >
              📄 Documentación oficial
            </a>
            <a
              href="#"
              className="block text-sm text-gray-400 hover:text-[#F7931A] transition-colors"
            >
              💾 Archivos del curso
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white mb-3">💬 Comunidad</h4>
          <Link
            href="/comunidad"
            className="block w-full px-4 py-2 bg-gradient-to-r from-[#F7931A] to-[#FDB931] text-black text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-[#F7931A]/20 transition-all text-center"
          >
            Ir a la comunidad
          </Link>
        </div>
      </div>
    </div>
  )
}
