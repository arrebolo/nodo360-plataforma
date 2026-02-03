'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'

type RouteCardProps = {
  id: string
  name: string
  slug: string
  emoji?: string
  subtitle?: string
  shortDescription?: string
  educationalHint?: string
  courseCount: number
  totalLessons: number
  isActive: boolean
  isLoggedIn: boolean
  isRecommended?: boolean
  onDetails?: () => void
  onSelect?: () => void
}

export function RouteCard({
  id,
  name,
  slug,
  emoji,
  subtitle,
  shortDescription,
  educationalHint,
  courseCount,
  totalLessons,
  isActive,
  isLoggedIn,
  isRecommended = false,
  onDetails,
  onSelect,
}: RouteCardProps) {
  const isComingSoon = (courseCount ?? 0) === 0

  const metaText = isComingSoon
    ? 'Próximamente'
    : `${courseCount} ${courseCount === 1 ? 'curso' : 'cursos'}${totalLessons ? ` · ${totalLessons} lecciones` : ''}`

  const viewButtonText = isActive ? 'Ver progreso' : 'Ver contenido'

  // Determinar estilos según estado
  const cardClasses = isRecommended && !isActive
    ? 'bg-brand/5 border-2 border-brand/30 shadow-lg shadow-brand/10'
    : isActive
    ? 'bg-success/5 border-2 border-success/30'
    : 'bg-dark-surface border border-white/10 hover:border-white/20'

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl p-6 h-full flex flex-col min-h-[260px]
        transition-all duration-150 hover:-translate-y-0.5
        ${cardClasses}
      `}
    >
      {/* Badge de estado - posición absoluta DENTRO de la card */}
      {isRecommended && !isActive && (
        <span className="absolute top-3 left-4 px-3 py-1 bg-brand text-white text-xs font-medium rounded-full z-10">
          Recomendada
        </span>
      )}

      {isActive && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-success/20 px-2.5 py-1 text-xs font-medium text-success border border-success/30">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Activa
        </span>
      )}

      {/* Header con emoji y título */}
      <div className={`flex items-start gap-4 ${isRecommended && !isActive ? 'mt-8' : 'mt-2'}`}>
        {/* Icon container */}
        <div
          className={`
            flex h-12 w-12 items-center justify-center rounded-xl text-2xl flex-shrink-0
            ${isRecommended && !isActive ? 'bg-brand/20' : isActive ? 'bg-success/20' : 'bg-white/10'}
          `}
        >
          {emoji || '📚'}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-white leading-snug line-clamp-2">
            {name}
          </h3>
          {subtitle && (
            <p className="text-sm text-white/80 mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
          <p className="text-sm text-white/60 mt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${isComingSoon ? 'bg-white/40' : 'bg-brand-light'}`} />
              {metaText}
            </span>
          </p>
        </div>
      </div>

      {/* Educational hint */}
      {educationalHint && !isComingSoon && (
        <div className="mt-4">
          <span className="inline-block px-3 py-1.5 bg-white/5 text-white/70 text-xs rounded-lg border border-white/10">
            {educationalHint}
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-sm leading-relaxed text-white/70 mt-4 flex-1 line-clamp-3">
        {shortDescription || 'Ruta de aprendizaje personalizada'}
      </p>

      {/* Footer con botones */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
        {!isComingSoon && (
          <Button
            variant="soft"
            onClick={onDetails}
            type="button"
          >
            {viewButtonText}
          </Button>
        )}

        {isComingSoon ? (
          <Button variant="secondary" disabled type="button" className="ml-auto">
            Próximamente
          </Button>
        ) : isActive ? (
          <Button variant="primary" onClick={onSelect} type="button" className="ml-auto">
            Continuar <span aria-hidden className="ml-1 text-white/80">→</span>
          </Button>
        ) : isLoggedIn ? (
          <Button variant="primary" onClick={onSelect} type="button" className="ml-auto">
            Elegir ruta <span aria-hidden className="ml-1 text-white/80">→</span>
          </Button>
        ) : (
          <Button variant="secondary" onClick={onDetails} type="button" className="ml-auto">
            Ver más
          </Button>
        )}
      </div>
    </div>
  )
}
