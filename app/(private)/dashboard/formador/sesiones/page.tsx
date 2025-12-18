// app/(private)/dashboard/formador/sesiones/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mis Sesiones como Formador | Nodo360'
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

interface Review {
  id: string
  rating: number
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
  review: Review[] | null
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function FormadorSesionesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const statusFilter = params.status

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard/formador/sesiones')
  }

  // Verificar educador
  const { data: educator } = await supabase
    .from('educators')
    .select('id, type')
    .eq('user_id', user.id)
    .single()

  if (!educator) {
    redirect('/dashboard/ser-formador')
  }

  // Obtener sesiones
  let query = supabase
    .from('mentorship_sessions')
    .select(`
      *,
      student:student_id (id, full_name, avatar_url, email),
      specialty:specialty_id (id, name, icon),
      review:session_reviews (id, rating)
    `)
    .eq('educator_id', educator.id)
    .order('scheduled_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: sessions } = await query

  const safeSessions = (sessions || []) as Session[]

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
    confirmed: { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
    completed: { label: 'Completada', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
    cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' }
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/formador" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-bold">Gestion de Sesiones</h1>
          <p className="text-gray-400 text-sm mt-1">
            {safeSessions.length} sesiones {statusFilter ? `(${statusConfig[statusFilter]?.label || statusFilter})` : 'en total'}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/dashboard/formador/sesiones"
            className={`px-4 py-2 rounded-lg text-sm transition ${!statusFilter ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Todas
          </Link>
          {Object.entries(statusConfig).map(([key, config]) => (
            <Link
              key={key}
              href={`/dashboard/formador/sesiones?status=${key}`}
              className={`px-4 py-2 rounded-lg text-sm transition ${statusFilter === key ? config.bg + ' ' + config.color + ' border' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {config.label}
            </Link>
          ))}
        </div>

        {/* Lista de sesiones */}
        {safeSessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-xl mb-2">No hay sesiones</p>
            <p className="text-sm">
              {statusFilter
                ? `No tienes sesiones con estado "${statusConfig[statusFilter]?.label}"`
                : 'Aun no has recibido solicitudes de sesiones'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeSessions.map(session => {
              const config = statusConfig[session.status]
              const isPast = new Date(session.scheduled_at) < new Date()
              const hasReview = session.review && session.review.length > 0

              return (
                <Link
                  key={session.id}
                  href={`/dashboard/formador/sesiones/${session.id}`}
                  className={`block border rounded-xl overflow-hidden hover:border-white/30 transition ${config.bg}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                          {session.student?.avatar_url ? (
                            <img src={session.student.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {session.student?.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{session.student?.full_name}</div>
                          <div className="text-xs text-gray-400">{session.student?.email}</div>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </div>

                    {session.title && (
                      <h3 className="font-medium mb-2">{session.title}</h3>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                      <span>
                        {new Date(session.scheduled_at).toLocaleString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>
                        {session.session_type === 'videocall' && 'Videollamada'}
                        {session.session_type === 'chat' && 'Chat'}
                        {session.session_type === 'task_review' && 'Revision'}
                      </span>
                      <span>{session.duration_minutes} min</span>
                      {session.specialty && (
                        <span>{session.specialty.icon} {session.specialty.name}</span>
                      )}
                      {session.is_free_intro && (
                        <span className="text-emerald-400">Gratis</span>
                      )}
                      {!session.is_free_intro && session.price_credits > 0 && (
                        <span className="text-amber-400">{session.price_credits} cr</span>
                      )}
                      {hasReview && (
                        <span className="text-yellow-400">
                          ★ {session.review![0].rating}
                        </span>
                      )}
                    </div>

                    {/* Indicadores especiales */}
                    <div className="flex gap-2 mt-3">
                      {session.status === 'pending' && (
                        <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded">
                          Requiere confirmacion
                        </span>
                      )}
                      {session.status === 'confirmed' && isPast && (
                        <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">
                          Marcar como completada
                        </span>
                      )}
                      {session.status === 'completed' && !hasReview && (
                        <span className="text-xs bg-gray-500/30 text-gray-300 px-2 py-1 rounded">
                          Sin valoracion aun
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
