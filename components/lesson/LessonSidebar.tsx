// components/lesson/LessonSidebar.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

// ============================================
// TIPOS
// ============================================

export type LessonStatus = 'completed' | 'current' | 'pending' | 'locked'
export type ModuleStatus = 'completed' | 'progress' | 'locked'

export interface SidebarLesson {
  id: string
  slug: string
  title: string
  status: LessonStatus
  duration?: number | null
}

export interface SidebarModule {
  id: string
  title: string
  status: ModuleStatus
  lessons: SidebarLesson[]
}

export interface LessonSidebarProps {
  courseSlug: string
  courseTitle: string
  modules: SidebarModule[]
  currentLessonSlug: string
  progress: number // 0-1
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function LessonSidebar({
  courseSlug,
  courseTitle,
  modules,
  currentLessonSlug,
  progress,
}: LessonSidebarProps) {
  // Estado para expandir/colapsar modulos
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Por defecto expandir el modulo actual
    const initial = new Set<string>()
    for (const mod of modules) {
      if (mod.lessons.some((l) => l.slug === currentLessonSlug)) {
        initial.add(mod.id)
      }
    }
    return initial
  })

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

  // Calcular totales
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.status === 'completed').length,
    0
  )

  return (
    <aside className="bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.1)] rounded-[18px] shadow-[0_16px_40px_rgba(0,0,0,0.4)] overflow-hidden h-fit sticky top-4">
      {/* Header del sidebar */}
      <div className="p-5 border-b border-[rgba(250,244,237,0.1)]">
        <Link
          href={`/cursos/${courseSlug}`}
          className="block hover:opacity-80 transition"
        >
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-[rgba(250,244,237,0.6)] mb-2">
            Curso
          </h2>
          <div className="text-[16px] font-bold text-[#FAF4ED] hover:text-[#F7931A] transition line-clamp-2">
            {courseTitle}
          </div>
        </Link>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#D7D3CE]">Progreso</span>
            <span className="text-[#F7931A] font-medium">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[#2C2A28] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] rounded-full transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-[#6F665C] mt-1">
            {completedLessons} de {totalLessons} lecciones completadas
          </div>
        </div>
      </div>

      {/* Lista de modulos */}
      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A3835] scrollbar-track-transparent">
        {modules.map((mod, modIndex) => {
          const isExpanded = expandedModules.has(mod.id)
          const isCurrentModule = mod.lessons.some(
            (l) => l.slug === currentLessonSlug
          )

          return (
            <div
              key={mod.id}
              className={`border-b border-[rgba(250,244,237,0.06)] last:border-b-0 ${
                isCurrentModule ? 'bg-[rgba(247,147,26,0.04)]' : ''
              }`}
            >
              {/* Header del modulo */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[rgba(250,244,237,0.03)] transition"
              >
                {/* Indicador de estado del modulo */}
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    mod.status === 'completed'
                      ? 'bg-[#4CAF7A]/20 text-[#4CAF7A] border border-[#4CAF7A]/40'
                      : mod.status === 'progress'
                        ? 'bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/40'
                        : 'bg-[#2C2A28] text-[#6F665C] border border-[rgba(250,244,237,0.15)]'
                  }`}
                >
                  {mod.status === 'completed' ? (
                    <span>✓</span>
                  ) : (
                    <span>{modIndex + 1}</span>
                  )}
                </div>

                {/* Titulo del modulo */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[13px] font-medium truncate ${
                      mod.status === 'locked'
                        ? 'text-[#6F665C]'
                        : 'text-[#FAF4ED]'
                    }`}
                  >
                    {mod.title}
                  </div>
                  <div className="text-[10px] text-[#6F665C]">
                    {mod.lessons.filter((l) => l.status === 'completed').length}/
                    {mod.lessons.length} lecciones
                  </div>
                </div>

                {/* Icono expandir */}
                <span
                  className={`text-[#6F665C] transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Lista de lecciones (expandible) */}
              {isExpanded && (
                <div className="pb-2">
                  {mod.lessons.map((lesson, lessonIndex) => {
                    const isCurrent = lesson.slug === currentLessonSlug
                    const isLocked = lesson.status === 'locked'

                    return (
                      <Link
                        key={lesson.id}
                        href={
                          isLocked ? '#' : `/cursos/${courseSlug}/${lesson.slug}`
                        }
                        className={`flex items-center gap-3 px-5 py-2 pl-14 transition ${
                          isCurrent
                            ? 'bg-[rgba(247,147,26,0.12)] border-l-2 border-[#F7931A]'
                            : isLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-[rgba(250,244,237,0.03)]'
                        }`}
                        onClick={(e) => {
                          if (isLocked) e.preventDefault()
                        }}
                      >
                        {/* Indicador de estado */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
                            lesson.status === 'completed'
                              ? 'bg-[#4CAF7A]/20 text-[#4CAF7A]'
                              : isCurrent
                                ? 'bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/50'
                                : isLocked
                                  ? 'bg-[#2C2A28] text-[#6F665C]'
                                  : 'bg-[#2C2A28] text-[#D7D3CE] border border-[rgba(250,244,237,0.15)]'
                          }`}
                        >
                          {lesson.status === 'completed' ? (
                            '✓'
                          ) : isLocked ? (
                            '🔒'
                          ) : (
                            lessonIndex + 1
                          )}
                        </div>

                        {/* Titulo de la leccion */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-[12px] truncate ${
                              isCurrent
                                ? 'text-[#F7931A] font-medium'
                                : isLocked
                                  ? 'text-[#6F665C]'
                                  : 'text-[#D7D3CE]'
                            }`}
                          >
                            {lesson.title}
                          </div>
                          {lesson.duration && (
                            <div className="text-[9px] text-[#6F665C]">
                              {lesson.duration} min
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer con enlace al curso */}
      <div className="p-4 border-t border-[rgba(250,244,237,0.1)] bg-[rgba(44,42,40,0.5)]">
        <Link
          href={`/cursos/${courseSlug}`}
          className="flex items-center justify-center gap-2 text-[12px] text-[#5A9FD4] hover:text-[#7AB8E8] transition"
        >
          <span>📚</span>
          <span>Ver todos los modulos</span>
        </Link>
      </div>
    </aside>
  )
}
