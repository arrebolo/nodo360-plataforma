'use client'

import { useCallback } from 'react'
import { SortableList, DragHandle } from '@/components/ui/SortableList'

// ============================================
// TIPOS
// ============================================

interface Lesson {
  id: string
  title: string
  slug: string
  order_index: number
  is_free_preview?: boolean
  video_duration_minutes?: number
}

interface LessonsSortableProps {
  lessons: Lesson[]
  moduleId: string
  onLessonsReorder: (lessons: Lesson[]) => void
  onEditLesson?: (lesson: Lesson) => void
  onDeleteLesson?: (lesson: Lesson) => void
  disabled?: boolean
}

// ============================================
// COMPONENTE
// ============================================

export function LessonsSortable({
  lessons,
  moduleId,
  onLessonsReorder,
  onEditLesson,
  onDeleteLesson,
  disabled = false
}: LessonsSortableProps) {

  const renderLesson = useCallback((lesson: Lesson, isDragging: boolean) => {
    return (
      <div
        className={`
          flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-2
          ${isDragging ? 'shadow-xl ring-2 ring-brand-light bg-dark-surface' : 'hover:bg-white/10'}
          transition-colors group
        `}
      >
        {/* Drag handle */}
        {!disabled && <DragHandle className="flex-shrink-0" />}

        {/* Icono de video */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Info de la leccion */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {lesson.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {lesson.video_duration_minutes && (
              <span className="text-xs text-white/50">
                {lesson.video_duration_minutes} min
              </span>
            )}
            {lesson.is_free_preview && (
              <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded">
                Preview
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        {!disabled && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEditLesson && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditLesson(lesson)
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                title="Editar leccion"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDeleteLesson && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteLesson(lesson)
                }}
                className="p-1.5 hover:bg-error/20 rounded-lg transition text-white/60 hover:text-error"
                title="Eliminar leccion"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }, [disabled, onEditLesson, onDeleteLesson])

  return (
    <SortableList
      items={lessons}
      onReorder={onLessonsReorder}
      renderItem={renderLesson}
      disabled={disabled}
      className="group"
    />
  )
}
