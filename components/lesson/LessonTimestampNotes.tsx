'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Clock, Save, X, Loader2 } from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import type { Note } from '@/types/database'

interface LessonTimestampNotesProps {
  lessonId: string
  currentVideoTime?: number
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function LessonTimestampNotes({ lessonId, currentVideoTime }: LessonTimestampNotesProps) {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes(lessonId)
  const [newNote, setNewNote] = useState('')
  const [includeTimestamp, setIncludeTimestamp] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsSaving(true)
    const timestamp = includeTimestamp ? currentVideoTime : undefined
    await addNote(lessonId, newNote.trim(), timestamp)
    setNewNote('')
    setIncludeTimestamp(false)
    setIsSaving(false)
  }

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return

    setIsSaving(true)
    await updateNote(editingId, editContent.trim())
    setEditingId(null)
    setEditContent('')
    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta nota?')) {
      await deleteNote(id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Formulario para nueva nota */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Escribe una nota sobre esta lección..."
          className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-white/40 resize-none focus:outline-none focus:border-brand-light/50"
          rows={3}
        />

        <div className="flex items-center justify-between mt-3 gap-3">
          {currentVideoTime !== undefined && currentVideoTime > 0 ? (
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-brand-light focus:ring-brand-light/50"
              />
              <Clock size={14} />
              Guardar timestamp ({formatTimestamp(currentVideoTime)})
            </label>
          ) : (
            <div />
          )}

          <button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-brand-light/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {isSaving ? 'Guardando...' : 'Agregar nota'}
          </button>
        </div>
      </div>

      {/* Lista de notas */}
      {isLoading ? (
        <div className="text-center py-8 text-white/40 flex items-center justify-center gap-2">
          <Loader2 size={20} className="animate-spin" />
          Cargando notas...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          No tienes notas en esta lección
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              {editingId === note.id ? (
                /* Modo edición */
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-brand-light/50"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 text-white/60 hover:text-white transition-colors"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand-light text-white rounded-lg hover:bg-brand-light/90 transition-colors disabled:opacity-50"
                    >
                      <Save size={14} />
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo visualización */
                <>
                  <p className="text-white whitespace-pre-wrap">{note.content}</p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      {note.video_timestamp_seconds !== null && (
                        <span className="flex items-center gap-1 text-brand-light">
                          <Clock size={12} />
                          {formatTimestamp(note.video_timestamp_seconds)}
                        </span>
                      )}
                      <span>
                        {new Date(note.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 text-white/40 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 text-white/40 hover:text-error transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LessonTimestampNotes
