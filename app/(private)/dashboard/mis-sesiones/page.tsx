// app/(private)/dashboard/mis-sesiones/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mis Sesiones | Nodo360',
  description: 'Gestiona tus sesiones de mentoria en Nodo360'
}

type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
type SessionType = 'videocall' | 'chat' | 'task_review'

interface Educator {
  id: string
  display_name: string
  slug: string
  avatar_url: string | null
  type: 'instructor' | 'mentor'
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
  educator: Educator | null
  specialty: Specialty | null
  review: Review[] | null
}

export default async function MisSesionesPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?redirect=/dashboard/mis-sesiones')
  }

  console.log('🔍 [MisSesiones] Cargando sesiones del usuario:', user.id)

  // Obtener todas las sesiones del alumno
  const { data: sessions, error } = await supabase
    .from('mentorship_sessions')
    .select(`
      *,
      educator:educator_id (
        id,
        display_name,
        slug,
        avatar_url,
        type,
        user:user_id (full_name)
      ),
      specialty:specialty_id (id, name, icon),
      review:session_reviews (id, rating)
    `)
    .eq('student_id', user.id)
    .order('scheduled_at', { ascending: false })

  if (error) {
    console.error('❌ [MisSesiones] Error:', error)
  }

  const safeSessions = (sessions || []) as Session[]

  // Agrupar por estado
  const pendientes = safeSessions.filter(s => s.status === 'pending')
  const confirmadas = safeSessions.filter(s => s.status === 'confirmed')
  const completadas = safeSessions.filter(s => s.status === 'completed')
  const canceladas = safeSessions.filter(s => s.status === 'cancelled')

  console.log('✅ [MisSesiones] Encontradas:', safeSessions.length)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusConfig: Record<SessionStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    confirmed: { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    completed: { label: 'Completada', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  const sessionTypeLabels: Record<SessionType, string> = {
    videocall: '📹 Videollamada',
    chat: '💬 Chat',
    task_review: '📝 Revision'
  }

  const SessionCard = ({ session }: { session: Session }) => {
    const config = statusConfig[session.status]
    const isMentor = session.educator?.type === 'mentor'
    const hasReview = session.review && session.review.length > 0

    return (
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition">
        {/* Header con estado */}
        <div className={`px-4 py-2 ${config.bg} flex items-center justify-between`}>
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-gray-400">
            {sessionTypeLabels[session.session_type]}
          </span>
        </div>

        <div className="p-4">
          {/* Educador */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isMentor ? 'border-amber-500' : 'border-blue-500'}`}>
              {session.educator?.avatar_url ? (
                <img
                  src={session.educator.avatar_url}
                  alt={session.educator.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xl">
                  {session.educator?.display_name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <Link
                href={`/formadores/${session.educator?.slug}`}
                className="font-semibold hover:text-blue-400 transition"
              >
                {session.educator?.display_name}
              </Link>
              <div className="flex items-center gap-2 text-xs">
                <span className={isMentor ? 'text-amber-400' : 'text-blue-400'}>
                  {isMentor ? '🏆 Mentor' : '🎓 Instructor'}
                </span>
                {session.specialty && (
                  <span className="text-gray-400">
                    • {session.specialty.icon} {session.specialty.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Titulo y descripcion */}
          {session.title && (
            <h3 className="font-medium mb-1">{session.title}</h3>
          )}
          {session.description && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
              {session.description}
            </p>
          )}

          {/* Fecha y duracion */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
            <span>📅 {formatDate(session.scheduled_at)}</span>
            <span>⏱ {session.duration_minutes} min</span>
            {session.is_free_intro && (
              <span className="text-emerald-400">🎁 Gratis</span>
            )}
          </div>

          {/* Precio */}
          {!session.is_free_intro && session.price_credits > 0 && (
            <div className="text-sm text-gray-400 mb-3">
              💰 {session.price_credits} creditos
            </div>
          )}

          {/* Acciones segun estado */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
            <Link
              href={`/dashboard/mis-sesiones/${session.id}`}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
            >
              Ver detalles
            </Link>

            {session.status === 'confirmed' && session.meeting_url && (
              <a
                href={session.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition"
              >
                🎥 Unirse a la llamada
              </a>
            )}

            {session.status === 'completed' && !hasReview && (
              <Link
                href={`/dashboard/mis-sesiones/${session.id}?review=1`}
                className="text-sm bg-amber-500 hover:bg-amber-600 text-black px-3 py-1.5 rounded-lg transition"
              >
                ⭐ Valorar sesion
              </Link>
            )}

            {session.status === 'pending' && (
              <button className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 transition">
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
              ← Volver al Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Mis Sesiones de Mentoria</h1>
            <p className="text-gray-400 text-sm mt-1">
              {safeSessions.length} sesiones en total
            </p>
          </div>
          <Link
            href="/dashboard/solicitar-sesion"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition"
          >
            ➕ Nueva Sesion
          </Link>
        </div>

        {/* Stats rapidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{pendientes.length}</div>
            <div className="text-xs text-gray-400">Pendientes</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{confirmadas.length}</div>
            <div className="text-xs text-gray-400">Confirmadas</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{completadas.length}</div>
            <div className="text-xs text-gray-400">Completadas</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{canceladas.length}</div>
            <div className="text-xs text-gray-400">Canceladas</div>
          </div>
        </div>

        {safeSessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">No tienes sesiones aun</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Reserva tu primera sesion con un instructor o mentor para comenzar
              tu aprendizaje personalizado.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/instructores"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                🎓 Ver Instructores
              </Link>
              <Link
                href="/mentores"
                className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-xl font-semibold transition"
              >
                🏆 Ver Mentores
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Proximas sesiones (confirmadas) */}
            {confirmadas.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                  Proximas sesiones
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {confirmadas.map(session => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </section>
            )}

            {/* Pendientes de confirmacion */}
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-yellow-400">
                  ⏳ Pendientes de confirmacion
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendientes.map(session => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </section>
            )}

            {/* Completadas */}
            {completadas.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-blue-400">
                  ✅ Sesiones completadas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completadas.map(session => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </section>
            )}

            {/* Canceladas (colapsable) */}
            {canceladas.length > 0 && (
              <section>
                <details className="group">
                  <summary className="text-lg font-semibold mb-4 text-red-400 cursor-pointer list-none flex items-center gap-2">
                    <span className="group-open:rotate-90 transition">▶</span>
                    Sesiones canceladas ({canceladas.length})
                  </summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {canceladas.map(session => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                </details>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
