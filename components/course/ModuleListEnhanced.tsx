'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Lock, CheckCircle, Circle, Clock, BookOpen } from 'lucide-react'
import { ProgressManager } from '@/lib/progress-manager'
import { ModuleStatusBadge, type ModuleStatus } from './ModuleStatusBadge'
import { ModuleQuizSection } from './ModuleQuizSection'
import { motion, AnimatePresence } from 'framer-motion'
import { getBestQuizAttempt, hasPassedModuleQuiz } from '@/lib/quiz/validateQuizAttempt'

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
  slug: string
  title: string
  description: string | null
  order_index: number
  requires_quiz: boolean
  lessons: Lesson[]
}

interface ModuleListEnhancedProps {
  courseSlug: string
  modules: Module[]
  isPremium: boolean
  userId?: string
}

/**
 * ModuleListEnhanced Component
 *
 * Versión mejorada del LessonList con:
 * - Visualización de estado de módulos (badges)
 * - Integración completa de quiz
 * - Indicadores de progreso
 * - Certificados
 * - Animaciones suaves
 * - UI profesional
 */
export function ModuleListEnhanced({
  courseSlug,
  modules,
  isPremium,
  userId
}: ModuleListEnhancedProps) {
  const [isClient, setIsClient] = useState(false)
  const [progressState, setProgressState] = useState<Record<string, boolean>>({})
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [quizData, setQuizData] = useState<Record<string, {
    status: 'not_attempted' | 'attempted' | 'passed'
    bestScore?: number
    certificateId?: string
    certificateUrl?: string
  }>>({})

  // Memoizar lecciones para evitar recálculos
  const allLessons = useMemo(() => {
    return modules
      .flatMap(m => m.lessons)
      .sort((a, b) => a.order_index - b.order_index)
  }, [modules])

  // Función para cargar progreso
  const loadProgress = useCallback(() => {
    const updatedProgress: Record<string, boolean> = {}
    allLessons.forEach(lesson => {
      updatedProgress[lesson.slug] = ProgressManager.isLessonCompleted(courseSlug, lesson.slug)
    })
    setProgressState(updatedProgress)
  }, [courseSlug, allLessons])

  // Función para cargar datos de quiz desde Supabase
  const loadQuizData = useCallback(async () => {
    if (!userId) return

    const updatedQuizData: Record<string, {
      status: 'not_attempted' | 'attempted' | 'passed'
      bestScore?: number
      certificateId?: string
      certificateUrl?: string
    }> = {}

    for (const module of modules) {
      if (!module.requires_quiz) continue

      try {
        // Verificar si el usuario aprobó el quiz
        const passed = await hasPassedModuleQuiz(userId, module.id)

        if (passed) {
          // Si aprobó, obtener el mejor intento
          const bestAttempt = await getBestQuizAttempt(userId, module.id)
          updatedQuizData[module.id] = {
            status: 'passed',
            bestScore: bestAttempt?.score || 100,
            // TODO: Implementar lógica de certificados
            certificateId: undefined,
            certificateUrl: undefined,
          }
        } else {
          // Si no aprobó, verificar si tiene intentos
          const bestAttempt = await getBestQuizAttempt(userId, module.id)
          if (bestAttempt) {
            updatedQuizData[module.id] = {
              status: 'attempted',
              bestScore: bestAttempt.score,
            }
          } else {
            updatedQuizData[module.id] = {
              status: 'not_attempted',
            }
          }
        }
      } catch (error) {
        console.error(`Error loading quiz data for module ${module.id}:`, error)
        updatedQuizData[module.id] = {
          status: 'not_attempted',
        }
      }
    }

    setQuizData(updatedQuizData)
  }, [userId, modules])

  useEffect(() => {
    setIsClient(true)
    loadProgress()
    loadQuizData() // Cargar datos de quiz desde Supabase

    // Expandir primer módulo por defecto
    if (modules.length > 0) {
      setExpandedModules(new Set([modules[0].id]))
    }

    // Listeners
    window.addEventListener('lesson-completed', loadProgress)
    window.addEventListener('focus', loadProgress)

    // También recargar quiz data cuando se complete una lección o haga focus
    window.addEventListener('lesson-completed', loadQuizData)
    window.addEventListener('focus', loadQuizData)

    return () => {
      window.removeEventListener('lesson-completed', loadProgress)
      window.removeEventListener('focus', loadProgress)
      window.removeEventListener('lesson-completed', loadQuizData)
      window.removeEventListener('focus', loadQuizData)
    }
  }, [loadProgress, loadQuizData, modules])

  // Ordenar módulos
  const sortedModules = useMemo(() =>
    [...modules].sort((a, b) => a.order_index - b.order_index)
  , [modules])

  // Toggle módulo expandido/colapsado
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

  // Calcular estado del módulo
  const getModuleStatus = (module: Module, moduleIndex: number): ModuleStatus => {
    const moduleLessons = module.lessons || []
    const completedCount = moduleLessons.filter(lesson =>
      progressState[lesson.slug]
    ).length
    const allLessonsCompleted = completedCount === moduleLessons.length && moduleLessons.length > 0

    // Módulo 1: Siempre desbloqueado
    if (module.order_index === 1) {
      // Verificar estado de completado
      if (module.requires_quiz && allLessonsCompleted) {
        // Verificar si quiz fue aprobado
        const quizStatus = quizData[module.id]?.status
        if (quizStatus === 'passed') {
          return 'completed'
        }
        return 'in_progress' // Lecciones completadas, falta aprobar quiz
      }
      if (allLessonsCompleted && !module.requires_quiz) {
        return 'completed'
      }
      if (completedCount > 0) {
        return 'in_progress'
      }
      return 'unlocked'
    }

    // Para cursos GRATUITOS: Módulos 2+ bloqueados hasta completar anterior
    // NOTA: Todos los cursos actuales son gratuitos, no hay modelo premium todavía
    if (!isPremium) {
      return 'locked' // Bloqueado hasta completar quiz del módulo anterior
    }

    // Para cursos PREMIUM: Verificar módulo anterior
    const previousModule = sortedModules[moduleIndex - 1]
    if (!previousModule) {
      // Si no hay módulo anterior, desbloquear (caso edge)
      return 'unlocked'
    }

    const prevModuleLessons = previousModule.lessons || []
    const prevCompletedCount = prevModuleLessons.filter(lesson =>
      progressState[lesson.slug]
    ).length
    const prevAllLessonsCompleted = prevCompletedCount === prevModuleLessons.length && prevModuleLessons.length > 0

    // Si módulo anterior requiere quiz
    if (previousModule.requires_quiz) {
      // Verificar si al menos completó todas las lecciones del módulo anterior
      if (!prevAllLessonsCompleted) {
        return 'locked'
      }
      // Verificar si quiz del módulo anterior fue aprobado
      const prevQuizStatus = quizData[previousModule.id]?.status
      if (prevQuizStatus !== 'passed') {
        return 'locked' // Bloqueado hasta aprobar quiz del módulo anterior
      }
      // Módulo anterior completado correctamente
    }

    // Si módulo anterior NO requiere quiz, solo verificar lecciones
    if (!prevAllLessonsCompleted) {
      return 'locked'
    }

    // Módulo anterior completado, este módulo está desbloqueado
    // Ahora verificar estado de este módulo
    if (module.requires_quiz && allLessonsCompleted) {
      // Verificar si quiz fue aprobado
      const currentQuizStatus = quizData[module.id]?.status
      if (currentQuizStatus === 'passed') {
        return 'completed'
      }
      return 'in_progress' // Lecciones completadas, falta aprobar quiz
    }
    if (allLessonsCompleted && !module.requires_quiz) {
      return 'completed'
    }
    if (completedCount > 0) {
      return 'in_progress'
    }
    return 'unlocked'
  }

  return (
    <div className="space-y-6">
      {/* Módulos */}
      {sortedModules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(module.id)
        const sortedLessons = [...(module.lessons || [])].sort(
          (a, b) => a.order_index - b.order_index
        )

        // Calcular progreso del módulo
        const completedLessonsCount = sortedLessons.filter(lesson =>
          progressState[lesson.slug]
        ).length
        const totalLessons = sortedLessons.length
        const progressPercentage = totalLessons > 0
          ? Math.round((completedLessonsCount / totalLessons) * 100)
          : 0
        const allLessonsCompleted = completedLessonsCount === totalLessons && totalLessons > 0

        // Estado del módulo
        const moduleStatus = getModuleStatus(module, moduleIndex)

        // Determinar si módulo anterior está completado
        const isPreviousModuleCompleted = moduleIndex === 0 ||
          getModuleStatus(sortedModules[moduleIndex - 1], moduleIndex - 1) === 'completed'

        return (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: moduleIndex * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full p-6 flex items-start gap-4 hover:bg-white/5 transition-colors text-left"
              aria-expanded={isExpanded}
            >
              {/* Expand Icon */}
              <div className="mt-1">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-white/70" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white/70" />
                )}
              </div>

              {/* Module Number */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                moduleStatus === 'completed'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                  : moduleStatus === 'in_progress'
                  ? 'bg-gradient-to-br from-[#ff6b35] to-[#f7931a]'
                  : 'bg-white/10 border border-white/20'
              }`}>
                {moduleStatus === 'completed' ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {moduleIndex + 1}
                  </span>
                )}
              </div>

              {/* Module Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xl font-bold text-white">
                    {module.title}
                  </h3>

                  {/* Status Badge */}
                  <ModuleStatusBadge
                    status={moduleStatus}
                    completedLessons={completedLessonsCount}
                    totalLessons={totalLessons}
                    isCompact
                  />
                </div>

                {module.description && (
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">
                    {module.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>{totalLessons} lección{totalLessons !== 1 ? 'es' : ''}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>{progressPercentage}% completado</span>
                  </div>

                  {module.requires_quiz && (
                    <div className="flex items-center gap-1.5 text-[#ff6b35]">
                      <span className="text-lg">📝</span>
                      <span>Quiz final</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {progressPercentage > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          moduleStatus === 'completed'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a]'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </button>

            {/* Module Content - Expandable */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10"
                >
                  <div className="p-6 pt-4">
                    {/* Lessons List */}
                    <div className="space-y-2 mb-4">
                      {sortedLessons.map((lesson, lessonIndex) => {
                        const isCompleted = isClient && progressState[lesson.slug]
                        const canAccess = isClient && ProgressManager.canAccessLesson(
                          courseSlug,
                          lesson.slug,
                          allLessons
                        )
                        const isLocked = !canAccess

                        if (isLocked) {
                          return (
                            <div
                              key={lesson.id}
                              className="p-4 rounded-lg bg-white/5 border border-white/10 opacity-50"
                            >
                              <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-white/30" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white/50">
                                    {lessonIndex + 1}. {lesson.title}
                                  </div>
                                </div>
                                <span className="text-xs text-white/30">Bloqueada</span>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <Link
                            key={lesson.id}
                            href={`/cursos/${courseSlug}/modulos/${module.slug}/lecciones/${lesson.slug}`}
                            className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Status Icon */}
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-white/30 group-hover:text-[#ff6b35] transition" />
                              )}

                              {/* Lesson Info */}
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${
                                  isCompleted
                                    ? 'text-white/90'
                                    : 'text-white group-hover:text-[#ff6b35] transition'
                                }`}>
                                  {lessonIndex + 1}. {lesson.title}
                                </div>
                              </div>

                              {/* Duration */}
                              {lesson.video_duration_minutes > 0 && (
                                <div className="flex items-center gap-1 text-xs text-white/40">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{lesson.video_duration_minutes} min</span>
                                </div>
                              )}

                              {/* Status Label */}
                              {isCompleted && (
                                <span className="text-xs text-green-400 font-medium">
                                  Completada
                                </span>
                              )}

                              {lesson.is_free_preview && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#4caf50]/20 text-[#4caf50]">
                                  Vista previa
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Quiz Section */}
                    <ModuleQuizSection
                      courseSlug={courseSlug}
                      moduleSlug={module.slug}
                      requiresQuiz={module.requires_quiz}
                      allLessonsCompleted={allLessonsCompleted}
                      completedLessonsCount={completedLessonsCount}
                      totalLessons={totalLessons}
                      quizStatus={quizData[module.id]?.status || 'not_attempted'}
                      bestScore={quizData[module.id]?.bestScore}
                      certificateId={quizData[module.id]?.certificateId}
                      certificateUrl={quizData[module.id]?.certificateUrl}
                      isPreviousModuleCompleted={isPreviousModuleCompleted}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
