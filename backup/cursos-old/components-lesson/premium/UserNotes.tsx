'use client'

import { useState, useEffect } from 'react'
import type { UserNote } from '@/types/lesson-content'

interface UserNotesProps {
  lessonId: string
}

export function UserNotes({ lessonId }: UserNotesProps) {
  const [notes, setNotes] = useState<UserNote[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Load notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`notes-${lessonId}`)
    if (stored) {
      setNotes(JSON.parse(stored))
    }
  }, [lessonId])

  // Save notes to localStorage
  const saveNotes = (updatedNotes: UserNote[]) => {
    setNotes(updatedNotes)
    localStorage.setItem(`notes-${lessonId}`, JSON.stringify(updatedNotes))
  }

  const addNote = () => {
    if (!newNote.trim()) return

    const note: UserNote = {
      id: `note-${Date.now()}`,
      blockId: 'manual',
      content: newNote,
      timestamp: Date.now(),
    }

    saveNotes([note, ...notes])
    setNewNote('')
    setIsAdding(false)
  }

  const deleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id))
  }

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Mis Notas
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Search */}
      {notes.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar en notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
          />
          <svg className="w-4 h-4 text-gray-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {/* Add Note Form */}
      {isAdding && (
        <div className="bg-gray-800 rounded-lg p-3 border border-yellow-500/30">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Escribe tu nota aquí..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setIsAdding(false)
                setNewNote('')
              }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={addNote}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium text-sm rounded-lg transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            {searchQuery ? 'No se encontraron notas' : 'Aún no tienes notas'}
          </p>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors group"
            >
              <p className="text-sm text-gray-300 whitespace-pre-wrap mb-2">
                {note.content}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(note.timestamp).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
