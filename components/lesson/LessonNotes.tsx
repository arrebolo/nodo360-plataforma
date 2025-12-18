'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save } from 'lucide-react'

type Note = {
  id: string
  content: string
  created_at: string
}

export default function LessonNotes({ lessonId }: { lessonId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setError('Debes iniciar sesión para guardar notas.')
          setLoading(false)
          return
        }

        const { data, error: notesError } = await supabase
          .from('notes')
          .select('id, content, created_at')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .order('created_at', { ascending: false })

        if (notesError) {
          console.error('[LessonNotes] Error cargando notas:', notesError)
          setError('No se pudieron cargar tus notas.')
        } else {
          setNotes(data || [])
        }
      } catch (err) {
        console.error('[LessonNotes] Error inesperado:', err)
        setError('Error inesperado al cargar tus notas.')
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [lessonId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Debes iniciar sesión para guardar notas.')
        return
      }

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          content: newNote.trim(),
        } as any)
        .select('id, content, created_at')
        .single()

      if (error) {
        console.error('[LessonNotes] Error guardando nota:', error)
        setError('No se pudo guardar la nota.')
      } else if (data) {
        setNotes((prev) => [data, ...prev])
        setNewNote('')
      }
    } catch (err) {
      console.error('[LessonNotes] Error inesperado al guardar nota:', err)
      setError('Error inesperado al guardar la nota.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Mis notas de esta lección</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando tus notas...
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Formulario para nueva nota */}
          <form onSubmit={handleSave} className="space-y-3 mb-6">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a] resize-none"
              placeholder="Escribe aquí tus notas, ideas o recordatorios sobre esta lección..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !newNote.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar nota
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Lista de notas existentes */}
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white/80"
                >
                  <p className="whitespace-pre-wrap">{note.content}</p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {new Date(note.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">
              Aún no has guardado notas en esta lección. Usa el cuadro de arriba para añadir
              tus primeras notas.
            </p>
          )}
        </>
      )}
    </div>
  )
}
