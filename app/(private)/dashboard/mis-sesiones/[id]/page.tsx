// app/(private)/dashboard/mis-sesiones/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'

type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
type SessionType = 'videocall' | 'chat' | 'task_review'

interface Educator {
  id: string
  display_name: string
  slug: string
  avatar_url: string | null
  type: 'instructor' | 'mentor'
  tagline: string | null
  user: { full_name: string } | null
}

interface Specialty {
  id: string
  name: string
  icon: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

interface Note {
  id: string
  content: string
  is_private: boolean
  created_at: string
  author_id: string
}

interface Session {
  id: string
  status: SessionStatus
  session_type: SessionType
  scheduled_at: string
  duration_minutes: number
  is_free_intro: boolean
  price_credits: number
  title: string | null
  description: string | null
  meeting_url: string | null
  student_notes: string | null
  educator_notes: string | null
  created_at: string
  educator: Educator | null
  specialty: Specialty | null
  review: Review[] | null
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const showReviewForm = searchParams.get('review') === '1'

  const [session, setSession] = useState<Session | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Review form
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Note form
  const [newNote, setNewNote] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  // Cancel
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadSession()
  }, [id])

  async function loadSession() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/dashboard/mis-sesiones/' + id)
      return
    }
    setUserId(user.id)

    // Cargar sesion
    const { data, error: sessionError } = await supabase
      .from('mentorship_sessions')
      .select(`
        *,
        educator:educator_id (
          id,
          display_name,
          slug,
          avatar_url,
          type,
          tagline,
          user:user_id (full_name)
        ),
        specialty:specialty_id (id, name, icon),
        review:session_reviews (id, rating, comment, created_at)
      `)
      .eq('id', id)
      .eq('student_id', user.id)
      .single()

    if (sessionError || !data) {
      console.error('Error cargando sesion:', sessionError)
      setError('No se encontro la sesion')
      setLoading(false)
      return
    }

    setSession(data as Session)

    // Cargar notas
    const { data: notesData } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    setNotes((notesData || []) as Note[])
    setLoading(false)
  }

  async function submitReview() {
    if (!session || submittingReview) return

    setSubmittingReview(true)
    try {
      const response = await fetch(`/api/mentorship/sessions/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al enviar valoracion')
      }

      // Recargar sesion
      await loadSession()
      setReviewComment('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al enviar valoracion')
    } finally {
      setSubmittingReview(false)
    }
  }

  async function submitNote() {
    if (!newNote.trim() || submittingNote) return

    setSubmittingNote(true)
    try {
      const response = await fetch(`/api/mentorship/sessions/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          is_private: false
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar nota')
      }

      setNewNote('')
      await loadSession()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar nota')
    } finally {
      setSubmittingNote(false)
    }
  }

  async function cancelSession() {
    if (cancelling) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/mentorship/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cancelar sesion')
      }

      await loadSession()
      setShowCancelConfirm(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar sesion')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusConfig: Record<SessionStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente de confirmacion', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    confirmed: { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    completed: { label: 'Completada', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  const sessionTypeLabels: Record<SessionType, string> = {
    videocall: 'Videollamada',
    chat: 'Chat',
    task_review: 'Revision de tarea'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando sesion...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-xl font-semibold mb-2">{error || 'Sesion no encontrada'}</h1>
          <Link href="/dashboard/mis-sesiones" className="text-blue-400 hover:underline">
            Volver a mis sesiones
          </Link>
        </div>
      </div>
    )
  }

  const config = statusConfig[session.status]
  const isMentor = session.educator?.type === 'mentor'
  const hasReview = session.review && session.review.length > 0
  const canReview = session.status === 'completed' && !hasReview
  const canCancel = session.status === 'pending'
  const canJoin = session.status === 'confirmed' && session.meeting_url

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/mis-sesiones" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver a mis sesiones
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Detalle de Sesion</h1>
            <span className={`text-sm px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
          {/* Educador */}
          <div className={`p-6 border-b border-white/10 ${isMentor ? 'bg-amber-900/10' : 'bg-blue-900/10'}`}>
            <div className="flex items-center gap-4">
              <Link href={`/formadores/${session.educator?.slug}`}>
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isMentor ? 'border-amber-500' : 'border-blue-500'} hover:scale-105 transition`}>
                  {session.educator?.avatar_url ? (
                    <img
                      src={session.educator.avatar_url}
                      alt={session.educator.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-2xl">
                      {session.educator?.display_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </Link>
              <div>
                <Link
                  href={`/formadores/${session.educator?.slug}`}
                  className="text-xl font-semibold hover:text-blue-400 transition"
                >
                  {session.educator?.display_name}
                </Link>
                <div className="flex items-center gap-2 text-sm">
                  <span className={isMentor ? 'text-amber-400' : 'text-blue-400'}>
                    {isMentor ? '🏆 Mentor' : '🎓 Instructor'}
                  </span>
                  {session.specialty && (
                    <span className="text-gray-400">
                      • {session.specialty.icon} {session.specialty.name}
                    </span>
                  )}
                </div>
                {session.educator?.tagline && (
                  <p className="text-sm text-gray-400 mt-1">{session.educator.tagline}</p>
                )}
              </div>
            </div>
          </div>

          {/* Detalles de la sesion */}
          <div className="p-6 space-y-4">
            {session.title && (
              <div>
                <h2 className="text-lg font-semibold">{session.title}</h2>
              </div>
            )}

            {session.description && (
              <p className="text-gray-300">{session.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tipo de sesion</span>
                <p className="font-medium">{sessionTypeLabels[session.session_type]}</p>
              </div>
              <div>
                <span className="text-gray-500">Duracion</span>
                <p className="font-medium">{session.duration_minutes} minutos</p>
              </div>
              <div>
                <span className="text-gray-500">Fecha programada</span>
                <p className="font-medium">{formatDate(session.scheduled_at)}</p>
              </div>
              <div>
                <span className="text-gray-500">Precio</span>
                <p className="font-medium">
                  {session.is_free_intro ? (
                    <span className="text-emerald-400">Gratis (sesion intro)</span>
                  ) : (
                    <span>{session.price_credits} creditos</span>
                  )}
                </p>
              </div>
            </div>

            {session.student_notes && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <span className="text-xs text-gray-500 uppercase">Notas del alumno</span>
                <p className="text-sm text-gray-300 mt-1">{session.student_notes}</p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
              {canJoin && (
                <a
                  href={session.meeting_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold transition"
                >
                  🎥 Unirse a la llamada
                </a>
              )}

              {canReview && (
                <button
                  onClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-lg font-semibold transition"
                >
                  ⭐ Valorar sesion
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-red-400 hover:text-red-300 px-4 py-2 transition"
                >
                  Cancelar sesion
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Confirmacion de cancelacion */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d1117] border border-white/10 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-2">Cancelar sesion?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Estas seguro de que deseas cancelar esta sesion? Esta accion no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
                >
                  No, mantener
                </button>
                <button
                  onClick={cancelSession}
                  disabled={cancelling}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelando...' : 'Si, cancelar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seccion de valoracion */}
        {(canReview || showReviewForm) && !hasReview && (
          <div id="review-section" className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">⭐ Valorar esta sesion</h3>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Tu puntuacion</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`text-3xl transition ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-600'} hover:scale-110`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comentario */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Comentario (opcional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Cuenta tu experiencia con esta sesion..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <button
              onClick={submitReview}
              disabled={submittingReview}
              className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {submittingReview ? 'Enviando...' : 'Enviar valoracion'}
            </button>
          </div>
        )}

        {/* Review existente */}
        {hasReview && session.review && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tu valoracion</h3>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${star <= session.review![0].rating ? 'text-yellow-400' : 'text-gray-600'}`}
                >
                  ★
                </span>
              ))}
            </div>
            {session.review[0].comment && (
              <p className="text-gray-300">{session.review[0].comment}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {formatDate(session.review[0].created_at)}
            </p>
          </div>
        )}

        {/* Notas de la sesion */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">📝 Notas de la sesion</h3>

          {notes.length === 0 && (
            <p className="text-gray-500 text-sm mb-4">No hay notas todavia.</p>
          )}

          {notes.length > 0 && (
            <div className="space-y-3 mb-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg ${note.author_id === userId ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'bg-white/5 border-l-2 border-amber-500'}`}
                >
                  <p className="text-sm text-gray-300">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{note.author_id === userId ? 'Tu' : 'Educador'}</span>
                    <span>•</span>
                    <span>{formatDate(note.created_at)}</span>
                    {note.is_private && <span className="text-yellow-500">• Privada</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario de nueva nota */}
          {(session.status === 'confirmed' || session.status === 'completed') && (
            <div className="pt-4 border-t border-white/10">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe una nota..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 mb-3"
              />
              <button
                onClick={submitNote}
                disabled={!newNote.trim() || submittingNote}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {submittingNote ? 'Guardando...' : 'Agregar nota'}
              </button>
            </div>
          )}
        </div>

        {/* Info de creacion */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Sesion creada el {formatDate(session.created_at)}
        </p>
      </div>
    </div>
  )
}
