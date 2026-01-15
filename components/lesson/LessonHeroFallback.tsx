'use client'

import { Button } from '@/components/ui/Button'
import { FileText, ExternalLink, Clock, BookOpen } from 'lucide-react'

type Props = {
  title?: string  // Ya no se usa, pero mantenemos para compatibilidad
  description?: string | null  // Ya no se usa
  hasSlides?: boolean
  hasPdf?: boolean
  hasExternalResources?: boolean
  estimatedMinutes?: number
  onOpenSlides?: () => void
  onOpenResources?: () => void
}

/**
 * LessonHeroFallback - Barra compacta para lecciones sin video
 * Solo muestra tipo de contenido, duracion y accesos rapidos
 */
export function LessonHeroFallback({
  hasSlides,
  hasPdf,
  hasExternalResources,
  estimatedMinutes,
  onOpenSlides,
  onOpenResources,
}: Props) {
  const hasAnyResource = !!hasSlides || !!hasPdf || !!hasExternalResources
  const readingTime = estimatedMinutes || 5

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 bg-dark-secondary border border-dark-border rounded-xl">
      {/* Left: Type and duration */}
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand/10 text-brand rounded-lg font-medium">
          <BookOpen className="h-4 w-4" />
          Lectura
        </span>
        <span className="flex items-center gap-1.5 text-white/50">
          <Clock className="h-4 w-4" />
          {readingTime} min
        </span>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2">
        {hasSlides && onOpenSlides && (
          <Button variant="soft" size="sm" onClick={onOpenSlides}>
            <FileText className="h-4 w-4" />
            Slides
          </Button>
        )}

        {hasAnyResource && onOpenResources && !hasSlides && (
          <Button variant="soft" size="sm" onClick={onOpenResources}>
            <ExternalLink className="h-4 w-4" />
            Recursos
          </Button>
        )}
      </div>
    </div>
  )
}

export default LessonHeroFallback


