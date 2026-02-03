'use client'

import React from 'react'
import Link from 'next/link'
import { Pencil, Trash2, List } from 'lucide-react'

export interface CourseAdminCardProps {
  course: any
  onDelete?: (courseId: string) => void
  onViewOutline?: (courseId: string) => void
  returnTo?: string
}

export default function CourseAdminCard({
  course,
  onDelete,
  onViewOutline,
  returnTo,
}: CourseAdminCardProps) {
  const backParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
  const courseId = course?.id

  // Count modules and lessons
  const modulesCount = course?.modules?.length || 0
  const lessonsCount = course?.modules?.reduce(
    (acc: number, mod: any) => acc + (mod?.lessons?.[0]?.count || mod?.lessons?.length || 0),
    0
  ) || 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-white font-semibold truncate">
            {course?.title ?? 'Sin título'}
          </h3>
          <p className="text-xs text-white/60 mt-1 truncate">
            {course?.slug ?? ''} · {course?.status ?? 'draft'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewOutline && (
            <button
              type="button"
              onClick={() => courseId && onViewOutline(courseId)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 transition-colors"
              title="Ver esquema"
            >
              <List size={16} />
              <span className="hidden sm:inline">Esquema</span>
            </button>
          )}
          <Link
            href={`/admin/cursos/${courseId}${backParam}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 transition-colors"
          >
            <Pencil size={16} />
            Editar
          </Link>

          {onDelete ? (
            <button
              type="button"
              onClick={() => courseId && onDelete(courseId)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/15 transition-colors"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          ) : null}
        </div>
      </div>

      {course?.description ? (
        <p className="text-sm text-white/80 line-clamp-2">{course.description}</p>
      ) : (
        <p className="text-sm text-white/50">Sin descripción</p>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-xs text-white/50">
        <span>{modulesCount} módulo{modulesCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{lessonsCount} lección{lessonsCount !== 1 ? 'es' : ''}</span>
        {course?.enrollments?.[0]?.count > 0 && (
          <>
            <span>·</span>
            <span>{course.enrollments[0].count} inscrito{course.enrollments[0].count !== 1 ? 's' : ''}</span>
          </>
        )}
      </div>
    </div>
  )
}


