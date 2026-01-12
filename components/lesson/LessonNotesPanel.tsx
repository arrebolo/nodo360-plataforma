'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type NotesPanelProps = {
  lessonId: string
  courseId: string
}

type GetResponse =
  | { note: { id: string; content: string; updated_at: string } | null }
  | { error: string }

type PostResponse = { success: true } | { error: string }

const isUuid = (v?: string | null) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

export default function NotesPanel({ lessonId, courseId }: NotesPanelProps) {
  const idsReady = isUuid(lessonId) && isUuid(courseId)
  const draftKey = useMemo(() => `nodo360_note_draft_${courseId}_${lessonId}`, [courseId, lessonId])

  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastCloudValueRef = useRef<string>('')

  useEffect(() => {
    const draft = typeof window !== 'undefined' ? window.localStorage.getItem(draftKey) : null
    if (draft) setValue(draft)

    if (!idsReady) return

    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setErrorMsg(null)

        const res = await fetch(`/api/notes?lessonId=${lessonId}&courseId=${courseId}`)
        const json = (await res.json()) as GetResponse

        if (cancelled) return

        if (!res.ok) {
          setStatus('idle')
          return
        }

        const note = (json as any)?.note
        if (note?.content != null) {
          setValue(note.content)
          lastCloudValueRef.current = note.content
          window.localStorage.removeItem(draftKey)
        } else {
          lastCloudValueRef.current = draft ?? ''
        }

        setStatus('idle')
      } catch (e: any) {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(e?.message ?? 'Error cargando nota')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [idsReady, lessonId, courseId, draftKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(draftKey, value)
  }, [value, draftKey])

  const dirty = value !== lastCloudValueRef.current
  const canSave = idsReady && dirty

  const handleSave = async () => {
    if (!canSave) return

    try {
      setStatus('saving')
      setErrorMsg(null)

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, courseId, content: value }),
      })

      const json = (await res.json()) as PostResponse

      if (!res.ok) {
        const msg = (json as any)?.error ?? 'Error al guardar nota'
        throw new Error(msg)
      }

      lastCloudValueRef.current = value
      window.localStorage.removeItem(draftKey)

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 900)
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? 'Error guardando nota')
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-semibold">Mis notas</div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || status === 'saving' || status === 'loading'}
          className="text-xs rounded-full px-3 py-1 border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          title={!idsReady ? 'Faltan IDs válidos (UUID) para guardar en nube' : undefined}
        >
          {status === 'loading'
            ? 'Cargando...'
            : status === 'saving'
            ? 'Guardando...'
            : status === 'saved'
            ? 'Guardado'
            : !idsReady
            ? 'Guardar (pendiente)'
            : dirty
            ? 'Guardar'
            : 'Guardado'}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          idsReady
            ? 'Escribe aquí tus ideas clave, dudas y conclusiones...'
            : 'No puedo guardar en nube: lessonId/courseId no son UUID válidos.'
        }
        className="w-full min-h-[220px] rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none focus:ring-2 focus:ring-white/10"
      />

      <div className="mt-2 flex items-center justify-between text-xs opacity-70">
        <span>{value.length} caracteres</span>
        <span>{!idsReady ? 'Modo local.' : dirty ? 'Cambios sin guardar.' : 'Sin cambios.'}</span>
      </div>

      {status === 'error' && errorMsg ? (
        <div className="mt-3 text-xs rounded-xl border border-red-500/20 bg-red-500/10 p-2">
          Error: {errorMsg}
        </div>
      ) : null}
    </div>
  )
}


