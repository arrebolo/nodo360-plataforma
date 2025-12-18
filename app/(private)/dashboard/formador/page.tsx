// app/(private)/dashboard/formador/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel de Formador | Nodo360',
  description: 'Gestiona tus sesiones de mentoria como instructor o mentor en Nodo360'
}

interface Student {
  id: string
  full_name: string
  avatar_url: string | null
  email: string
}

interface Specialty {
  id: string
  name: string
  icon: string
}

interface Session {
  id: string
  status: string
  session_type: string
  scheduled_at: string
  duration_minutes: number
  is_free_intro: boolean
  price_credits: number
  title: string | null
  student: Student | null
  specialty: Specialty | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  session: {
    student: {
      full_name: string
      avatar_url: string | null
    } | null
  } | null
}

export default async function FormadorDashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?redirect=/dashboard/formador')
  }

  console.log('[FormadorDashboard] Cargando datos del formador:', user.id)

  // Verificar que es educador
  const { data: educator, error: educatorError } = await supabase
    .from('educators')
    .select(`
      *,
      specialties:educator_specialties (
        specialty:specialty_id (id, name, icon)
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (educatorError || !educator) {
    console.log('[FormadorDashboard] Usuario no es educador')
    redirect('/dashboard/ser-formador')
  }

  // Obtener sesiones
  const { data: sessions } = await supabase
    .from('mentorship_sessions')
    .select(`
      *,
      student:student_id (id, full_name, avatar_url, email),
      specialty:specialty_id (id, name, icon)
    `)
    .eq('educator_id', educator.id)
    .order('scheduled_at', { ascending: true })

  const safeSessions = (sessions || []) as Session[]

  // Agrupar sesiones
  const pendientes = safeSessions.filter(s => s.status === 'pending')
  const confirmadas = safeSessions.filter(s => s.status === 'confirmed')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const proximasSemana = confirmadas.filter(s => {
    const fecha = new Date(s.scheduled_at)
    const enUnaSemana = new Date(hoy)
    enUnaSemana.setDate(enUnaSemana.getDate() + 7)
    return fecha >= hoy && fecha <= enUnaSemana
  })

  // Obtener reviews recientes
  const { data: recentReviews } = await supabase
    .from('session_reviews')
    .select(`
      *,
      session:session_id (
        student:student_id (full_name, avatar_url)
      )
    `)
    .in('session_id', safeSessions.map(s => s.id))
    .order('created_at', { ascending: false })
    .limit(5)

  const safeReviews = (recentReviews || []) as Review[]

  const isMentor = educator.type === 'mentor'

  console.log('[FormadorDashboard] Datos cargados')

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${isMentor ? 'border-amber-500' : 'border-blue-500'}`}>
              {educator.avatar_url ? (
                <img src={educator.avatar_url} alt="" className="w-full h-full object-cover" />
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
              <p className="text-gray-400 text-sm">Panel de formador</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/formadores/${educator.slug}`}
              target="_blank"
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              Ver perfil publico
            </Link>
            <Link
              href="/dashboard/formador/perfil"
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              Editar perfil
            </Link>
          </div>
        </div>

        {/* Estado de disponibilidad */}
        <div className={`mb-8 p-4 rounded-xl border ${educator.is_available ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${educator.is_available ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className={educator.is_available ? 'text-emerald-300' : 'text-red-300'}>
                {educator.is_available ? 'Disponible para nuevas sesiones' : 'No disponible'}
              </span>
            </div>
            <Link
              href="/dashboard/formador/disponibilidad"
              className="text-sm text-gray-400 hover:text-white"
            >
              Gestionar disponibilidad →
            </Link>
          </div>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{pendientes.length}</div>
            <div className="text-xs text-gray-400">Pendientes</div>
            <div className="text-[10px] text-yellow-400/70 mt-1">Requieren accion</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-emerald-400">{proximasSemana.length}</div>
            <div className="text-xs text-gray-400">Esta semana</div>
            <div className="text-[10px] text-emerald-400/70 mt-1">Sesiones confirmadas</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-400">{educator.total_sessions || 0}</div>
            <div className="text-xs text-gray-400">Total sesiones</div>
            <div className="text-[10px] text-blue-400/70 mt-1">{educator.total_students || 0} alumnos</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-3xl font-bold text-amber-400">
                {Number(educator.rating_avg || 0).toFixed(1)}
              </span>
            </div>
            <div className="text-xs text-gray-400">Valoracion</div>
            <div className="text-[10px] text-amber-400/70 mt-1">{educator.total_reviews || 0} reviews</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sesiones pendientes de confirmar */}
            {pendientes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-yellow-400">
                    Pendientes de confirmar ({pendientes.length})
                  </h2>
                  <Link href="/dashboard/formador/sesiones?status=pending" className="text-sm text-gray-400 hover:text-white">
                    Ver todas →
                  </Link>
                </div>
                <div className="space-y-3">
                  {pendientes.slice(0, 3).map(session => (
                    <div
                      key={session.id}
                      className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                            {session.student?.avatar_url ? (
                              <img src={session.student.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">
                                {session.student?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{session.student?.full_name}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(session.scheduled_at).toLocaleString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {' - '}
                              {session.duration_minutes} min
                              {session.is_free_intro && ' - Intro gratis'}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/formador/sesiones/${session.id}`}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm px-4 py-2 rounded-lg font-medium transition"
                        >
                          Gestionar
                        </Link>
                      </div>
                      {session.title && (
                        <div className="mt-2 text-sm text-gray-300">
                          {session.title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Proximas sesiones */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-emerald-400">
                  Proximas sesiones ({confirmadas.length})
                </h2>
                <Link href="/dashboard/formador/sesiones?status=confirmed" className="text-sm text-gray-400 hover:text-white">
                  Ver todas →
                </Link>
              </div>

              {confirmadas.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
                  <p>No tienes sesiones confirmadas proximamente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {confirmadas.slice(0, 5).map(session => {
                    const isPast = new Date(session.scheduled_at) < new Date()
                    return (
                      <div
                        key={session.id}
                        className={`bg-white/5 border border-white/10 rounded-xl p-4 ${isPast ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                              {session.student?.avatar_url ? (
                                <img src={session.student.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm">
                                  {session.student?.full_name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{session.student?.full_name}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(session.scheduled_at).toLocaleString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {' - '}
                                {session.session_type === 'videocall' && 'Videollamada'}
                                {session.session_type === 'chat' && 'Chat'}
                                {session.session_type === 'task_review' && 'Revision'}
                                {' '}
                                {session.duration_minutes} min
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/formador/sesiones/${session.id}`}
                            className="text-sm text-gray-400 hover:text-white"
                          >
                            Detalles →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Reviews recientes */}
            {safeReviews.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Valoraciones recientes</h2>
                <div className="space-y-3">
                  {safeReviews.map((review) => (
                    <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                          {review.session?.student?.avatar_url ? (
                            <img src={review.session.student.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">
                              {review.session?.student?.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{review.session?.student?.full_name}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-300 mt-1">{review.comment}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(review.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Acciones rapidas */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Acciones rapidas</h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard/formador/sesiones"
                  className="block w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition text-sm"
                >
                  Gestionar sesiones
                </Link>
                <Link
                  href="/dashboard/formador/disponibilidad"
                  className="block w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition text-sm"
                >
                  Configurar horarios
                </Link>
                <Link
                  href="/dashboard/formador/perfil"
                  className="block w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition text-sm"
                >
                  Editar perfil
                </Link>
              </div>
            </div>

            {/* Especialidades */}
            {educator.specialties && educator.specialties.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold mb-4">Mis especialidades</h3>
                <div className="space-y-2">
                  {educator.specialties.map((s: { specialty: Specialty | null }) => (
                    <div key={s.specialty?.id} className="flex items-center gap-2 text-sm">
                      <span>{s.specialty?.icon}</span>
                      <span className="text-gray-300">{s.specialty?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tarifas */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Mi tarifa</h3>
              <div className="text-2xl font-bold text-[#f7931a]">
                {educator.hourly_rate_credits || 0} <span className="text-sm font-normal text-gray-400">creditos/hora</span>
              </div>
              {educator.offers_free_intro && (
                <div className="text-sm text-emerald-400 mt-2">
                  Ofrezco {educator.free_intro_minutes || 10} min gratis
                </div>
              )}
              <Link
                href="/dashboard/formador/perfil"
                className="text-xs text-gray-400 hover:text-white mt-3 inline-block"
              >
                Modificar tarifa →
              </Link>
            </div>

            {/* Info mentor */}
            {isMentor && (
              <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>
                  <h3 className="font-semibold text-amber-300">Estatus Mentor</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Puntos comunidad</span>
                    <span className="text-amber-400">{educator.community_score || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contribuciones</span>
                    <span className="text-amber-400">{educator.community_contributions || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
