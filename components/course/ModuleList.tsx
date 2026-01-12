'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp, Lock, CheckCircle, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { cx } from '@/lib/design/tokens'
import type { ModuleWithState } from '@/lib/progress/getCourseProgress'

interface Props {
  courseSlug: string
  modules: ModuleWithState[]
}

export default function ModuleList({ courseSlug, modules }: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set([modules[0]?.id]) // Primer módulo expandido por defecto
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
      <div className="bg-dark-surface border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-white/50">No hay modulos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(module.id)
        const isModuleCompleted = module.isCompleted

        return (
          <div
            key={module.id}
            className={cx(
              'bg-dark-surface border border-white/10 rounded-2xl overflow-hidden transition-all duration-200',
              !module.isUnlocked && 'opacity-60'
            )}
          >
            {/* Header del módulo - clickeable */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Número del módulo */}
                <div
                  className={cx(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium flex-shrink-0',
                    isModuleCompleted
                      ? 'bg-success/20 text-success'
                      : 'bg-white/10 text-white'
                  )}
                >
                  {isModuleCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    moduleIndex + 1
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">
                    {module.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5">
                    <span>{module.progress.total} lecciones</span>
                    <span>·</span>
                    <span>{module.progress.completed}/{module.progress.total} completadas</span>
                  </div>
                </div>

                {/* Estado badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isModuleCompleted && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-1 text-[11px] text-success border border-success/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Completado
                    </span>
                  )}

                  {!module.isUnlocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/60 border border-white/20">
                      <Lock className="h-3 w-3" />
                      Bloqueado
                    </span>
                  )}

                  {/* Icono expand/collapse */}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-white/40" />
                  ) : (
                    <ChevronDown className="h-5 h-5 text-white/40" />
                  )}
                </div>
              </div>
            </button>

            {/* Barra de progreso */}
            {module.progress.percentage > 0 && (
              <div className="px-4 sm:px-5 pb-3">
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div
                    className="bg-success h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${module.progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mensaje de bloqueo */}
            {!module.isUnlocked && (
              <div className="px-4 sm:px-5 pb-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-white/60">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Completa el modulo anterior para desbloquear este contenido
                </div>
              </div>
            )}

            {/* Lista de lecciones */}
            {isExpanded && module.isUnlocked && (
              <div className="border-t border-white/10 divide-y divide-white/5">
                {module.lessons.map((lesson, lessonIndex) => {
                  const LessonIcon = lesson.isCompleted
                    ? CheckCircle
                    : lesson.isUnlocked
                    ? PlayCircle
                    : Lock

                  const iconColor = lesson.isCompleted
                    ? 'text-success'
                    : lesson.isUnlocked
                    ? 'text-brand-light'
                    : 'text-white/30'

                  if (lesson.isUnlocked) {
                    return (
                      <Link
                        key={lesson.id}
                        href={`/cursos/${courseSlug}/${lesson.slug}`}
                        className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-white/5 transition-colors"
                      >
                        <LessonIcon className={cx('h-5 w-5 flex-shrink-0', iconColor)} />
                        <span className="flex-1 text-sm text-white/80">
                          {lessonIndex + 1}. {lesson.title}
                        </span>
                        {lesson.video_duration_minutes && (
                          <span className="text-xs text-white/40 flex-shrink-0">
                            {lesson.video_duration_minutes} min
                          </span>
                        )}
                        {lesson.isCompleted && (
                          <span className="hidden sm:inline px-2 py-0.5 bg-success/20 text-success text-[10px] rounded border border-success/30">
                            Completada
                          </span>
                        )}
                        {lesson.is_free_preview && !lesson.isCompleted && (
                          <span className="px-2 py-0.5 bg-brand-light/20 text-brand-light text-[10px] rounded border border-brand-light/30">
                            Vista previa
                          </span>
                        )}
                      </Link>
                    )
                  } else {
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 px-4 sm:px-5 py-3 opacity-50 cursor-not-allowed"
                      >
                        <LessonIcon className={cx('h-5 w-5 flex-shrink-0', iconColor)} />
                        <span className="flex-1 text-sm text-white/50">
                          {lessonIndex + 1}. {lesson.title}
                        </span>
                        <span className="text-[10px] text-white/40">
                          Bloqueada
                        </span>
                      </div>
                    )
                  }
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
