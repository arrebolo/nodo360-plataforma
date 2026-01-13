'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'

interface LessonBookmarkButtonProps {
  lessonId: string
}

export function LessonBookmarkButton({ lessonId }: LessonBookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si está guardado al cargar
  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const res = await fetch('/api/bookmarks')
        if (res.ok) {
          const { data } = await res.json()
          const found = data?.some((b: { lesson_id: string }) => b.lesson_id === lessonId)
          setIsBookmarked(found)
        }
      } catch (error) {
        console.error('Error checking bookmark:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkBookmark()
  }, [lessonId])

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (isBookmarked) {
        // Eliminar
        const res = await fetch(`/api/bookmarks?lesson_id=${lessonId}`, {
          method: 'DELETE'
        })
        if (res.ok) setIsBookmarked(false)
      } else {
        // Agregar
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId })
        })
        if (res.ok) setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        p-2 rounded-lg transition-all duration-200 flex items-center gap-2
        ${isBookmarked
          ? 'bg-brand-light/20 text-brand-light hover:bg-brand-light/30'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={isBookmarked ? 'Quitar de guardados' : 'Guardar para después'}
      aria-pressed={isBookmarked}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" aria-hidden="true" />
      ) : isBookmarked ? (
        <BookmarkCheck size={20} aria-hidden="true" />
      ) : (
        <Bookmark size={20} aria-hidden="true" />
      )}
      <span className="text-sm hidden sm:inline">
        {isBookmarked ? 'Guardado' : 'Guardar'}
      </span>
    </button>
  )
}

export default LessonBookmarkButton
