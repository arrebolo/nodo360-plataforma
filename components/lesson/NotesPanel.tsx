'use client'

import { useEffect, useState } from 'react'

type NotesPanelProps = {
  lessonId: string
}

type NoteData = {
  id: string
  note_text: string | null
}

export function NotesPanel({ lessonId }: NotesPanelProps) {
  const [content, setContent] = useState('')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle')

  // Cargar nota existente al entrar en la leccion
  useEffect(() => {
    let cancelled = false

    async function loadNote() {
      try {
        setStatus('loading')
        const res = await fetch(`/api/notes?lessonId=${lessonId}`)

        if (!res.ok) {
          setStatus('idle')
          return
        }

        const data = await res.json()

        if (!cancelled && Array.isArray(data) && data.length > 0) {
          const note = data[0] as NoteData
          setContent(note.note_text || '')
          setNoteId(note.id)
        }
        setStatus('idle')
      } catch {
        if (!cancelled) setStatus('idle')
      }
    }

    loadNote()
    return () => {
      cancelled = true
    }
  }, [lessonId])

  async function handleSave() {
    try {
      setStatus('saving')

      let res: Response

      if (noteId) {
        res = await fetch('/api/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: noteId, note_text: content }),
        })
      } else {
        res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId, note_text: content }),
        })
      }

      if (!res.ok) {
        setStatus('error')
        return
      }

      const saved = await res.json()
      if (saved.id) {
        setNoteId(saved.id)
      }

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    } catch {
      setStatus('error')
    }
  }

  const isBusy = status === 'saving' || status === 'loading'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-500">
          {status === 'loading' && 'Cargando...'}
          {status === 'saving' && 'Guardando...'}
          {status === 'saved' && <span className="text-emerald-400">Guardado</span>}
          {status === 'error' && <span className="text-red-400">Error al guardar</span>}
        </span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-28 w-full resize-none rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500/70 placeholder:text-neutral-600"
        placeholder="Escribe aqui ideas importantes, dudas o recordatorios de esta leccion..."
        disabled={isBusy}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          Guardar notas
        </button>
      </div>
    </div>
  )
}

export default NotesPanel
