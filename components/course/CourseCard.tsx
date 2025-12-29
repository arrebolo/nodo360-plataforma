import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Clock, BookOpen, BarChart3 } from 'lucide-react'

import type { CourseWithOwner } from '@/lib/types/course'
import type { CourseWithInstructor } from '@/types/database'

// Tipo de transición: soporta owner (nuevo) e instructor (legacy)
type CourseCardCourse = (CourseWithOwner & { instructor?: any }) | CourseWithInstructor

interface CourseCardProps {
  course: CourseCardCourse
  progress?: {
    completed: number
    total: number
    percentage: number
    isCompleted?: boolean
  }
}

export function CourseCard({ course, progress }: CourseCardProps) {
  const hasProgress = !!progress && progress.percentage > 0
  const isCompleted =
    !!progress &&
    (progress.percentage === 100 || progress.isCompleted === true)

  const getButtonText = () => {
    if (isCompleted) return '✓ Revisar'
    if (hasProgress) return '▶ Continuar'
    return '🚀 Comenzar'
  }

  // Autor unificado: owner (mentor/instructor) o instructor legacy
  const author = (course as any).owner ?? (course as any).instructor
  const authorInitial = author?.full_name?.[0] || 'N'
  const authorName = author?.full_name || 'Equipo Nodo360'

  return (
    <Link href={`/cursos/${course.slug}`} className="group block">
      <article className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#F7931A] hover:shadow-[0_0_20px_rgba(247,147,26,0.15)] hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-[#F7931A]/20 to-[#FDB931]/20 overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `linear-gradient(#F7931A 1px, transparent 1px),
                                     linear-gradient(90deg, #F7931A 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                  }}
                />
              </div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FDB931] flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-black" />
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Badge variant={course.is_free ? 'free' : 'premium'} />
            {isCompleted && <Badge variant="completed" />}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#F7931A] transition-colors line-clamp-2">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
            {course.description || 'Sin descripción'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {Math.round((course.total_duration_minutes || 0) / 60)}h
              </span>
            </div>

            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{course.total_lessons || 0} lecciones</span>
            </div>

            <div className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="capitalize">
                {course.level === 'beginner'
                  ? 'Principiante'
                  : course.level === 'intermediate'
                  ? 'Intermedio'
                  : 'Avanzado'}
              </span>
            </div>
          </div>

          {/* Progress */}
          {hasProgress && progress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Progreso</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F7931A] to-[#FDB931] rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress.completed} de {progress.total} lecciones
              </p>
            </div>
          )}

          {/* Button */}
          <Button variant="primary" size="md" className="w-full">
            {getButtonText()}
          </Button>

          {/* Author */}
          {author && (
            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FDB931] flex items-center justify-center text-xs text-black font-bold">
                  {authorInitial}
                </div>
                <span className="text-xs text-gray-500">
                  {authorName}
                </span>
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
