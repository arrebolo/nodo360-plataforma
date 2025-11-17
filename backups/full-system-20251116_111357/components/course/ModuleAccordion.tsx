'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Check, Lock, Circle, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { CourseWithModules, Lesson } from '@/types/database'
import type { LessonState } from '@/types/course-system'
import { getLessonState, trackLockedAccessAttempt } from '@/lib/utils/progress'

interface ModuleAccordionProps {
  course: CourseWithModules
  currentLessonSlug?: string
  onLessonClick?: (lessonSlug: string) => void
}

export function ModuleAccordion({
  course,
  currentLessonSlug,
  onLessonClick,
}: ModuleAccordionProps) {
  const router = useRouter()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map(m => m.id))
  )

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleLessonClick = (lesson: Lesson, moduleId: string, state: LessonState) => {
    // Si está bloqueada, mostrar toast y no permitir acceso
    if (state === 'locked') {
      toast.error('Completa la lección anterior primero', {
        description: 'Las lecciones deben completarse en orden',
        duration: 3000,
      })

      // Analytics: intento de acceso a contenido bloqueado
      trackLockedAccessAttempt(lesson.id, course.id, 'Lección anterior no completada')
      return
    }

    // Si hay callback personalizado, usarlo
    if (onLessonClick) {
      onLessonClick(lesson.slug)
      return
    }

    // Navegar a la lección
    router.push(`/cursos/${course.slug}/${lesson.slug}`)
  }

  const getLessonIcon = (state: LessonState, isActive: boolean) => {
    const iconClass = "w-5 h-5 flex-shrink-0"

    switch (state) {
      case 'completed':
        return <Check className={`${iconClass} text-emerald-400`} />
      case 'in_progress':
        return <PlayCircle className={`${iconClass} text-[#F7931A]`} />
      case 'available':
        return <Circle className={`${iconClass} ${isActive ? 'text-[#F7931A]' : 'text-gray-500'}`} />
      case 'locked':
        return <Lock className={`${iconClass} text-gray-600`} />
    }
  }

  const sortedModules = [...course.modules].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-3">
      {sortedModules.map((module) => {
        const isExpanded = expandedModules.has(module.id)
        const sortedLessons = [...module.lessons].sort((a, b) => a.order_index - b.order_index)

        // Calcular estadísticas del módulo
        const completedCount = sortedLessons.filter(lesson => {
          const state = getLessonState(course, module.id, lesson.slug)
          return state === 'completed'
        }).length

        return (
          <div
            key={module.id}
            className="bg-nodo-card border border-nodo-icon rounded-lg overflow-hidden"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-nodo-bg transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`module-${module.id}`}
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{module.title}</h3>
                  {module.description && (
                    <p className="text-sm text-gray-400 line-clamp-1">{module.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm text-gray-400">
                  {completedCount}/{sortedLessons.length}
                </span>
                {completedCount === sortedLessons.length && sortedLessons.length > 0 && (
                  <Check className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            </button>

            {/* Module Lessons */}
            {isExpanded && (
              <div
                id={`module-${module.id}`}
                className="border-t border-nodo-icon"
                role="region"
                aria-label={`Lecciones del módulo ${module.title}`}
              >
                {sortedLessons.map((lesson, lessonIndex) => {
                  const state = getLessonState(course, module.id, lesson.slug)
                  const isActive = lesson.slug === currentLessonSlug
                  const isClickable = state !== 'locked'

                  return (
                    <div
                      key={lesson.id}
                      className={`
                        flex items-center gap-4 px-6 py-4 border-b border-nodo-icon last:border-b-0
                        ${isClickable ? 'cursor-pointer hover:bg-nodo-bg' : 'cursor-not-allowed opacity-60'}
                        ${isActive ? 'bg-[#0f172a]' : ''}
                        transition-colors
                      `}
                      onClick={() => handleLessonClick(lesson, module.id, state)}
                      role="button"
                      tabIndex={isClickable ? 0 : -1}
                      aria-label={`${lesson.title} - ${state === 'completed' ? 'Completada' : state === 'locked' ? 'Bloqueada' : 'Disponible'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleLessonClick(lesson, module.id, state)
                        }
                      }}
                    >
                      {/* Lesson Icon */}
                      {getLessonIcon(state, isActive)}

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`
                          font-medium text-sm
                          ${isActive ? 'text-[#F7931A]' : state === 'locked' ? 'text-gray-500' : 'text-white'}
                        `}>
                          {lessonIndex + 1}. {lesson.title}
                        </div>
                        {lesson.video_duration_minutes > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {lesson.video_duration_minutes} min
                          </div>
                        )}
                      </div>

                      {/* State Badge */}
                      {state === 'locked' && (
                        <span className="text-xs px-2 py-1 bg-gray-800 text-gray-500 rounded">
                          Bloqueada
                        </span>
                      )}
                      {state === 'in_progress' && (
                        <span className="text-xs px-2 py-1 bg-[#F7931A]/10 text-[#F7931A] rounded">
                          En progreso
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
