'use client'

import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  thumbnail_url?: string
  level: string
  status: string
  is_free: boolean
  is_premium: boolean
  created_at: string
  instructor?: {
    id: string
    full_name: string
  }
  _count?: {
    modules: number
    enrollments: number
  }
}

interface CoursesListProps {
  courses: Course[]
  isLoading?: boolean
}

export function CoursesList({ courses, isLoading }: CoursesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-dark-surface border border-white/10 rounded-2xl p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-32 h-20 bg-white/10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-white/10 rounded w-1/3" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-dark-surface border border-white/10 rounded-2xl">
        <div className="text-4xl mb-3">📚</div>
        <h3 className="text-lg font-semibold text-white mb-2">No hay cursos</h3>
        <p className="text-white/60 text-sm mb-4">
          No se encontraron cursos con los filtros actuales
        </p>
        <Button href="/admin/cursos/nuevo">
          Crear primer curso
        </Button>
      </div>
    )
  }

  const levelConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
    beginner: { label: 'Principiante', variant: 'success' },
    intermediate: { label: 'Intermedio', variant: 'warning' },
    advanced: { label: 'Avanzado', variant: 'error' }
  }

  const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'default'; icon: string }> = {
    draft: { label: 'Borrador', variant: 'warning', icon: '📝' },
    published: { label: 'Publicado', variant: 'success', icon: '✅' },
    archived: { label: 'Archivado', variant: 'default', icon: '📦' }
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => {
        const level = levelConfig[course.level] || levelConfig.beginner
        const status = statusConfig[course.status] || statusConfig.draft

        return (
          <div
            key={course.id}
            className="bg-dark-surface border border-white/10 rounded-2xl p-4 hover:border-white/20 transition group"
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-32 h-20 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-32 h-20 bg-white/10 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-brand-light transition truncate">
                      {course.title}
                    </h3>
                    <p className="text-sm text-white/50 mt-0.5 truncate">
                      /cursos/{course.slug}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={status.variant}>
                      {status.icon} {status.label}
                    </Badge>
                    <Badge variant={level.variant}>
                      {level.label}
                    </Badge>
                  </div>
                </div>

                {/* Descripcion */}
                {course.description && (
                  <p className="text-sm text-white/60 mt-2 line-clamp-1">
                    {course.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                  {course.instructor && (
                    <span>👤 {course.instructor.full_name}</span>
                  )}
                  {course._count && (
                    <>
                      <span>📦 {course._count.modules} modulos</span>
                      <span>👥 {course._count.enrollments} inscritos</span>
                    </>
                  )}
                  <span>
                    📅 {new Date(course.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/admin/cursos/${course.id}`}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                  title="Editar curso"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <Link
                  href={`/admin/cursos/${course.id}/modulos`}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                  title="Gestionar modulos"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </Link>
                {course.status === 'published' && (
                  <Link
                    href={`/cursos/${course.slug}`}
                    target="_blank"
                    className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                    title="Ver pagina publica"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
