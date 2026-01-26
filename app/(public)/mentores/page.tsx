import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Shield, Star, Users, MessageCircle, Award, Search, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Mentores | Nodo360',
  description: 'Conoce a los mentores de la comunidad Nodo360',
}

export default async function MentoresPage({
  searchParams,
}: {
  searchParams: Promise<{ disponible?: string; orden?: string }>
}) {
  const { disponible, orden = 'puntos' } = await searchParams
  const supabase = await createClient()

  // Obtener mentores activos desde user_roles
  const { data: mentorRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'mentor')
    .eq('is_active', true)

  const mentorUserIds = mentorRoles?.map(r => r.user_id) || []

  if (mentorUserIds.length === 0) {
    return (
      <div className="min-h-screen bg-dark">
        <div className="bg-gradient-to-b from-purple-500/10 via-transparent to-transparent py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold text-white">Mentores</h1>
            </div>
            <p className="text-xl text-white/70 max-w-2xl">
              Los mentores son miembros destacados que guian y apoyan a la comunidad.
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 font-medium">Aun no hay mentores activos</p>
            <p className="text-sm text-gray-500 mt-1">
              ¿Quieres ser mentor? Acumula 650 puntos de merito y aplica.
            </p>
            <Link
              href="/dashboard/mentor"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
            >
              Ver requisitos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Obtener perfiles de usuarios que son mentores
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, role')
    .in('id', mentorUserIds)

  // Obtener puntos de mentor para cada usuario
  const { data: mentorPoints } = await supabase
    .from('mentor_points')
    .select('user_id, points')
    .in('user_id', mentorUserIds)

  // Calcular puntos totales por usuario
  const pointsMap = new Map<string, number>()
  mentorPoints?.forEach((p) => {
    const current = pointsMap.get(p.user_id) || 0
    pointsMap.set(p.user_id, current + p.points)
  })

  // Obtener stats de mentores (sesiones, respuestas, etc.)
  const { data: monthlyStats } = await supabase
    .from('mentor_monthly_stats')
    .select('user_id, mentoring_sessions, community_responses')
    .in('user_id', mentorUserIds)

  // Calcular sesiones totales
  const sessionsMap = new Map<string, number>()
  const responsesMap = new Map<string, number>()
  monthlyStats?.forEach((s) => {
    const currentSessions = sessionsMap.get(s.user_id) || 0
    sessionsMap.set(s.user_id, currentSessions + (s.mentoring_sessions || 0))
    const currentResponses = responsesMap.get(s.user_id) || 0
    responsesMap.set(s.user_id, currentResponses + (s.community_responses || 0))
  })

  // Construir lista de mentores con datos combinados
  let mentors = users?.map((user) => ({
    ...user,
    total_points: pointsMap.get(user.id) || 0,
    total_sessions: sessionsMap.get(user.id) || 0,
    total_responses: responsesMap.get(user.id) || 0,
    accepts_messages: true, // Por defecto aceptan mensajes
  })) || []

  // Filtrar por disponibilidad
  if (disponible === 'si') {
    mentors = mentors.filter(m => m.accepts_messages)
  }

  // Ordenar
  switch (orden) {
    case 'sesiones':
      mentors.sort((a, b) => b.total_sessions - a.total_sessions)
      break
    case 'reciente':
      // Los más recientes serían los que tienen menos puntos (recién entraron)
      mentors.sort((a, b) => a.total_points - b.total_points)
      break
    case 'puntos':
    default:
      mentors.sort((a, b) => b.total_points - a.total_points)
      break
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-500/10 via-transparent to-transparent py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Mentores</h1>
          </div>
          <p className="text-xl text-white/70 max-w-2xl">
            Los mentores son miembros destacados que guian y apoyan a la comunidad.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Filtro por disponibilidad */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Disponibilidad:</label>
            <div className="flex gap-2">
              <Link
                href={`/mentores${orden !== 'puntos' ? `?orden=${orden}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  !disponible
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Todos
              </Link>
              <Link
                href={`/mentores?disponible=si${orden !== 'puntos' ? `&orden=${orden}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                  disponible === 'si'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Aceptando mensajes
              </Link>
            </div>
          </div>

          {/* Ordenar */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-400">Ordenar:</label>
            <div className="flex gap-2">
              <Link
                href={`/mentores${disponible ? `?disponible=${disponible}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  orden === 'puntos'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Puntos
              </Link>
              <Link
                href={`/mentores?orden=sesiones${disponible ? `&disponible=${disponible}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  orden === 'sesiones'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Sesiones
              </Link>
              <Link
                href={`/mentores?orden=reciente${disponible ? `&disponible=${disponible}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  orden === 'reciente'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Reciente
              </Link>
            </div>
          </div>
        </div>

        {/* Grid de mentores */}
        {mentors.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 font-medium">No se encontraron mentores</p>
            <p className="text-sm text-gray-500 mt-1">
              Prueba cambiando los filtros
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <Link
                key={mentor.id}
                href={`/mentores/${mentor.id}`}
                className="group rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-purple-500/30 hover:bg-white/[0.07] transition-all"
              >
                {/* Header con avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    {mentor.avatar_url ? (
                      <Image
                        src={mentor.avatar_url}
                        alt={mentor.full_name || 'Mentor'}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {mentor.full_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-dark">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                      {mentor.full_name || 'Mentor'}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">
                        {mentor.total_points.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">puntos de merito</span>
                    </div>
                    {mentor.accepts_messages && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Disponible</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{mentor.total_sessions} sesiones</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{mentor.total_responses} respuestas</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA para aplicar */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-purple-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">¿Quieres ser mentor?</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-6">
            Acumula 650 puntos de merito participando activamente en la comunidad,
            completando cursos y ayudando a otros estudiantes.
          </p>
          <Link
            href="/dashboard/mentor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Ver requisitos y aplicar
          </Link>
        </div>
      </div>
    </div>
  )
}
