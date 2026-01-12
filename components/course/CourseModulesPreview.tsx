'use client'

import { ChevronDown, ChevronUp, PlayCircle, Lock } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { cx } from '@/lib/design/tokens'

interface Lesson {
  id: string
  title: string
  slug: string
  order_index: number
  video_duration_minutes?: number | null
  is_free_preview?: boolean
}

interface Module {
  id: string
  title: string
  description?: string | null
  order_index: number
  lessons: Lesson[]
}

interface Props {
  courseSlug: string
  modules: Module[]
}

export default function CourseModulesPreview({ courseSlug, modules }: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set([modules[0]?.id])
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

  if (modules.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-500">No hay módulos disponibles</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(module.id)
        const lessonCount = module.lessons.length

        return (
          <Card
            key={module.id}
            className="overflow-hidden transition-all duration-200"
          >
            {/* Header del módulo */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Número del módulo */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium flex-shrink-0">
                  {moduleIndex + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900">
                    {module.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                    <span>{lessonCount} {lessonCount === 1 ? 'lección' : 'lecciones'}</span>
                    {module.description && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px]">{module.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {moduleIndex > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 border border-neutral-200">
                      <Lock className="h-3 w-3" />
                      Requiere módulo anterior
                    </span>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-neutral-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-neutral-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Lista de lecciones */}
            {isExpanded && (
              <div className="border-t border-black/5 divide-y divide-black/5">
                {module.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson.id}
                    className={cx(
                      'flex items-center gap-3 px-4 sm:px-5 py-3',
                      lessonIndex === 0 && moduleIndex === 0
                        ? 'bg-neutral-50'
                        : 'opacity-70'
                    )}
                  >
                    {lessonIndex === 0 && moduleIndex === 0 ? (
                      <PlayCircle className="h-5 w-5 flex-shrink-0 text-orange-500" />
                    ) : (
                      <Lock className="h-5 w-5 flex-shrink-0 text-neutral-300" />
                    )}
                    <span className="flex-1 text-sm text-neutral-900">
                      {lessonIndex + 1}. {lesson.title}
                    </span>
                    {lesson.video_duration_minutes && (
                      <span className="text-xs text-neutral-400 flex-shrink-0">
                        {lesson.video_duration_minutes} min
                      </span>
                    )}
                    {lesson.is_free_preview && (
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] rounded border border-sky-200">
                        Vista previa
                      </span>
                    )}
                  </div>
                ))}

                {module.lessons.length === 0 && (
                  <div className="px-4 sm:px-5 py-4 text-sm text-neutral-400 italic">
                    Este módulo aún no tiene lecciones
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
