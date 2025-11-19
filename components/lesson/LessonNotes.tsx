'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, StickyNote } from 'lucide-react'
import {
  getLessonNotes,
  addLessonNote,
  deleteLessonNote,
  type Note,
} from '@/lib/utils/progress'

interface LessonNotesProps {
  lessonId: string
}

export function LessonNotes({ lessonId }: LessonNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Cargar notas
  useEffect(() => {
    loadNotes()

    // Listener para actualizaciones
    const handleUpdate = () => loadNotes()
    window.addEventListener('note-added', handleUpdate)
    window.addEventListener('note-deleted', handleUpdate)

    return () => {
      window.removeEventListener('note-added', handleUpdate)
      window.removeEventListener('note-deleted', handleUpdate)
    }
  }, [lessonId])

  const loadNotes = () => {
    const loaded = getLessonNotes(lessonId)
    setNotes(loaded)
  }

  const handleAddNote = () => {
    if (!newNoteText.trim()) return

    try {
      addLessonNote(lessonId, newNoteText.trim())
      setNewNoteText('')
      setIsAdding(false)
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error al agregar nota')
    }
  }

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('¿Eliminar esta nota?')) return

    try {
      deleteLessonNote(lessonId, noteId)
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error al eliminar nota')
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          Mis Notas
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors"
            aria-label="Agregar nota"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/10">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Escribe tu nota aquí..."
            className="w-full bg-transparent text-white text-sm placeholder:text-white/30 border-none outline-none resize-none min-h-[80px]"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddNote}
              className="px-3 py-1.5 bg-[#dc2626] text-white text-xs font-medium rounded hover:bg-[#b91c1c] transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewNoteText('')
              }}
              className="px-3 py-1.5 bg-[#2a2a2a] text-white text-xs font-medium rounded hover:bg-[#3a3a3a] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50">No tienes notas aún</p>
            <p className="text-xs text-white/30 mt-1">
              Haz clic en + para agregar una
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-black/30 rounded-lg border border-white/10 group"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <p className="text-xs text-white/50">{formatDate(note.timestamp)}</p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                  aria-label="Eliminar nota"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
