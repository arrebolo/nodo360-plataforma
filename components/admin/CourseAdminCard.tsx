'use client'

import React from 'react'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'

export interface CourseAdminCardProps {
  course: any
  onDelete?: (courseId: string) => void
  returnTo?: string
}

export default function CourseAdminCard({
  course,
  onDelete,
  returnTo,
}: CourseAdminCardProps) {
  const backParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
  const courseId = course?.id

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
          <Link
            href={`/admin/cursos/${courseId}${backParam}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 hover:bg-white/10"
          >
            <Pencil size={16} />
            Editar
          </Link>

          {onDelete ? (
            <button
              type="button"
              onClick={() => courseId && onDelete(courseId)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/15"
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
    </div>
  )
}


