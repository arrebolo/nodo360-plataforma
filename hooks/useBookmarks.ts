'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BookmarkWithLesson } from '@/types/database'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkWithLesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookmarks = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/bookmarks')
      const json = await res.json()

      if (!res.ok) throw new Error(json.error)

      setBookmarks(json.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bookmarks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addBookmark = useCallback(async (lessonId: string, note?: string) => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, note })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }

      await fetchBookmarks()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      return false
    }
  }, [fetchBookmarks])

  const removeBookmark = useCallback(async (lessonId: string) => {
    try {
      const res = await fetch(`/api/bookmarks?lesson_id=${lessonId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }

      setBookmarks(prev => prev.filter(b => b.lesson_id !== lessonId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      return false
    }
  }, [])

  const isBookmarked = useCallback((lessonId: string) => {
    return bookmarks.some(b => b.lesson_id === lessonId)
  }, [bookmarks])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  return {
    bookmarks,
    isLoading,
    error,
    addBookmark,
    removeBookmark,
    isBookmarked,
    refresh: fetchBookmarks
  }
}
