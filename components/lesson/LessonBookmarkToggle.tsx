'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'

interface LessonBookmarkToggleProps {
  lessonId: string
  courseSlug: string
}

export default function LessonBookmarkToggle({
  lessonId,
  courseSlug,
}: LessonBookmarkToggleProps) {
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBookmark = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('[Bookmark] Error cargando bookmark:', error)
        }

        if (data) {
          setBookmarked(true)
          setBookmarkId((data as { id: string }).id)
        }
      } finally {
        setLoading(false)
      }
    }

    loadBookmark()
  }, [lessonId])

  const toggleBookmark = async () => {
    setToggling(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Debes iniciar sesión para guardar esta lección.')
        setToggling(false)
        return
      }

      if (bookmarked && bookmarkId) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId)
          .eq('user_id', user.id)

        if (error) {
          console.error('[Bookmark] Error eliminando:', error)
          setError('No se pudo quitar la marca.')
        } else {
          setBookmarked(false)
          setBookmarkId(null)
        }
      } else {
        const { data, error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
          } as any)
          .select('id')
          .single()

        if (error) {
          console.error('[Bookmark] Error creando:', error)
          setError('No se pudo guardar la lección.')
        } else if (data) {
          setBookmarked(true)
          setBookmarkId((data as { id: string }).id)
        }
      }
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-white/60" />
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            {bookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                Lección guardada
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-[#f7931a]" />
                Guardar para revisar
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-white/60">
            Marca esta lección para volver rápido desde tu panel en el futuro.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-300">
          ⚠️ {error}
        </p>
      )}

      <button
        type="button"
        onClick={toggleBookmark}
        disabled={toggling}
        className={`mt-3 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
          bookmarked
            ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-100 hover:bg-emerald-500/30'
            : 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white hover:opacity-90'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {toggling ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Actualizando...
          </>
        ) : bookmarked ? (
          <>
            <BookmarkCheck className="w-3 h-3" />
            Quitar marca
          </>
        ) : (
          <>
            <Bookmark className="w-3 h-3" />
            Guardar lección
          </>
        )}
      </button>
    </div>
  )
}
