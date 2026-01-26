import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Shield,
  Star,
  Users,
  MessageCircle,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Vote,
  Clock,
  GraduationCap,
  TrendingUp,
} from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', id)
    .single()

  return {
    title: user?.full_name ? `${user.full_name} - Mentor | Nodo360` : 'Mentor | Nodo360',
    description: `Perfil del mentor ${user?.full_name || ''} en Nodo360`,
  }
}

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar que es un mentor activo
  const { data: mentorRole } = await supabase
    .from('user_roles')
    .select('user_id, is_active, created_at')
    .eq('user_id', id)
    .eq('role', 'mentor')
    .eq('is_active', true)
    .single()

  if (!mentorRole) {
    notFound()
  }

  // Obtener perfil del usuario
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, bio, created_at')
    .eq('id', id)
    .single()

  if (!user) {
    notFound()
  }

  // Obtener perfil de mentor (si existe tabla mentors)
  const { data: mentorProfile } = await supabase
    .from('mentors')
    .select('*')
    .eq('user_id', id)
    .maybeSingle()

  // Obtener puntos totales
  const { data: points } = await supabase
    .from('mentor_points')
    .select('points')
    .eq('user_id', id)

  const totalPoints = points?.reduce((sum, p) => sum + (p.points || 0), 0) || 0

  // Obtener estadísticas mensuales agregadas
  const { data: monthlyStats } = await supabase
    .from('mentor_monthly_stats')
    .select('mentoring_sessions, community_responses, proposals_voted')
    .eq('user_id', id)

  const totalSessions = monthlyStats?.reduce((sum, s) => sum + (s.mentoring_sessions || 0), 0) || 0
  const totalResponses = monthlyStats?.reduce((sum, s) => sum + (s.community_responses || 0), 0) || 0
  const totalVotes = monthlyStats?.reduce((sum, s) => sum + (s.proposals_voted || 0), 0) || 0

  // Obtener certificaciones de instructor (si también es instructor)
  const { data: instructorCerts } = await supabase
    .from('instructor_certifications')
    .select(`
      id,
      certification_number,
      issued_at,
      learning_paths (
        id,
        title,
        icon
      )
    `)
    .eq('user_id', id)
    .eq('status', 'active')
    .order('issued_at', { ascending: false })

  // Obtener últimos votos en propuestas de gobernanza
  const { data: recentVotes } = await supabase
    .from('proposal_votes')
    .select(`
      id,
      vote_type,
      created_at,
      proposals (
        id,
        title,
        slug,
        status
      )
    `)
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Calcular tiempo como mentor
  const mentorSince = new Date(mentorRole.created_at)
  const now = new Date()
  const monthsAsMentor = Math.floor((now.getTime() - mentorSince.getTime()) / (1000 * 60 * 60 * 24 * 30))

  // Disponibilidad (por defecto true, o desde mentorProfile)
  const isAvailable = mentorProfile?.accepts_messages ?? true

  return (
    <div className="min-h-screen bg-dark">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-b from-purple-500/10 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/mentores"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mentores
          </Link>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name || 'Mentor'}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/10"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-4 border-white/10">
                  <span className="text-5xl font-bold text-white">
                    {user.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center border-4 border-dark">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {user.full_name || 'Mentor'}
                </h1>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                  Mentor
                </span>
              </div>

              {/* Puntos de mérito */}
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-xl font-bold text-yellow-400">
                  {totalPoints.toLocaleString()}
                </span>
                <span className="text-gray-400">puntos de mérito</span>
              </div>

              {/* Estado de disponibilidad */}
              <div className="flex items-center gap-2 mb-4">
                {isAvailable ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Disponible para mentoría</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-500">No disponible actualmente</span>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">{totalSessions}</span>
                  <span className="text-gray-400">sesiones</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">{totalResponses}</span>
                  <span className="text-gray-400">respuestas</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Mentor desde</span>
                  <span className="text-white font-medium">
                    {mentorSince.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Acerca de</h2>
              <p className="text-gray-400 whitespace-pre-line">
                {mentorProfile?.bio || user.bio || 'Este mentor aún no ha agregado una descripción.'}
              </p>
            </section>

            {/* Especialidades (certificaciones de instructor) */}
            {instructorCerts && instructorCerts.length > 0 && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-400" />
                  Especialidades
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Este mentor también es instructor certificado en las siguientes rutas:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {instructorCerts.map((cert: any) => {
                    const lp = cert.learning_paths as { id: string; title: string; icon: string }
                    return (
                      <div
                        key={cert.id}
                        className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{lp?.icon}</span>
                          <span className="font-medium text-white">{lp?.title}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Actividad en Gobernanza */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Vote className="w-5 h-5 text-brand-light" />
                Actividad en Gobernanza
              </h2>
              {!recentVotes || recentVotes.length === 0 ? (
                <p className="text-gray-500 text-sm">Este mentor aún no ha participado en votaciones.</p>
              ) : (
                <div className="space-y-3">
                  {recentVotes.map((vote: any) => {
                    const proposal = vote.proposals as { id: string; title: string; slug: string; status: string } | null
                    if (!proposal) return null

                    return (
                      <Link
                        key={vote.id}
                        href={`/gobernanza/${proposal.slug}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          vote.vote_type === 'yes' ? 'bg-green-500/20' :
                          vote.vote_type === 'no' ? 'bg-red-500/20' : 'bg-gray-500/20'
                        }`}>
                          {vote.vote_type === 'yes' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : vote.vote_type === 'no' ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white group-hover:text-purple-400 transition-colors truncate">
                            {proposal.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Votó {vote.vote_type === 'yes' ? 'a favor' : vote.vote_type === 'no' ? 'en contra' : 'abstención'} · {new Date(vote.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Estadísticas
              </h2>
              <div className="space-y-4">
                <StatItem
                  icon={<Award className="w-5 h-5 text-yellow-400" />}
                  label="Puntos totales"
                  value={totalPoints.toLocaleString()}
                />
                <StatItem
                  icon={<MessageCircle className="w-5 h-5 text-purple-400" />}
                  label="Sesiones de mentoría"
                  value={totalSessions.toString()}
                />
                <StatItem
                  icon={<Users className="w-5 h-5 text-green-400" />}
                  label="Respuestas en comunidad"
                  value={totalResponses.toString()}
                />
                <StatItem
                  icon={<Vote className="w-5 h-5 text-brand-light" />}
                  label="Votos en gobernanza"
                  value={totalVotes.toString()}
                />
                <StatItem
                  icon={<Calendar className="w-5 h-5 text-blue-400" />}
                  label="Tiempo como mentor"
                  value={monthsAsMentor > 0 ? `${monthsAsMentor} meses` : 'Nuevo'}
                />
              </div>
            </section>

            {/* Certificaciones de Instructor */}
            {instructorCerts && instructorCerts.length > 0 && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-400" />
                  Instructor Certificado
                </h2>
                <div className="space-y-3">
                  {instructorCerts.map((cert: any) => {
                    const lp = cert.learning_paths as { id: string; title: string; icon: string }
                    return (
                      <div
                        key={cert.id}
                        className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{lp?.icon}</span>
                          <span className="font-medium text-white text-sm">{lp?.title}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          <p>N.° {cert.certification_number}</p>
                          <p>
                            Desde: {new Date(cert.issued_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Contactar */}
            <section className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-2">¿Necesitas ayuda?</h2>
              <p className="text-sm text-gray-400 mb-4">
                {isAvailable
                  ? 'Este mentor está disponible para sesiones de mentoría.'
                  : 'Este mentor no está aceptando solicitudes actualmente.'}
              </p>
              <button
                className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                Solicitar mentoría (próximamente)
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}
