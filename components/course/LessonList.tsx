'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Lock, CheckCircle, Circle, Clock } from 'lucide-react'
import { ProgressManager } from '@/lib/progress-manager'

interface Lesson {
  id: string
  slug: string
  title: string
  order_index: number
  video_duration_minutes: number
  is_free_preview: boolean
}

interface Module {
  id: string
  title: string
  description: string | null
  order_index: number
  lessons: Lesson[]
}

interface LessonListProps {
  courseSlug: string
  modules: Module[]
  isPremium: boolean
}

export function LessonList({ courseSlug, modules, isPremium }: LessonListProps) {
  const [isClient, setIsClient] = useState(false)
  const [progressState, setProgressState] = useState<Record<string, boolean>>({})

  // Memoizar las lecciones ordenadas para evitar re-creación en cada render
  const allLessons = useMemo(() => {
    return modules
      .flatMap(m => m.lessons)
      .sort((a, b) => a.order_index - b.order_index)
  }, [modules])

  // Función para cargar progreso (memoizada)
  const loadProgress = useCallback(() => {
    const updatedProgress: Record<string, boolean> = {}
    allLessons.forEach(lesson => {
      updatedProgress[lesson.slug] = ProgressManager.isLessonCompleted(courseSlug, lesson.slug)
    })
    setProgressState(updatedProgress)
  }, [courseSlug, allLessons])

  useEffect(() => {
    setIsClient(true)
    loadProgress()

    // Listener para actualizaciones
    window.addEventListener('lesson-completed', loadProgress)

    // También actualizar al hacer focus en la ventana (por si vienen de otra página)
    window.addEventListener('focus', loadProgress)

    return () => {
      window.removeEventListener('lesson-completed', loadProgress)
      window.removeEventListener('focus', loadProgress)
    }
  }, [loadProgress])

  // Memoizar módulos ordenados
  const sortedModules = useMemo(() =>
    [...modules].sort((a, b) => a.order_index - b.order_index)
  , [modules])

  return (
    <div className="space-y-4">
      {/* Solo para desarrollo - Botón para resetear progreso */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <button
            onClick={() => {
              if (confirm('¿Resetear progreso del curso?')) {
                ProgressManager.resetProgress()
                loadProgress()
                alert('Progreso reseteado')
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            🔄 Resetear Progreso (Dev)
          </button>
        </div>
      )}

      {sortedModules.map((module, moduleIndex) => (
          <div
            key={module.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Module Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-white/60 text-sm">{module.description}</p>
                  )}
                </div>
                <div className="text-sm text-white/50">
                  {module.lessons.length} lección{module.lessons.length !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="divide-y divide-white/5">
              {module.lessons
                .sort((a, b) => a.order_index - b.order_index)
                .map((lesson, lessonIndex) => {
                  // Durante SSR o antes de hidratar, mostrar todo como accesible para evitar discrepancias
                  if (!isClient) {
                    return (
                      <div
                        key={lesson.id}
                        className="block p-4 bg-white/0 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Lesson Number */}
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 text-sm font-medium">
                            {moduleIndex + 1}.{lessonIndex + 1}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              {lesson.video_duration_minutes > 0 && (
                                <p className="text-xs text-white/40 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.video_duration_minutes} min
                                </p>
                              )}
                              {lesson.is_free_preview && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#4caf50]/20 text-[#4caf50]">
                                  Vista previa
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Icon */}
                          <Circle className="w-5 h-5 text-white/30" />
                        </div>
                      </div>
                    )
                  }

                  // Una vez en el cliente, usar la lógica real
                  const isCompleted = progressState[lesson.slug] || false
                  const canAccess = ProgressManager.canAccessLesson(
                    courseSlug,
                    lesson.slug,
                    allLessons
                  )
                  const isLocked = !canAccess

                  if (isLocked) {
                    return (
                      <div
                        key={lesson.id}
                        className="block p-4 bg-white/0 hover:bg-white/5 transition-colors cursor-not-allowed"
                      >
                        <div className="flex items-center gap-4 opacity-50">
                          {/* Lesson Number */}
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm font-medium">
                            {moduleIndex + 1}.{lessonIndex + 1}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1">
                            <h4 className="text-white/50 font-medium">
                              {lesson.title}
                            </h4>
                            {lesson.video_duration_minutes > 0 && (
                              <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.video_duration_minutes} min
                              </p>
                            )}
                          </div>

                          {/* Lock Icon */}
                          <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-white/30" />
                            <span className="text-sm text-white/30">Bloqueada</span>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={`/cursos/${courseSlug}/${lesson.slug}`}
                      className="block p-4 bg-white/0 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Lesson Number */}
                        <div className={`w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-medium transition-colors ${
                          isCompleted
                            ? 'border-green-500 text-green-500'
                            : 'text-white/50 group-hover:border-[#ff6b35] group-hover:text-[#ff6b35]'
                        }`}>
                          {moduleIndex + 1}.{lessonIndex + 1}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1">
                          <h4 className={`font-medium transition-colors ${
                            isCompleted
                              ? 'text-white/90'
                              : 'text-white group-hover:text-[#ff6b35]'
                          }`}>
                            {lesson.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            {lesson.video_duration_minutes > 0 && (
                              <p className="text-xs text-white/40 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.video_duration_minutes} min
                              </p>
                            )}
                            {lesson.is_free_preview && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#4caf50]/20 text-[#4caf50]">
                                Vista previa
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Icon */}
                        {isCompleted ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-500 font-medium">Completada</span>
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-white/30 group-hover:text-[#ff6b35] transition-colors" />
                        )}
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}
    </div>
  )
}
