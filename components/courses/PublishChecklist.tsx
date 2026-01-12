'use client'

import { useMemo } from 'react'
import Button from '@/components/ui/Button'

// Tipos
interface CourseData {
  title: string
  slug: string
  description: string
  long_description?: string | null
  thumbnail_url?: string | null
  banner_url?: string | null
  level: string
  status: string
  is_free: boolean
  is_premium?: boolean
}

interface CourseStats {
  modulesCount: number
  lessonsCount: number
  totalDurationMinutes: number
}

interface ChecklistItem {
  id: string
  label: string
  description: string
  check: (course: CourseData, stats: CourseStats) => boolean
  required: boolean
  category: 'info' | 'content' | 'media'
}

interface PublishChecklistProps {
  course: CourseData
  stats: CourseStats
  onPublish?: () => void
  isPublishing?: boolean
  className?: string
}

// Definicion de items del checklist
const checklistItems: ChecklistItem[] = [
  // Informacion basica
  {
    id: 'title',
    label: 'Titulo del curso',
    description: 'Minimo 10 caracteres',
    check: (c) => (c.title?.length ?? 0) >= 10,
    required: true,
    category: 'info'
  },
  {
    id: 'slug',
    label: 'URL amigable (slug)',
    description: 'Minimo 3 caracteres',
    check: (c) => (c.slug?.length ?? 0) >= 3,
    required: true,
    category: 'info'
  },
  {
    id: 'description',
    label: 'Descripcion corta',
    description: 'Entre 50 y 160 caracteres (SEO)',
    check: (c) => {
      const len = c.description?.length ?? 0
      return len >= 50 && len <= 160
    },
    required: true,
    category: 'info'
  },
  {
    id: 'long_description',
    label: 'Descripcion completa',
    description: 'Minimo 200 caracteres',
    check: (c) => (c.long_description?.length ?? 0) >= 200,
    required: false,
    category: 'info'
  },
  {
    id: 'level',
    label: 'Nivel definido',
    description: 'Principiante, Intermedio o Avanzado',
    check: (c) => ['beginner', 'intermediate', 'advanced'].includes(c.level),
    required: true,
    category: 'info'
  },

  // Contenido
  {
    id: 'modules',
    label: 'Modulos del curso',
    description: 'Al menos 1 modulo creado',
    check: (_, stats) => stats.modulesCount >= 1,
    required: true,
    category: 'content'
  },
  {
    id: 'lessons',
    label: 'Lecciones del curso',
    description: 'Al menos 3 lecciones en total',
    check: (_, stats) => stats.lessonsCount >= 3,
    required: true,
    category: 'content'
  },
  {
    id: 'duration',
    label: 'Duracion del contenido',
    description: 'Al menos 15 minutos de contenido',
    check: (_, stats) => stats.totalDurationMinutes >= 15,
    required: false,
    category: 'content'
  },

  // Medios
  {
    id: 'thumbnail',
    label: 'Imagen thumbnail',
    description: 'Imagen de portada del curso',
    check: (c) => !!c.thumbnail_url && c.thumbnail_url.length > 0,
    required: true,
    category: 'media'
  },
  {
    id: 'banner',
    label: 'Imagen banner',
    description: 'Imagen de cabecera (opcional)',
    check: (c) => !!c.banner_url && c.banner_url.length > 0,
    required: false,
    category: 'media'
  }
]

export function PublishChecklist({
  course,
  stats,
  onPublish,
  isPublishing = false,
  className = ''
}: PublishChecklistProps) {

  // Calcular resultados
  const results = useMemo(() => {
    return checklistItems.map(item => ({
      ...item,
      passed: item.check(course, stats)
    }))
  }, [course, stats])

  // Estadisticas
  const requiredItems = results.filter(r => r.required)
  const optionalItems = results.filter(r => !r.required)
  const requiredPassed = requiredItems.filter(r => r.passed).length
  const optionalPassed = optionalItems.filter(r => r.passed).length
  const allRequiredPassed = requiredPassed === requiredItems.length
  const progressPercent = Math.round((requiredPassed / requiredItems.length) * 100)

  // Agrupar por categoria
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof results> = {
      info: [],
      content: [],
      media: []
    }
    results.forEach(r => {
      groups[r.category].push(r)
    })
    return groups
  }, [results])

  const categoryLabels = {
    info: 'Informacion',
    content: 'Contenido',
    media: 'Medios'
  }

  const categoryIcons = {
    info: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    content: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    media: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }

  return (
    <div className={`bg-dark-surface border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            Checklist de publicacion
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${allRequiredPassed ? 'text-success' : 'text-brand-light'}`}>
              {requiredPassed}/{requiredItems.length}
            </span>
            <span className="text-xs text-white/40">requeridos</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              allRequiredPassed ? 'bg-success' : 'bg-gradient-to-r from-brand-light to-brand'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!allRequiredPassed && (
          <p className="text-xs text-white/50 mt-2">
            Completa los {requiredItems.length - requiredPassed} requisitos restantes para publicar
          </p>
        )}
      </div>

      {/* Lista agrupada por categoria */}
      <div className="divide-y divide-white/5">
        {Object.entries(groupedResults).map(([category, items]) => (
          <div key={category}>
            {/* Header de categoria */}
            <div className="px-4 py-2 bg-white/5 flex items-center gap-2">
              <span className="text-white/60">
                {categoryIcons[category as keyof typeof categoryIcons]}
              </span>
              <span className="text-xs font-medium text-white/60">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </span>
            </div>

            {/* Items de la categoria */}
            {items.map((item) => (
              <div
                key={item.id}
                className={`
                  flex items-start gap-3 px-4 py-3 transition-colors
                  ${item.passed
                    ? 'bg-success/5'
                    : item.required
                      ? 'bg-error/5'
                      : ''
                  }
                `}
              >
                {/* Icono de estado */}
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                  ${item.passed
                    ? 'bg-success/20 text-success'
                    : item.required
                      ? 'bg-error/20 text-error'
                      : 'bg-white/10 text-white/40'
                  }
                `}>
                  {item.passed ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${item.passed ? 'text-white' : 'text-white/80'}`}>
                      {item.label}
                    </span>
                    {item.required && !item.passed && (
                      <span className="text-xs text-error">*</span>
                    )}
                    {!item.required && (
                      <span className="text-xs text-white/30">(opcional)</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer con boton de publicar */}
      {onPublish && (
        <div className="p-4 border-t border-white/10 bg-white/5">
          {allRequiredPassed ? (
            <>
              <Button
                onClick={onPublish}
                disabled={isPublishing}
                variant="primary"
                className="w-full justify-center"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Publicando...
                  </>
                ) : (
                  'Publicar curso'
                )}
              </Button>
              <p className="text-xs text-white/40 text-center mt-2">
                El curso sera visible para todos los estudiantes
              </p>
            </>
          ) : (
            <>
              <Button
                disabled
                variant="secondary"
                className="w-full justify-center opacity-50 cursor-not-allowed"
              >
                Publicar curso
              </Button>
              <p className="text-xs text-white/50 text-center mt-2">
                Completa todos los requisitos obligatorios
              </p>
            </>
          )}

          {optionalItems.length > 0 && (
            <p className="text-xs text-white/30 text-center mt-3">
              Opcionales: {optionalPassed}/{optionalItems.length} completados
            </p>
          )}
        </div>
      )}
    </div>
  )
}
