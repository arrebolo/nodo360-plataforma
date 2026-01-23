'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { BookOpen, Layers, Route } from 'lucide-react'

type LearningPathInfo = {
  id: string
  name: string
  slug: string
  emoji: string | null
}

type CourseCardProps = {
  id: string
  title: string
  slug: string
  description?: string
  thumbnailUrl?: string
  modulesCount?: number
  lessonsCount?: number
  isEnrolled?: boolean
  isCompleted?: boolean
  progressPercent?: number
  isComingSoon?: boolean
  learningPath?: LearningPathInfo | null
  onStart?: () => void
  onContinue?: () => void
  onView?: () => void
}

export function CourseCard({
  id,
  title,
  slug,
  description,
  thumbnailUrl,
  modulesCount = 0,
  lessonsCount = 0,
  isEnrolled = false,
  isCompleted = false,
  progressPercent = 0,
  isComingSoon = false,
  learningPath,
  onStart,
  onContinue,
  onView,
}: CourseCardProps) {
  const isInProgress = isEnrolled && !isCompleted && progressPercent > 0

  const metaText = isComingSoon
    ? 'Próximamente'
    : `${modulesCount} ${modulesCount === 1 ? 'módulo' : 'módulos'} · ${lessonsCount} ${lessonsCount === 1 ? 'lección' : 'lecciones'}`

  const primaryCTAText = isCompleted
    ? 'Repasar'
    : isInProgress
    ? 'Continuar curso'
    : 'Empezar curso'

  const handlePrimaryCTA = isInProgress || isCompleted ? onContinue : onStart

  const secondaryCTAText = isEnrolled ? 'Ver progreso' : 'Ver contenido'

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl p-6 h-full flex flex-col min-h-[260px]
        bg-dark-surface border border-white/10
        transition-all duration-150 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg
      `}
    >
      {/* Línea de acento superior - con significado semántico */}
      <div
        className={`
          absolute inset-x-0 top-0 h-1
          ${isCompleted ? 'bg-success' : isInProgress ? 'bg-brand-light' : isComingSoon ? 'bg-white/20' : 'bg-white/30'}
        `}
      />

      {/* Badge de ruta de aprendizaje */}
      {learningPath && (
        <Link
          href={`/rutas/${learningPath.slug}`}
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-400 z-10 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {learningPath.emoji ? (
            <span>{learningPath.emoji}</span>
          ) : (
            <Route className="h-3 w-3" />
          )}
          <span className="max-w-[120px] truncate">{learningPath.name}</span>
        </Link>
      )}

      {/* Badge de estado */}
      {isCompleted && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-success/20 px-2.5 py-1 text-xs font-medium text-success z-10 border border-success/30">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Completado
        </span>
      )}
      {isInProgress && !isCompleted && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-2.5 py-1 text-xs font-medium text-brand-light z-10 border border-brand/30">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
          En progreso · {progressPercent}%
        </span>
      )}
      {isComingSoon && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/60 z-10 border border-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          Próximamente
        </span>
      )}

      <div className="pt-4">
        <h3 className="text-xl font-semibold leading-snug text-white line-clamp-2">
          {title}
        </h3>
      </div>

      <div className="flex-1 pt-3">
        {description && (
          <p className="text-sm leading-relaxed text-white/60 line-clamp-3">
            {description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 text-xs text-white/50">
          {!isComingSoon && (
            <>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {modulesCount} {modulesCount === 1 ? 'módulo' : 'módulos'}
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {lessonsCount} {lessonsCount === 1 ? 'lección' : 'lecciones'}
              </span>
            </>
          )}
          {isComingSoon && (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              {metaText}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
        {/* CTA secundario */}
        {!isComingSoon && (
          <Button variant="soft" onClick={onView} type="button">
            {secondaryCTAText}
          </Button>
        )}

        {/* CTA principal */}
        {isComingSoon ? (
          <Button variant="secondary" disabled type="button" className="ml-auto">
            Próximamente
          </Button>
        ) : (
          <Button variant="primary" onClick={handlePrimaryCTA} type="button" className="ml-auto">
            {primaryCTAText}
            <span aria-hidden className="ml-1 text-white/80">→</span>
          </Button>
        )}
      </div>
    </div>
  )
}
