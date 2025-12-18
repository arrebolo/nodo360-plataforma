'use client'

import { useState } from 'react'
import {
  BookmarkPlus,
  BookmarkCheck,
  StickyNote,
  Loader2,
  CheckCircle2
} from 'lucide-react'

interface LessonExtrasProps {
  lessonId: string
  initialBookmarked: boolean
  initialNote?: string
}

export default function LessonExtras({
  lessonId,
  initialBookmarked,
  initialNote
}: LessonExtrasProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const [note, setNote] = useState(initialNote ?? '')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  async function toggleBookmark() {
    try {
      setBookmarkLoading(true)

      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          action: bookmarked ? 'remove' : 'add'
        })
      })

      if (!res.ok) {
        throw new Error('Error al actualizar favorito')
      }

      setBookmarked(!bookmarked)
    } catch (error) {
      console.error('[LessonExtras] Error bookmark:', error)
      alert('No se pudo actualizar el favorito')
    } finally {
      setBookmarkLoading(false)
    }
  }

  async function saveNote() {
    try {
      setSavingNote(true)
      setNoteSaved(false)

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: note })
      })

      if (!res.ok) {
        throw new Error('Error al guardar nota')
      }

      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch (error) {
      console.error('[LessonExtras] Error nota:', error)
      alert('No se pudo guardar la nota')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ⭐ Guardar lección */}
      <button
        type="button"
        onClick={toggleBookmark}
        disabled={bookmarkLoading}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition disabled:opacity-60"
      >
        <div className="flex items-center gap-2">
          {bookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <BookmarkPlus className="w-4 h-4 text-[#f7931a]" />
          )}
          <span>
            {bookmarked ? 'Lección guardada' : 'Guardar para revisar más tarde'}
          </span>
        </div>
        {bookmarkLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      </button>

      {/* 📝 Notas rápidas */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="w-4 h-4 text-[#f7931a]" />
          <span className="text-sm font-medium">Notas rápidas</span>
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          placeholder="Apunta ideas clave, dudas o ejemplos para recordar esta lección…"
          className="w-full text-sm bg-black/30 border border-white/10 rounded-md p-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#f7931a]"
        />

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={saveNote}
            disabled={savingNote}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-xs font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {savingNote ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Guardando…
              </>
            ) : (
              'Guardar nota'
            )}
          </button>

          {noteSaved && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-3 h-3" />
              Nota guardada
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
