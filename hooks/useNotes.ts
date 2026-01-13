'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Note } from '@/types/database'

export function useNotes(lessonId?: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      const url = lessonId
        ? `/api/lesson-notes?lesson_id=${lessonId}`
        : '/api/lesson-notes'

      const res = await fetch(url)
      const json = await res.json()

      if (!res.ok) throw new Error(json.error)

      setNotes(json.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notas')
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])

  const addNote = useCallback(async (
    lessonId: string,
    content: string,
    videoTimestamp?: number
  ) => {
    try {
      const res = await fetch('/api/lesson-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          content,
          video_timestamp_seconds: videoTimestamp
        })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }

      const { data } = await res.json()
      setNotes(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar nota')
      return null
    }
  }, [])

  const updateNote = useCallback(async (
    id: string,
    content: string
  ) => {
    try {
      const res = await fetch('/api/lesson-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }

      const { data } = await res.json()
      setNotes(prev => prev.map(n => n.id === id ? data : n))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar nota')
      return null
    }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/lesson-notes?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }

      setNotes(prev => prev.filter(n => n.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar nota')
      return false
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refresh: fetchNotes
  }
}
