// app/(private)/dashboard/formador/sesiones/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'

interface Student {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

interface Specialty {
  id: string
  name: string
  icon: string
  description: string | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

interface Educator {
  id: string
  display_name: string
  user_id: string
}

interface Session {
  id: string
  status: string
  session_type: string
  scheduled_at: string
  duration_minutes: number
  is_free_intro: boolean
  price_credits: number
  payment_type: string
  title: string | null
  description: string | null
  meeting_url: string | null
  educator_notes: string | null
  cancellation_reason: string | null
  created_at: string
  completed_at: string | null
  cancelled_at: string | null
  educator: Educator | null
  student: Student | null
  specialty: Specialty | null
  review: Review[] | null
}

export default function FormadorSesionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form para confirmar
  const [meetingUrl, setMeetingUrl] = useState('')

  useEffect(() => {
    loadSession()
  }, [id])

  const loadSession = async () => {
    setLoading(true)

    const { data, error: queryError } = await supabase
      .from('mentorship_sessions')
      .select(`
        *,
        educator:educator_id (
          id, display_name, user_id
        ),
        student:student_id (id, full_name, email, avatar_url),
        specialty:specialty_id (id, name, icon, description),
        review:session_reviews (id, rating, comment, created_at)
      `)
      .eq('id', id)
      .single()

    if (queryError) {
      setError('Sesion no encontrada')
    } else {
      const typedSession = data as Session
      setSession(typedSession)
      setMeetingUrl(typedSession.meeting_url || '')
    }

    setLoading(false)
  }

  const updateSession = async (status: string, additionalData: Record<string, unknown> = {}) => {
    setActionLoading(true)
    setError(null)

    const response = await fetch(`/api/mentorship/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...additionalData })
    })

    if (response.ok) {
      await loadSession()
    } else {
      const data = await response.json()
      setError(data.error || 'Error al actualizar')
    }

    setActionLoading(false)
  }

  const confirmSession = () => {
    if (!meetingUrl && session?.session_type === 'videocall') {
      setError('Por favor ingresa el enlace de la videollamada')
      return
    }
    updateSession('confirmed', { meeting_url: meetingUrl })
  }

  const completeSession = () => {
    updateSession('completed')
  }

  const cancelSession = () => {
    if (!confirm('Estas seguro de cancelar esta sesion?')) return
    updateSession('cancelled', { cancellation_reason: 'Cancelado por el formador' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando sesion...</p>
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard/formador/sesiones" className="text-blue-400 hover:underline">
            Volver a sesiones
          </Link>
        </div>
      </div>
    )
  }

  if (!session) return null

  const isPast = new Date(session.scheduled_at) < new Date()
  const hasReview = session.review && session.review.length > 0

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente de confirmacion', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    confirmed: { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    completed: { label: 'Completada', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  const config = statusConfig[session.status]

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link href="/dashboard/formador/sesiones" className="text-sm text-gray-400 hover:text-white mb-4 inline-block">
          ← Volver a sesiones
        </Link>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Header con estado */}
        <div className={`${config.bg} rounded-xl p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </span>
            <span className="text-sm text-gray-400">
              ID: {session.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info del alumno */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-sm text-gray-400 mb-3">Alumno</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700">
                  {session.student?.avatar_url ? (
                    <img src={session.student.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {session.student?.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xl font-semibold">{session.student?.full_name}</div>
                  <div className="text-gray-400">{session.student?.email}</div>
                </div>
              </div>
            </div>

            {/* Detalles de la sesion */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Detalles de la sesion</h2>

              {session.title && (
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{session.title}</h3>
                </div>
              )}

              {session.description && (
                <div className="mb-4 p-4 bg-black/20 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Lo que el alumno quiere tratar:</p>
                  <p className="text-gray-200">{session.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Tipo</span>
                  <p className="font-medium">
                    {session.session_type === 'videocall' && 'Videollamada'}
                    {session.session_type === 'chat' && 'Chat'}
                    {session.session_type === 'task_review' && 'Revision de tareas'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Duracion</span>
                  <p className="font-medium">{session.duration_minutes} minutos</p>
                </div>
                <div>
                  <span className="text-gray-400">Fecha y hora</span>
                  <p className="font-medium">{formatDate(session.scheduled_at)}</p>
                </div>
                {session.specialty && (
                  <div>
                    <span className="text-gray-400">Especialidad</span>
                    <p className="font-medium">{session.specialty.icon} {session.specialty.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones segun estado */}
            {session.status === 'pending' && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-yellow-400 mb-4">Accion requerida</h2>
                <p className="text-gray-300 mb-4">
                  El alumno ha solicitado esta sesion. Por favor confirma o rechaza.
                </p>

                {session.session_type === 'videocall' && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">
                      Enlace de videollamada (Google Meet, Zoom, etc.)
                    </label>
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={confirmSession}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Procesando...' : 'Confirmar sesion'}
                  </button>
                  <button
                    onClick={cancelSession}
                    disabled={actionLoading}
                    className="px-6 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {session.status === 'confirmed' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-emerald-400 mb-4">Sesion confirmada</h2>

                {session.meeting_url && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Enlace de la sesion:</p>
                    <a
                      href={session.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline break-all"
                    >
                      {session.meeting_url}
                    </a>
                  </div>
                )}

                {isPast && (
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <p className="text-gray-300 mb-3">
                      La fecha de la sesion ya paso. Se completo correctamente?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={completeSession}
                        disabled={actionLoading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {actionLoading ? 'Procesando...' : 'Marcar como completada'}
                      </button>
                      <button
                        onClick={cancelSession}
                        disabled={actionLoading}
                        className="px-4 py-2 text-red-400 hover:text-red-300 transition disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {session.status === 'completed' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Sesion completada</h2>
                {hasReview ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Valoracion del alumno:</p>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`text-xl ${star <= session.review![0].rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                      ))}
                    </div>
                    {session.review![0].comment && (
                      <p className="text-gray-300 italic">"{session.review![0].comment}"</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">El alumno aun no ha dejado valoracion.</p>
                )}
              </div>
            )}

            {session.status === 'cancelled' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-red-400 mb-2">Sesion cancelada</h2>
                {session.cancellation_reason && (
                  <p className="text-gray-400">Motivo: {session.cancellation_reason}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen de pago */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-3">Pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo</span>
                  <span>
                    {session.is_free_intro ? 'Intro gratis' :
                     session.payment_type === 'credits' ? 'Creditos' :
                     session.payment_type === 'premium' ? 'Premium' : 'Gratis'}
                  </span>
                </div>
                {!session.is_free_intro && session.price_credits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creditos</span>
                    <span className="text-[#f7931a] font-medium">{session.price_credits}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-3">Fechas</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  <span className="text-white">Solicitada:</span>{' '}
                  {new Date(session.created_at).toLocaleDateString('es-ES')}
                </p>
                {session.completed_at && (
                  <p>
                    <span className="text-white">Completada:</span>{' '}
                    {new Date(session.completed_at).toLocaleDateString('es-ES')}
                  </p>
                )}
                {session.cancelled_at && (
                  <p>
                    <span className="text-white">Cancelada:</span>{' '}
                    {new Date(session.cancelled_at).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
