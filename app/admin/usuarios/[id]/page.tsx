import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Calendar, Trophy, Zap, BookOpen, Shield, Target, RotateCcw } from 'lucide-react'
import ChangeRoleForm from './ChangeRoleForm'
import AdjustXPForm from './AdjustXPForm'

async function getUserDetail(userId: string) {
  const supabase = await createClient()

  // Usuario básico
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !user) return null

  // Stats de gamificación
  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // Cursos inscritos
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      course:course_id (id, title, slug, level)
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })

  // Hitos desbloqueados
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('id, badge_id, unlocked_at')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  let badges: any[] = []
  if (userBadges && userBadges.length > 0) {
    const badgeIds = userBadges.map(ub => ub.badge_id)
    const { data: badgesData } = await supabase
      .from('badges')
      .select('id, slug, title, description, icon, rarity')
      .in('id', badgeIds)

    if (badgesData) {
      badges = userBadges.map(ub => {
        const badgeInfo = badgesData.find(b => b.id === ub.badge_id)
        return {
          ...ub,
          badge: badgeInfo
        }
      }).filter(b => b.badge)
    }
  }

  // Actividad reciente (últimos 20 eventos)
  const { data: activity } = await supabase
    .from('xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return { user, stats, enrollments, badges, activity }
}

export default async function UserDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()

  const { id } = await params
  const data = await getUserDetail(id)

  if (!data) notFound()

  const { user, stats, enrollments, badges, activity } = data

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/usuarios"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user.full_name || 'Sin nombre'}
            </h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Badge de rol */}
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            user.role === 'admin'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : user.role === 'mentor'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : user.role === 'instructor'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}
        >
          {user.role === 'admin'
            ? 'Administrador'
            : user.role === 'mentor'
            ? 'Mentor'
            : user.role === 'instructor'
            ? 'Instructor'
            : 'Estudiante'}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Trophy className="text-yellow-400" size={20} />
            </div>
            <span className="text-sm text-gray-400">Nivel</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.current_level || 1}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Zap className="text-emerald-400" size={20} />
            </div>
            <span className="text-sm text-gray-400">XP Total</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.total_xp?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BookOpen className="text-blue-400" size={20} />
            </div>
            <span className="text-sm text-gray-400">Cursos</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {enrollments?.length || 0}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="text-purple-400" size={20} />
            </div>
            <span className="text-sm text-gray-400">Hitos</span>
          </div>
          <p className="text-3xl font-bold text-white">{badges?.length || 0}</p>
        </div>
      </div>

      {/* Grid de acciones y detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna 1: Acciones Admin */}
        <div className="space-y-6">
          {/* Cambiar Rol */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Cambiar Rol
            </h3>
            <ChangeRoleForm userId={user.id} currentRole={user.role} />
          </div>

          {/* Ajustar XP */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Ajustar XP
            </h3>
            <AdjustXPForm userId={user.id} currentXP={stats?.total_xp || 0} />
          </div>

          {/* Reiniciar Cursos */}
          <Link
            href={`/admin/usuarios/${user.id}/reiniciar-cursos`}
            className="block bg-red-500/10 rounded-xl p-6 border border-red-500/30 hover:border-red-500/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                <RotateCcw className="text-red-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-red-400">
                Reiniciar Cursos
              </h3>
            </div>
            <p className="text-sm text-red-300/70">
              Eliminar progreso y certificados de cursos seleccionados
            </p>
          </Link>

          {/* Info adicional */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Información
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={16} />
                <span>
                  Registrado:{' '}
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Zap size={16} />
                <span>Racha: {stats?.current_streak || 0} días</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Target size={16} />
                <span>
                  XP al siguiente nivel: {stats?.xp_to_next_level || 100}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna 2: Cursos */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Cursos Inscritos
          </h3>
          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {enrollments.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition"
                >
                  <div>
                    <p className="font-medium text-white">
                      {enrollment.course?.title || 'Curso sin título'}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {enrollment.course?.level || 'Sin nivel'}
                    </p>
                  </div>
                  <span className="text-sm text-emerald-400 font-medium">
                    {enrollment.progress_percentage || 0}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              Sin cursos inscritos
            </p>
          )}
        </div>

        {/* Columna 3: Actividad Reciente */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Actividad Reciente
          </h3>
          {activity && activity.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {activity.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      {event.description || event.event_type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className="text-sm text-emerald-400 font-medium ml-2">
                    +{event.xp_amount} XP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              Sin actividad reciente
            </p>
          )}
        </div>
      </div>

      {/* Hitos del usuario */}
      {badges && badges.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Hitos Desbloqueados
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badges.map((userBadge: any) => (
              <div
                key={userBadge.id}
                className="flex flex-col items-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition"
              >
                <span className="text-4xl mb-2">
                  {userBadge.badge?.icon || '🏆'}
                </span>
                <p className="text-sm font-medium text-center text-white">
                  {userBadge.badge?.title}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {userBadge.badge?.rarity}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
