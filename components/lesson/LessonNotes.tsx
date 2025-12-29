'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { StickyNote } from 'lucide-react'

export function LessonNotes({ lessonId }: { lessonId: string }) {
  const isUuid = (v?: string | null) =>
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

  const idsReady = isUuid(lessonId)
  const draftKey = useMemo(() => `nodo360_note_draft_${lessonId}`, [lessonId])

  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastCloudValueRef = useRef<string>('')

  useEffect(() => {
    const draft = window.localStorage.getItem(draftKey)
    if (draft != null) setValue(draft)

    if (!idsReady) return

    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setErrorMsg(null)

        const res = await fetch(`/api/notes?lessonId=${lessonId}`)
        const json = await res.json()

        if (cancelled) return

        if (!res.ok) {
          setStatus('idle')
          return
        }

        if (json?.note?.content != null) {
          setValue(json.note.content)
          lastCloudValueRef.current = json.note.content
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
  }, [lessonId, draftKey, idsReady])

  useEffect(() => {
    window.localStorage.setItem(draftKey, value)
  }, [value, draftKey])

  const dirty = value !== lastCloudValueRef.current
  const hasText = value.trim().length > 0

  const canSave = idsReady && dirty && hasText && status !== 'saving' && status !== 'loading'

  const disabledReason = !idsReady
    ? 'lessonId inválido'
    : status === 'loading'
    ? 'cargando'
    : status === 'saving'
    ? 'guardando'
    : !hasText
    ? 'vacío'
    : !dirty
    ? 'sin cambios'
    : null

  const handleSave = async () => {
    console.log('[LessonNotes] click guardar', { idsReady, dirty, status, len: value.length })

    if (!canSave) return

    try {
      setStatus('saving')
      setErrorMsg(null)

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: value }),
      })

      const json = await res.json()

      if (!res.ok) throw new Error(json?.error ?? 'Error al guardar nota')

      lastCloudValueRef.current = value
      window.localStorage.removeItem(draftKey)

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 800)
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? 'Error al guardar nota')
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          Mis notas
        </h3>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="text-xs rounded-full px-3 py-1 border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white"
          title={disabledReason ? `No se puede guardar: ${disabledReason}` : 'Guardar'}
        >
          {status === 'loading'
            ? 'Cargando...'
            : status === 'saving'
            ? 'Guardando...'
            : status === 'saved'
            ? 'Guardado'
            : !idsReady
            ? 'Guardar (local)'
            : 'Guardar'}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={idsReady ? 'Escribe aquí tus ideas clave...' : 'Modo local (lessonId inválido).'}
        className="w-full min-h-[220px] rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/30"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-white/40">
        <span>{value.length} caracteres</span>
        <span>
          {!idsReady ? 'Modo local.' : !hasText ? 'Vacío.' : dirty ? 'Cambios sin guardar.' : 'Sin cambios.'}
        </span>
      </div>

      {status === 'error' && errorMsg ? (
        <div className="mt-3 text-xs rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-200">
          Error: {errorMsg}
        </div>
      ) : null}
    </div>
  )
}
