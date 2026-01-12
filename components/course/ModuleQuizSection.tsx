'use client'

import Link from 'next/link'
import { Award, Lock, CheckCircle2, AlertCircle, TrendingUp, Download } from 'lucide-react'
import { motion } from 'framer-motion'

interface ModuleQuizSectionProps {
  courseSlug: string
  moduleSlug: string
  requiresQuiz: boolean
  allLessonsCompleted: boolean
  completedLessonsCount: number
  totalLessons: number
  quizStatus?: 'not_attempted' | 'attempted' | 'passed'
  bestScore?: number
  certificateId?: string
  certificateUrl?: string
  isPreviousModuleCompleted?: boolean
}

/**
 * ModuleQuizSection Component
 *
 * Muestra el estado del quiz de un módulo de manera visual y atractiva.
 * Se integra dentro de ModuleListEnhanced para mostrar información del quiz.
 */
export function ModuleQuizSection({
  courseSlug,
  moduleSlug,
  requiresQuiz,
  allLessonsCompleted,
  completedLessonsCount,
  totalLessons,
  quizStatus = 'not_attempted',
  bestScore,
  certificateId,
  certificateUrl,
  isPreviousModuleCompleted = true,
}: ModuleQuizSectionProps) {
  // Si el módulo no requiere quiz, no mostrar nada
  if (!requiresQuiz) {
    return null
  }

  // CASO 1: Módulo anterior no completado
  if (!isPreviousModuleCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-white/50/10 border border-white/30/30 rounded-lg"
      >
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white/80 mb-1">
              Quiz Bloqueado
            </h4>
            <p className="text-xs text-white/60">
              Completa el quiz del módulo anterior para desbloquear este módulo
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // CASO 2: Lecciones no completadas
  if (!allLessonsCompleted) {
    const progress = Math.round((completedLessonsCount / totalLessons) * 100)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-300 mb-1">
              Quiz Disponible Pronto
            </h4>
            <p className="text-xs text-blue-200 mb-3">
              Completa todas las lecciones para acceder al quiz final
            </p>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-300">Progreso del módulo</span>
                <span className="text-blue-300 font-semibold">{progress}%</span>
              </div>
              <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
              </div>
              <p className="text-xs text-blue-300">
                {completedLessonsCount} de {totalLessons} lecciones completadas
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // CASO 3: Quiz no intentado - LISTO PARA TOMAR
  if (quizStatus === 'not_attempted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-5 bg-gradient-to-br from-brand-light/20 via-brand/20 to-brand-light/20 border-2 border-brand-light/40 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h4 className="text-base font-bold text-white mb-1">
              ¡Listo para el Quiz Final! 🎯
            </h4>
            <p className="text-sm text-white/80 mb-4">
              Has completado todas las lecciones. ¡Demuestra lo que has aprendido!
            </p>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <CheckCircle2 className="w-4 h-4" />
                <span>70% para aprobar</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <Award className="w-4 h-4" />
                <span>Certificado incluido</span>
              </div>
            </div>

            <Link
              href={`/cursos/${courseSlug}/modulos/${moduleSlug}/quiz`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-brand-light/30 transition-all hover:scale-105"
            >
              <Award className="w-4 h-4" />
              Tomar Quiz Ahora
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  // CASO 4: Quiz intentado pero no aprobado
  if (quizStatus === 'attempted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-5 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h4 className="text-base font-bold text-white mb-1">
              ¡Sigue Intentando! 💪
            </h4>
            <p className="text-sm text-white/80 mb-3">
              Tu mejor puntuación: <span className="font-bold">{bestScore}%</span>
              {' '}- Necesitas 70% o más para aprobar
            </p>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                <span>Progreso hacia la aprobación</span>
                <span>{bestScore}%</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(bestScore || 0, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    (bestScore || 0) >= 70
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  }`}
                />
              </div>
            </div>

            <Link
              href={`/cursos/${courseSlug}/modulos/${moduleSlug}/quiz`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all hover:scale-105"
            >
              <TrendingUp className="w-4 h-4" />
              Reintentar Quiz
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  // CASO 5: Quiz aprobado - COMPLETADO ✅
  if (quizStatus === 'passed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-5 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-500/20 border-2 border-green-500/40 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-bold text-green-300">
                ¡Quiz Completado! 🎉
              </h4>
              <div className="px-2.5 py-0.5 bg-green-500/30 border border-green-500/50 rounded-full text-xs font-bold text-green-300">
                {bestScore}%
              </div>
            </div>

            <p className="text-sm text-green-200/90 mb-4">
              ¡Excelente trabajo! Has demostrado tu dominio del tema.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {certificateId && (
                <Link
                  href={`/certificados/${certificateId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  <Award className="w-4 h-4" />
                  Ver Certificado
                </Link>
              )}

              {certificateUrl && (
                <a
                  href={certificateUrl}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </a>
              )}

              <Link
                href={`/cursos/${courseSlug}/modulos/${moduleSlug}/quiz`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/70 text-sm font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-all"
              >
                Ver resultados
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return null
}

