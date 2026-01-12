'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StickyNote, Check, Loader2, AlertCircle, Cloud } from 'lucide-react'

const DEBOUNCE_MS = 900
const SAVED_BADGE_MS = 2000

type LessonNotesProps = {
  lessonId: string
  userId: string | null
  initialContent?: string
}

const isUuid = (v?: string | null) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

export function LessonNotes({ lessonId, userId, initialContent = '' }: LessonNotesProps) {
  const idsReady = isUuid(lessonId) && isUuid(userId)
  const draftKey = useMemo(() => `nodo360_note_draft_${lessonId}`, [lessonId])

  const [value, setValue] = useState(initialContent)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastCloudValueRef = useRef<string>('') // ultimo valor confirmado en servidor
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef<boolean>(false)

  // Mount/unmount guards
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  // Load initial note: local draft first (optimiza UX), luego server decide
  useEffect(() => {
    const draft = typeof window !== 'undefined' ? window.localStorage.getItem(draftKey) : null

    // Pintamos draft primero para UX instantanea
    if (draft != null) setValue(draft)

    if (!idsReady) {
      // si no hay sesion, seguimos en modo local
      lastCloudValueRef.current = draft ?? ''
      return
    }

    const controller = new AbortController()

    ;(async () => {
      try {
        if (!mountedRef.current) return
        setStatus('loading')
        setErrorMsg(null)

        const res = await fetch(`/api/notes?lessonId=${lessonId}`, {
          signal: controller.signal,
        })
        const json = await res.json().catch(() => ({}))

        if (!mountedRef.current) return
        if (!res.ok) {
          setStatus('idle')
          return
        }

        const serverContent: string | null =
          json?.note?.content != null ? String(json.note.content) : null

        // Regla Beta: SERVER MANDA
        if (serverContent != null) {
          setValue(serverContent)
          lastCloudValueRef.current = serverContent
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(draftKey)
          }
        } else {
          // No hay nota en server: si habia draft, lo mantenemos
          lastCloudValueRef.current = draft ?? ''
        }

        setStatus('idle')
      } catch (e: unknown) {
        if (!mountedRef.current) return
        if ((e as Error)?.name === 'AbortError') return
        setStatus('error')
        setErrorMsg(e instanceof Error ? e.message : 'Error cargando nota')
      }
    })()

    return () => controller.abort()
  }, [lessonId, draftKey, idsReady])

  // Save draft local on every change (modo offline/backup)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(draftKey, value)
    }
  }, [value, draftKey])

  const saveNote = useCallback(
    async (content: string) => {
      if (!idsReady) return
      if (content === lastCloudValueRef.current) return

      try {
        if (!mountedRef.current) return
        setStatus('saving')
        setErrorMsg(null)

        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            // Permitimos guardar vacio para "borrar" nota
            content,
          }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error ?? 'Error al guardar nota')

        lastCloudValueRef.current = content
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(draftKey)
        }

        if (!mountedRef.current) return
        setStatus('saved')

        if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return
          setStatus('idle')
        }, SAVED_BADGE_MS)
      } catch (e: unknown) {
        if (!mountedRef.current) return
        setStatus('error')
        setErrorMsg(e instanceof Error ? e.message : 'Error al guardar nota')
      }
    },
    [idsReady, lessonId, draftKey]
  )

  // Debounced auto-save on change
  useEffect(() => {
    if (!idsReady) return
    if (value === lastCloudValueRef.current) return

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      // Guardamos incluso vacio (permite borrar)
      saveNote(value)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [value, idsReady, saveNote])

  const dirty = value !== lastCloudValueRef.current

  const renderStatus = () => {
    if (status === 'loading') {
      return (
        <span className="flex items-center gap-1.5 text-white/40">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Cargando...
        </span>
      )
    }
    if (status === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-white/40">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Guardando...
        </span>
      )
    }
    if (status === 'saved') {
      return (
        <span className="flex items-center gap-1.5 text-success">
          <Check className="h-3.5 w-3.5" />
          Guardado
        </span>
      )
    }
    if (status === 'error') {
      return (
        <span className="flex items-center gap-1.5 text-error">
          <AlertCircle className="h-3.5 w-3.5" />
          Error
        </span>
      )
    }
    if (!idsReady) {
      return (
        <span className="flex items-center gap-1.5 text-warning">
          <Cloud className="h-3.5 w-3.5" />
          Solo local
        </span>
      )
    }
    if (dirty) {
      return (
        <span className="flex items-center gap-1.5 text-white/40">
          <Cloud className="h-3.5 w-3.5" />
          Sin guardar
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1.5 text-white/40">
        <Cloud className="h-3.5 w-3.5" />
        Sincronizado
      </span>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-white/50" />
          Mis notas
        </h4>
        <div className="text-xs">{renderStatus()}</div>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={idsReady ? 'Escribe aqui tus ideas clave...' : 'Inicia sesion para guardar tus notas en la nube.'}
        className="w-full min-h-[180px] rounded-xl border border-dark-border bg-dark-tertiary p-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-white/40 resize-none"
      />

      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{value.length} caracteres</span>
        <span>Auto-guardado activo</span>
      </div>

      {status === 'error' && errorMsg ? (
        <div className="text-xs rounded-xl border border-error/30 bg-error/10 p-3 text-error">
          Error: {errorMsg}
        </div>
      ) : null}
    </div>
  )
}

export default LessonNotes


