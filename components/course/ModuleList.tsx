'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight, Lock, CheckCircle, Circle, PlayCircle } from 'lucide-react'
import { useState } from 'react'
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
      <div className="text-center text-gray-400 py-12">
        No hay módulos disponibles
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(module.id)

        return (
          <div
            key={module.id}
            className={`
              bg-white/5 backdrop-blur-lg border rounded-xl overflow-hidden
              transition-all duration-300
              ${module.isUnlocked
                ? 'border-white/10 hover:border-[#ff6b35]/50'
                : 'border-white/5 opacity-60'
              }
            `}
          >
            {/* Header del módulo */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                {/* Número */}
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff6b35]/20 text-[#ff6b35] font-bold">
                  {moduleIndex + 1}
                </span>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-gray-400 text-sm mb-2">
                      {module.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      {module.progress.total} lecciones
                    </span>
                    <span>•</span>
                    <span>
                      {module.progress.percentage}% completado
                    </span>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-3">
                  {module.isCompleted && (
                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-500 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Completado
                    </span>
                  )}

                  {!module.isUnlocked && (
                    <span className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-full text-gray-400 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Bloqueado
                    </span>
                  )}

                  {module.isUnlocked && !module.isCompleted && (
                    <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-sm">
                      Desbloqueado
                    </span>
                  )}

                  {/* Icono expand/collapse */}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Barra de progreso */}
            {module.progress.percentage > 0 && (
              <div className="px-6 pb-4">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${module.progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mensaje de bloqueo */}
            {!module.isUnlocked && (
              <div className="px-6 pb-6">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Completa el módulo anterior para desbloquear este contenido
                </div>
              </div>
            )}

            {/* Lista de lecciones */}
            {isExpanded && (
              <div className="px-6 pb-6">
                <ul className="space-y-2">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const LessonIcon = lesson.isCompleted
                      ? CheckCircle
                      : lesson.isUnlocked
                      ? PlayCircle
                      : Lock

                    const iconColor = lesson.isCompleted
                      ? 'text-green-500'
                      : lesson.isUnlocked
                      ? 'text-blue-400'
                      : 'text-gray-500'

                    if (lesson.isUnlocked) {
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={`/cursos/${courseSlug}/${lesson.slug}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition group"
                          >
                            <LessonIcon className={`w-5 h-5 ${iconColor}`} />
                            <span className="text-gray-300 group-hover:text-white flex-1">
                              {lessonIndex + 1}. {lesson.title}
                            </span>
                            {lesson.video_duration_minutes && (
                              <span className="text-xs text-gray-500">
                                {lesson.video_duration_minutes} min
                              </span>
                            )}
                            {lesson.isCompleted && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded">
                                Completada
                              </span>
                            )}
                            {lesson.is_free_preview && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                Vista previa
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    } else {
                      return (
                        <li key={lesson.id}>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 opacity-50 cursor-not-allowed">
                            <LessonIcon className={`w-5 h-5 ${iconColor}`} />
                            <span className="text-gray-500 flex-1">
                              {lessonIndex + 1}. {lesson.title}
                            </span>
                            <span className="text-xs text-gray-600">
                              Bloqueada
                            </span>
                          </div>
                        </li>
                      )
                    }
                  })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
