// app/(private)/admin/formadores/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'

interface User {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
}

interface Specialty {
  id: string
  name: string
  icon: string
  description: string | null
}

interface EducatorSpecialty {
  level: string | null
  exam_score: number | null
  verified_at: string | null
  specialty: Specialty | null
}

interface Achievement {
  id: string
  type: string
  title: string
  awarded_at: string
}

interface Educator {
  id: string
  display_name: string
  slug: string
  tagline: string | null
  bio: string | null
  avatar_url: string | null
  type: string
  status: string
  rating_avg: number | null
  total_sessions: number
  total_students: number
  total_reviews: number
  community_score: number | null
  hourly_rate_credits: number | null
  is_available: boolean
  created_at: string
  verified_at: string | null
  promoted_to_mentor_at: string | null
  user: User | null
  specialties: EducatorSpecialty[]
  achievements: Achievement[]
}

export default function AdminFormadorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [educator, setEducator] = useState<Educator | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEducator()
  }, [id])

  const loadEducator = async () => {
    setLoading(true)

    const { data, error: queryError } = await supabase
      .from('educators')
      .select(`
        *,
        user:user_id (id, full_name, email, avatar_url, created_at),
        specialties:educator_specialties (
          level,
          exam_score,
          verified_at,
          specialty:specialty_id (id, name, icon, description)
        ),
        achievements:educator_achievements (id, type, title, awarded_at)
      `)
      .eq('id', id)
      .single()

    if (queryError) {
      setError('Formador no encontrado')
    } else {
      setEducator(data as Educator)
    }

    setLoading(false)
  }

  const updateStatus = async (status: string) => {
    if (!confirm(`Cambiar estado a "${status}"?`)) return

    setActionLoading(true)

    const updates: Record<string, unknown> = { status }

    if (status === 'active' && educator?.status === 'pending') {
      updates.verified_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('educators' as never)
      .update(updates as never)
      .eq('id', id)

    if (!updateError) {
      await loadEducator()
    } else {
      setError('Error al actualizar estado')
    }

    setActionLoading(false)
  }

  const promoteToMentor = async () => {
    if (!confirm('Promover a Mentor? Esta accion sera registrada.')) return

    setActionLoading(true)

    // Actualizar tipo
    await supabase
      .from('educators' as never)
      .update({
        type: 'mentor',
        promoted_to_mentor_at: new Date().toISOString()
      } as never)
      .eq('id', id)

    // Registrar promocion
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('educator_promotions' as never)
      .insert({
        educator_id: id,
        from_type: 'instructor',
        to_type: 'mentor',
        reason: 'Promocion por administrador',
        promoted_by: user?.id
      } as never)

    await loadEducator()
    setActionLoading(false)
  }

  const demoteToInstructor = async () => {
    if (!confirm('Degradar a Instructor? Esta accion sera registrada.')) return

    setActionLoading(true)

    await supabase
      .from('educators' as never)
      .update({
        type: 'instructor',
        demoted_from_mentor_at: new Date().toISOString()
      } as never)
      .eq('id', id)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('educator_promotions' as never)
      .insert({
        educator_id: id,
        from_type: 'mentor',
        to_type: 'instructor',
        reason: 'Degradacion por administrador',
        promoted_by: user?.id
      } as never)

    await loadEducator()
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !educator) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/admin/formadores" className="text-blue-400 hover:underline">
            Volver a formadores
          </Link>
        </div>
      </div>
    )
  }

  const isMentor = educator.type === 'mentor'

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
    active: { label: 'Activo', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
    inactive: { label: 'Inactivo', color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30' },
    suspended: { label: 'Suspendido', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' }
  }

  const config = statusConfig[educator.status]

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link href="/admin/formadores" className="text-sm text-gray-400 hover:text-white mb-4 inline-block">
          ← Volver a formadores
        </Link>

        {/* Perfil */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${isMentor ? 'border-amber-500' : 'border-blue-500'}`}>
                {educator.avatar_url || educator.user?.avatar_url ? (
                  <img
                    src={educator.avatar_url || educator.user?.avatar_url || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-2xl">
                    {educator.display_name?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{educator.display_name}</h1>
                  <span className={`text-xs px-2 py-1 rounded-full ${isMentor ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {isMentor ? 'MENTOR' : 'INSTRUCTOR'}
                  </span>
                </div>
                <p className="text-gray-400">{educator.user?.email}</p>
                {educator.tagline && (
                  <p className="text-sm text-gray-300 mt-1">{educator.tagline}</p>
                )}
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border ${config.bg}`}>
              <span className={config.color}>{config.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {educator.bio && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="font-semibold mb-3">Biografia</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{educator.bio}</p>
              </div>
            )}

            {/* Especialidades */}
            {educator.specialties && educator.specialties.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="font-semibold mb-4">Especialidades</h2>
                <div className="space-y-3">
                  {educator.specialties.map((s) => (
                    <div key={s.specialty?.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{s.specialty?.icon}</span>
                        <div>
                          <div className="font-medium">{s.specialty?.name}</div>
                          <div className="text-xs text-gray-400">
                            Nivel: {s.level || 'Sin verificar'}
                            {s.exam_score && ` - Examen: ${s.exam_score}%`}
                          </div>
                        </div>
                      </div>
                      {s.verified_at ? (
                        <span className="text-xs text-emerald-400">Verificado</span>
                      ) : (
                        <span className="text-xs text-yellow-400">Pendiente</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Estadisticas</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{educator.total_sessions || 0}</div>
                  <div className="text-xs text-gray-400">Sesiones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{educator.total_students || 0}</div>
                  <div className="text-xs text-gray-400">Alumnos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <span className="text-yellow-400">★</span>
                    {Number(educator.rating_avg || 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">{educator.total_reviews || 0} reviews</div>
                </div>
                {isMentor && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{educator.community_score || 0}</div>
                    <div className="text-xs text-gray-400">Puntos comunidad</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Acciones */}
          <div className="space-y-6">
            {/* Cambiar estado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Cambiar estado</h3>
              <div className="space-y-2">
                {educator.status !== 'active' && (
                  <button
                    onClick={() => updateStatus('active')}
                    disabled={actionLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    Activar
                  </button>
                )}
                {educator.status !== 'inactive' && educator.status !== 'pending' && (
                  <button
                    onClick={() => updateStatus('inactive')}
                    disabled={actionLoading}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    Desactivar
                  </button>
                )}
                {educator.status !== 'suspended' && (
                  <button
                    onClick={() => updateStatus('suspended')}
                    disabled={actionLoading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    Suspender
                  </button>
                )}
              </div>
            </div>

            {/* Promocion / Degradacion */}
            {educator.status === 'active' && (
              <div className={`border rounded-xl p-5 ${isMentor ? 'bg-blue-500/10 border-blue-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <h3 className="font-semibold mb-4">
                  {isMentor ? 'Degradar' : 'Promocionar'}
                </h3>
                {isMentor ? (
                  <>
                    <p className="text-sm text-gray-400 mb-3">
                      Degradar a Instructor quitara el estatus de Mentor.
                    </p>
                    <button
                      onClick={demoteToInstructor}
                      disabled={actionLoading}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50"
                    >
                      Degradar a Instructor
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-3">
                      Promocionar a Mentor otorga el maximo estatus en Nodo360.
                    </p>
                    <button
                      onClick={promoteToMentor}
                      disabled={actionLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    >
                      Promocionar a Mentor
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Info adicional */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-3">Informacion</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  <span className="text-white">Registrado:</span>{' '}
                  {new Date(educator.created_at).toLocaleDateString('es-ES')}
                </p>
                {educator.verified_at && (
                  <p>
                    <span className="text-white">Verificado:</span>{' '}
                    {new Date(educator.verified_at).toLocaleDateString('es-ES')}
                  </p>
                )}
                {educator.promoted_to_mentor_at && (
                  <p>
                    <span className="text-white">Mentor desde:</span>{' '}
                    {new Date(educator.promoted_to_mentor_at).toLocaleDateString('es-ES')}
                  </p>
                )}
                <p>
                  <span className="text-white">Tarifa:</span>{' '}
                  {educator.hourly_rate_credits || 0} creditos/hora
                </p>
                <p>
                  <span className="text-white">Disponible:</span>{' '}
                  {educator.is_available ? 'Si' : 'No'}
                </p>
              </div>
            </div>

            {/* Ver perfil publico */}
            <Link
              href={`/formadores/${educator.slug}`}
              target="_blank"
              className="block w-full text-center bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm transition"
            >
              Ver perfil publico
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
