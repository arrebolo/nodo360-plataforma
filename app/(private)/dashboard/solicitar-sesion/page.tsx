// app/(private)/dashboard/solicitar-sesion/page.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type SessionType = 'videocall' | 'chat' | 'task_review'

interface Specialty {
  id: string
  name: string
  slug: string
  icon: string
}

interface Educator {
  id: string
  display_name: string
  slug: string
  avatar_url: string | null
  type: 'instructor' | 'mentor'
  tagline: string | null
  hourly_rate_credits: number | null
  is_available: boolean
  intro_session_free: boolean
  rating_avg: number | null
  total_sessions: number
  specialties: Array<{ specialty: Specialty | null }>
}

interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface UserCredits {
  balance: number
}

function SolicitarSesionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedEducator = searchParams.get('educator')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [educators, setEducators] = useState<Educator[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [hasHadSession, setHasHadSession] = useState(false)

  // Form state
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('')
  const [selectedEducator, setSelectedEducator] = useState<string>('')
  const [sessionType, setSessionType] = useState<SessionType>('videocall')
  const [duration, setDuration] = useState(30)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isFreeIntro, setIsFreeIntro] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedEducator) {
      loadEducatorAvailability(selectedEducator)
      checkPreviousSessions(selectedEducator)
    }
  }, [selectedEducator])

  async function loadInitialData() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/dashboard/solicitar-sesion')
      return
    }

    // Cargar especialidades
    const { data: specialtiesData } = await supabase
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('order_index')

    setSpecialties((specialtiesData || []) as Specialty[])

    // Cargar educadores disponibles
    const { data: educatorsData } = await supabase
      .from('educators')
      .select(`
        id,
        display_name,
        slug,
        avatar_url,
        type,
        tagline,
        hourly_rate_credits,
        is_available,
        intro_session_free,
        rating_avg,
        total_sessions,
        specialties:educator_specialties (
          specialty:specialty_id (id, name, slug, icon)
        )
      `)
      .eq('status', 'active')
      .eq('is_available', true)
      .order('rating_avg', { ascending: false })

    const typedEducators = (educatorsData || []) as Educator[]
    setEducators(typedEducators)

    // Cargar creditos del usuario
    const creditsResponse = await fetch('/api/mentorship/credits')
    if (creditsResponse.ok) {
      const { data: creditsData } = await creditsResponse.json()
      setUserCredits(creditsData)
    }

    // Si hay educador preseleccionado
    if (preselectedEducator && typedEducators.length > 0) {
      const found = typedEducators.find(e => e.slug === preselectedEducator || e.id === preselectedEducator)
      if (found) {
        setSelectedEducator(found.id)
        setStep(2)
      }
    }

    setLoading(false)
  }

  async function loadEducatorAvailability(educatorId: string) {
    const response = await fetch(`/api/mentorship/availability?educator_id=${educatorId}`)
    if (response.ok) {
      const { data } = await response.json()
      setAvailability(data || [])
    }
  }

  async function checkPreviousSessions(educatorId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('mentorship_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('educator_id', educatorId)
      .neq('status', 'cancelled')

    setHasHadSession((count || 0) > 0)
  }

  async function submitRequest() {
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      // Construir fecha completa
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)

      const response = await fetch('/api/mentorship/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educator_id: selectedEducator,
          specialty_id: selectedSpecialty || null,
          session_type: sessionType,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: duration,
          is_free_intro: isFreeIntro,
          title: title || null,
          student_notes: description || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la sesion')
      }

      // Redirigir a la sesion creada
      router.push(`/dashboard/mis-sesiones/${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la sesion')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedEducatorData = educators.find(e => e.id === selectedEducator)
  const canUseFreeIntro = selectedEducatorData?.intro_session_free && !hasHadSession
  const priceCredits = isFreeIntro ? 0 : (selectedEducatorData?.hourly_rate_credits || 0) * (duration / 60)
  const hasEnoughCredits = (userCredits?.balance || 0) >= priceCredits

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

  const filteredEducators = selectedSpecialty
    ? educators.filter(e =>
        e.specialties.some(s => s.specialty?.id === selectedSpecialty)
      )
    : educators

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/mis-sesiones" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver a mis sesiones
          </Link>
          <h1 className="text-2xl font-bold">Solicitar Sesion</h1>
          <p className="text-gray-400 text-sm mt-1">
            Elige un formador y programa tu sesion de mentoria
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                  s <= step ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${s < step ? 'bg-blue-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Balance de creditos */}
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
          <span className="text-gray-400">Tu balance:</span>
          <span className="font-bold text-lg">
            💰 {userCredits?.balance || 0} creditos
          </span>
        </div>

        {/* Step 1: Elegir formador */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">1. Elige un formador</h2>

            {/* Filtro por especialidad */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filtrar por especialidad</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Todas las especialidades</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de educadores */}
            {filteredEducators.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No hay formadores disponibles con esa especialidad.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEducators.map((educator) => {
                  const isMentor = educator.type === 'mentor'
                  return (
                    <button
                      key={educator.id}
                      onClick={() => {
                        setSelectedEducator(educator.id)
                        setStep(2)
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition hover:-translate-y-0.5 ${
                        isMentor
                          ? 'bg-amber-900/10 border-amber-500/30 hover:border-amber-500/60'
                          : 'bg-white/5 border-white/10 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isMentor ? 'border-amber-500' : 'border-blue-500'}`}>
                          {educator.avatar_url ? (
                            <img
                              src={educator.avatar_url}
                              alt={educator.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xl">
                              {educator.display_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{educator.display_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isMentor ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {isMentor ? '🏆 Mentor' : '🎓 Instructor'}
                            </span>
                          </div>
                          {educator.tagline && (
                            <p className="text-sm text-gray-400 line-clamp-1">{educator.tagline}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {educator.rating_avg && Number(educator.rating_avg) > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-400">★</span>
                                {Number(educator.rating_avg).toFixed(1)}
                              </span>
                            )}
                            <span>{educator.total_sessions} sesiones</span>
                            <span className="text-blue-400">
                              {educator.hourly_rate_credits} creditos/h
                            </span>
                            {educator.intro_session_free && (
                              <span className="text-emerald-400">🎁 Intro gratis</span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-500">→</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Detalles de la sesion */}
        {step === 2 && selectedEducatorData && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">2. Detalles de la sesion</h2>

            {/* Educador seleccionado */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${selectedEducatorData.type === 'mentor' ? 'border-amber-500' : 'border-blue-500'}`}>
                {selectedEducatorData.avatar_url ? (
                  <img
                    src={selectedEducatorData.avatar_url}
                    alt={selectedEducatorData.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    {selectedEducatorData.display_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <span className="font-semibold">{selectedEducatorData.display_name}</span>
                <p className="text-sm text-gray-400">
                  {selectedEducatorData.hourly_rate_credits} creditos/hora
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedEducator('')
                  setStep(1)
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Cambiar
              </button>
            </div>

            {/* Tipo de sesion */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tipo de sesion</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'videocall', label: '📹 Videollamada', desc: 'Sesion en vivo' },
                  { value: 'chat', label: '💬 Chat', desc: 'Por mensajes' },
                  { value: 'task_review', label: '📝 Revision', desc: 'De tarea/proyecto' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSessionType(type.value as SessionType)}
                    className={`p-4 rounded-xl border text-center transition ${
                      sessionType === type.value
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.label}</div>
                    <div className="text-xs text-gray-400">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duracion */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Duracion</label>
              <div className="grid grid-cols-3 gap-3">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`p-3 rounded-xl border text-center transition ${
                      duration === d
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold">{d} min</div>
                    <div className="text-xs text-gray-400">
                      {Math.round((selectedEducatorData.hourly_rate_credits || 0) * (d / 60))} creditos
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sesion intro gratis */}
            {canUseFreeIntro && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFreeIntro}
                    onChange={(e) => {
                      setIsFreeIntro(e.target.checked)
                      if (e.target.checked) setDuration(30)
                    }}
                    className="w-5 h-5 rounded border-emerald-500 bg-transparent text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-emerald-400">🎁 Usar sesion introductoria gratis</span>
                    <p className="text-sm text-gray-400">Primera sesion de 30 minutos sin costo</p>
                  </div>
                </label>
              </div>
            )}

            {/* Especialidad */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Especialidad (opcional)</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Sin especificar</option>
                {selectedEducatorData.specialties
                  .filter(s => s.specialty)
                  .map((s) => (
                    <option key={s.specialty!.id} value={s.specialty!.id}>
                      {s.specialty!.icon} {s.specialty!.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                Atras
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fecha y confirmacion */}
        {step === 3 && selectedEducatorData && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">3. Fecha y confirmacion</h2>

            {/* Disponibilidad del educador */}
            {availability.length > 0 && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-sm text-gray-400 mb-2">Disponibilidad del formador:</h3>
                <div className="flex flex-wrap gap-2">
                  {availability.map((slot) => (
                    <span key={slot.id} className="text-xs bg-white/10 px-2 py-1 rounded">
                      {dayNames[slot.day_of_week]} {slot.start_time} - {slot.end_time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Hora</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Titulo */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Titulo de la sesion (opcional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Consulta sobre Lightning Network"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Descripcion */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Describe lo que quieres tratar</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica brevemente el tema o las dudas que tienes..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Resumen */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <h3 className="font-semibold mb-3">Resumen de la solicitud</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Formador:</span>
                <span>{selectedEducatorData.display_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tipo:</span>
                <span>{sessionType === 'videocall' ? 'Videollamada' : sessionType === 'chat' ? 'Chat' : 'Revision'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duracion:</span>
                <span>{duration} minutos</span>
              </div>
              {selectedDate && selectedTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fecha:</span>
                  <span>{new Date(`${selectedDate}T${selectedTime}`).toLocaleString('es-ES')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-gray-400">Precio:</span>
                <span className={`font-bold ${isFreeIntro ? 'text-emerald-400' : ''}`}>
                  {isFreeIntro ? '🎁 Gratis' : `${priceCredits} creditos`}
                </span>
              </div>
            </div>

            {/* Error de creditos */}
            {!isFreeIntro && !hasEnoughCredits && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                <p className="font-semibold mb-1">Creditos insuficientes</p>
                <p className="text-sm">
                  Necesitas {priceCredits} creditos pero solo tienes {userCredits?.balance || 0}.
                </p>
              </div>
            )}

            {/* Error general */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                Atras
              </button>
              <button
                onClick={submitRequest}
                disabled={!selectedDate || !selectedTime || (!isFreeIntro && !hasEnoughCredits) || submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white rounded-lg font-semibold transition disabled:opacity-50 hover:opacity-90"
              >
                {submitting ? 'Enviando solicitud...' : 'Solicitar Sesion'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SolicitarSesionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <SolicitarSesionContent />
    </Suspense>
  )
}
