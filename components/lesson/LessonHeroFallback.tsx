'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpen, FileText, ExternalLink, Clock } from 'lucide-react'

type Props = {
  title: string
  description?: string | null
  hasSlides?: boolean
  hasPdf?: boolean
  hasExternalResources?: boolean
  estimatedMinutes?: number
  onOpenSlides?: () => void
  onOpenResources?: () => void
}

/**
 * LessonHeroFallback - Placeholder compacto para lecciones sin video
 * Altura reducida para mostrar mas contenido sin scroll
 */
export function LessonHeroFallback({
  title,
  description,
  hasSlides,
  hasPdf,
  hasExternalResources,
  estimatedMinutes,
  onOpenSlides,
  onOpenResources,
}: Props) {
  const hasAnyResource = !!hasSlides || !!hasPdf || !!hasExternalResources
  // Estimacion por defecto: 3-5 min para lecturas cortas
  const readingTime = estimatedMinutes || 5

  return (
    <Card className="py-6 px-4 sm:py-8 sm:px-6 flex items-center justify-center bg-gradient-to-br from-orange-50 via-neutral-50 to-emerald-50">
      <div className="text-center max-w-lg">
        {/* Icono mas compacto */}
        <div className="mx-auto w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
          <BookOpen className="h-7 w-7 text-orange-600" />
        </div>

        {/* Titulo */}
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1">
          {title}
        </h2>

        {/* Badge con tipo y duracion */}
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 mb-4">
          <BookOpen className="h-4 w-4" />
          <span>Lectura</span>
          <span className="text-neutral-300">·</span>
          <Clock className="h-4 w-4" />
          <span>{readingTime} min</span>
        </div>

        {/* Descripcion breve */}
        {description && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* CTAs compactos */}
        <div className="flex flex-wrap justify-center gap-2">
          {hasSlides && onOpenSlides && (
            <Button variant="primary" size="sm" onClick={onOpenSlides}>
              <FileText className="h-4 w-4" />
              Ver slides
            </Button>
          )}

          {hasAnyResource && onOpenResources && (
            <Button variant="soft" size="sm" onClick={onOpenResources}>
              <ExternalLink className="h-4 w-4" />
              Recursos
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default LessonHeroFallback


