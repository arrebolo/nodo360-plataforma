'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Trash2, Play, Loader2, Edit } from 'lucide-react'

// Local type matching user_notes table structure
interface NoteData {
  id: string
  note_text: string
  created_at: string
  updated_at: string
  lesson_id: string
  lesson: {
    id: string
    title: string
    slug: string
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
        slug: string
      }
    }
  } | null
}

interface NotesListProps {
  initialNotes: NoteData[]
}

export function NotesList({ initialNotes }: NotesListProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (lessonId: string, noteId: string) => {
    if (!confirm('¿Eliminar esta nota?')) return

    setIsDeleting(noteId)

    try {
      // Clear the note by saving empty content
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: '' })
      })

      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId))
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  // Filter out empty notes
  const validNotes = notes.filter(n => n.note_text && n.note_text.trim().length > 0)

  if (validNotes.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 mx-auto text-white/20 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No tienes notas
        </h3>
        <p className="text-white/50 mb-6">
          Toma notas mientras estudias para recordar lo importante
        </p>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Play size={20} />
          Ir a cursos
        </Link>
      </div>
    )
  }

  // Group notes by course
  const notesByCourse = validNotes.reduce((acc, note) => {
    const courseTitle = note.lesson?.module?.course?.title || 'Sin curso'
    if (!acc[courseTitle]) {
      acc[courseTitle] = []
    }
    acc[courseTitle].push(note)
    return acc
  }, {} as Record<string, NoteData[]>)

  return (
    <div className="space-y-8">
      {Object.entries(notesByCourse).map(([courseTitle, courseNotes]) => (
        <div key={courseTitle}>
          <h3 className="text-lg font-semibold text-white mb-4">{courseTitle}</h3>

          <div className="space-y-3">
            {courseNotes.map((note) => {
              const lesson = note.lesson
              const mod = lesson?.module
              const course = mod?.course

              return (
                <div
                  key={note.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Note content */}
                      <p className="text-white whitespace-pre-wrap line-clamp-4">
                        {note.note_text}
                      </p>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/40">
                        {lesson && course && (
                          <Link
                            href={`/cursos/${course.slug}/${lesson.slug}`}
                            className="text-brand-light hover:underline"
                          >
                            {lesson.title}
                          </Link>
                        )}

                        <span>
                          Actualizado: {new Date(note.updated_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {lesson && course && (
                        <>
                          <Link
                            href={`/cursos/${course.slug}/${lesson.slug}`}
                            className="p-2 bg-brand-light/20 text-brand-light rounded-lg hover:bg-brand-light/30 transition-colors"
                            title="Ir a lección (editar nota)"
                          >
                            <Edit size={16} />
                          </Link>
                          <Link
                            href={`/cursos/${course.slug}/${lesson.slug}`}
                            className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
                            title="Ver lección"
                          >
                            <Play size={16} />
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(note.lesson_id, note.id)}
                        disabled={isDeleting === note.id}
                        className="p-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors disabled:opacity-50"
                        title="Eliminar nota"
                      >
                        {isDeleting === note.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
