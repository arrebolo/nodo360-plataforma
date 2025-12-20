import Link from 'next/link'
import { BookOpen, Clock, Users, ChevronRight } from 'lucide-react'
import { Badge, FreeBadge, PremiumBadge } from './Badge'
import { Card } from './Card'

interface CourseCardProps {
  course: {
    id: string
    slug: string
    title: string
    description?: string | null
    is_premium?: boolean
    level?: 'principiante' | 'intermedio' | 'avanzado'
    duration?: string
    students?: number
    lessons_count?: number
    progress?: number // 0-100 for enrolled courses
  }
  variant?: 'default' | 'compact' | 'horizontal'
  showProgress?: boolean
}

export function CourseCard({ course, variant = 'default', showProgress = false }: CourseCardProps) {
  const levelLabels = {
    principiante: 'Principiante',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
  }

  if (variant === 'compact') {
    return (
      <Link href={`/cursos/${course.slug}`}>
        <Card variant="interactive" padding="sm" className="group">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                {course.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {course.is_premium ? <PremiumBadge /> : <FreeBadge />}
                {course.level && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {levelLabels[course.level]}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" />
          </div>

          {showProgress && typeof course.progress === 'number' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-muted)]">Progreso</span>
                <span className="text-[var(--color-text-secondary)]">{course.progress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/cursos/${course.slug}`}>
        <Card variant="interactive" padding="none" className="group flex overflow-hidden">
          {/* Thumbnail placeholder */}
          <div className="w-48 h-32 bg-[var(--color-bg-overlay)] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>

          {/* Content */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {course.is_premium ? <PremiumBadge /> : <FreeBadge />}
                  {course.level && (
                    <Badge variant="default" size="sm">{levelLabels[course.level]}</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                    {course.description}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
              {course.lessons_count && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {course.lessons_count} lecciones
                </span>
              )}
              {course.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {course.duration}
                </span>
              )}
              {course.students && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {course.students.toLocaleString()} estudiantes
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  // Default variant - vertical card
  return (
    <Link href={`/cursos/${course.slug}`}>
      <Card variant="interactive" padding="none" className="group overflow-hidden h-full flex flex-col">
        {/* Thumbnail placeholder */}
        <div className="aspect-video bg-[var(--color-bg-overlay)] flex items-center justify-center relative">
          <BookOpen className="w-12 h-12 text-[var(--color-text-muted)]" />

          {/* Badge overlay */}
          <div className="absolute top-3 left-3">
            {course.is_premium ? <PremiumBadge /> : <FreeBadge />}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            {course.level && (
              <Badge variant="default" size="sm">{levelLabels[course.level]}</Badge>
            )}
          </div>

          <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {course.title}
          </h3>

          {course.description && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2 flex-1">
              {course.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
            {course.lessons_count && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {course.lessons_count} lecciones
              </span>
            )}
            {course.students && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {course.students.toLocaleString()}
              </span>
            )}
          </div>

          {showProgress && typeof course.progress === 'number' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-muted)]">Progreso</span>
                <span className="text-[var(--color-text-secondary)]">{course.progress}%</span>
              </div>
              <div className="progress">
                <div
                  className={`progress-bar ${course.progress === 100 ? 'progress-bar-success' : ''}`}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
