'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, Trash2, Clock, Play, BookOpen, Loader2 } from 'lucide-react'

// Tipo local para los datos que vienen del server component
interface BookmarkData {
  id: string
  lesson_id: string
  note: string | null
  created_at: string
  lesson: {
    id: string
    title: string
    slug: string
    description: string | null
    video_duration_minutes: number | null
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
        slug: string
        thumbnail_url: string | null
        level: string
      }
    }
  } | null
}

interface BookmarksListProps {
  initialBookmarks: BookmarkData[]
}

export function BookmarksList({ initialBookmarks }: BookmarksListProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>(initialBookmarks)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (lessonId: string) => {
    setIsDeleting(lessonId)

    try {
      const res = await fetch(`/api/bookmarks?lesson_id=${lessonId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.lesson_id !== lessonId))
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16">
        <Bookmark className="w-16 h-16 mx-auto text-white/20 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No tienes lecciones guardadas
        </h3>
        <p className="text-white/50 mb-6">
          Guarda lecciones para acceder a ellas rápidamente
        </p>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <BookOpen size={20} />
          Explorar cursos
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {bookmarks.map((bookmark) => {
        const lesson = bookmark.lesson
        const mod = lesson?.module
        const course = mod?.course

        if (!lesson || !mod || !course) return null

        return (
          <div
            key={bookmark.id}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors"
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="w-32 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/cursos/${course.slug}/${lesson.slug}`}
                  className="text-lg font-semibold text-white hover:text-brand-light transition-colors line-clamp-1"
                >
                  {lesson.title}
                </Link>

                <p className="text-sm text-white/50 mt-1">
                  {course.title} • {mod.title}
                </p>

                {bookmark.note && (
                  <p className="text-sm text-white/40 mt-2 italic line-clamp-2">
                    &ldquo;{bookmark.note}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(bookmark.created_at).toLocaleDateString('es-ES')}
                  </span>
                  {lesson.video_duration_minutes && (
                    <span>{lesson.video_duration_minutes} min</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-start gap-2">
                <Link
                  href={`/cursos/${course.slug}/${lesson.slug}`}
                  className="p-2 bg-brand-light/20 text-brand-light rounded-lg hover:bg-brand-light/30 transition-colors"
                  title="Ver lección"
                >
                  <Play size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  disabled={isDeleting === lesson.id}
                  className="p-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors disabled:opacity-50"
                  title="Quitar de guardados"
                >
                  {isDeleting === lesson.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
