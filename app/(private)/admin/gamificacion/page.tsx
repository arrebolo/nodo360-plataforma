import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Zap, Users, TrendingUp, Plus, Settings } from 'lucide-react'

async function getGamificationStats() {
  const supabase = await createClient()

  // Total XP otorgado
  const { data: xpData } = await supabase
    .from('user_gamification_stats')
    .select('total_xp')

  const totalXP = xpData?.reduce((sum, u) => sum + (u.total_xp || 0), 0) || 0

  // Total hitos
  const { count: totalBadges } = await supabase
    .from('badges')
    .select('*', { count: 'exact', head: true })

  // Hitos desbloqueados
  const { count: unlockedBadges } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })

  // Distribución por nivel
  const { data: levelDist } = await supabase
    .from('user_gamification_stats')
    .select('current_level')

  const levelCounts: Record<number, number> = {}
  levelDist?.forEach((u) => {
    const level = u.current_level || 1
    levelCounts[level] = (levelCounts[level] || 0) + 1
  })

  // Top 5 usuarios por XP
  const { data: topUsers } = await supabase
    .from('user_gamification_stats')
    .select(`
      total_xp,
      current_level,
      user_id,
      users!inner (full_name, email)
    `)
    .order('total_xp', { ascending: false })
    .limit(5)

  // Hitos más populares
  const { data: userBadgesData } = await supabase
    .from('user_badges')
    .select('badge_id')

  const badgeCounts: Record<string, number> = {}
  userBadgesData?.forEach((ub) => {
    badgeCounts[ub.badge_id] = (badgeCounts[ub.badge_id] || 0) + 1
  })

  // Obtener info de los badges más populares
  const popularBadgeIds = Object.entries(badgeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  let topBadges: any[] = []
  if (popularBadgeIds.length > 0) {
    const { data: badgesData } = await supabase
      .from('badges')
      .select('id, title, icon')
      .in('id', popularBadgeIds)

    topBadges =
      badgesData?.map((badge) => ({
        ...badge,
        count: badgeCounts[badge.id]
      })) || []
  }

  // Total usuarios activos
  const { count: totalUsers } = await supabase
    .from('user_gamification_stats')
    .select('*', { count: 'exact', head: true })

  return {
    totalXP,
    totalBadges: totalBadges || 0,
    unlockedBadges: unlockedBadges || 0,
    totalUsers: totalUsers || 0,
    levelCounts,
    topUsers: topUsers || [],
    topBadges
  }
}

export default async function GamificacionPage() {
  await requireAdmin()

  const stats = await getGamificationStats()

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gamificación</h1>
          <p className="text-white/60 mt-1">
            Estadísticas y gestión del sistema de gamificación
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/gamificacion/hitos"
            className="flex items-center gap-2 px-4 py-2 bg-brand-light hover:bg-brand-light/80 rounded-lg transition-colors text-white font-medium"
          >
            <Trophy size={20} />
            Gestionar Hitos
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Zap className="text-yellow-400" size={20} />
            </div>
            <span className="text-sm text-white/60">XP Total Otorgado</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalXP.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Trophy className="text-purple-400" size={20} />
            </div>
            <span className="text-sm text-white/60">Hitos Creados</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalBadges}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="text-blue-400" size={20} />
            </div>
            <span className="text-sm text-white/60">Hitos Desbloqueados</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.unlockedBadges}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            <span className="text-sm text-white/60">Promedio por Usuario</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalUsers && stats.unlockedBadges
              ? (stats.unlockedBadges / stats.totalUsers).toFixed(1)
              : 0}
          </p>
        </div>
      </div>

      {/* Top Usuarios y Hitos Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Usuarios */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-white">
            🏆 Top 5 Usuarios por XP
          </h2>
          <div className="space-y-3">
            {stats.topUsers.length > 0 ? (
              stats.topUsers.map((user: any, index: number) => (
                <Link
                  key={user.user_id}
                  href={`/admin/usuarios/${user.user_id}`}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold ${
                        index === 0
                          ? 'text-yellow-400'
                          : index === 1
                          ? 'text-white/60'
                          : index === 2
                          ? 'text-orange-400'
                          : 'text-white/50'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white">
                        {user.users?.full_name ||
                          user.users?.email?.split('@')[0] ||
                          'Usuario'}
                      </p>
                      <p className="text-xs text-white/60">
                        Nivel {user.current_level}
                      </p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">
                    {user.total_xp?.toLocaleString()} XP
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-center text-white/60 py-8">
                No hay usuarios con XP
              </p>
            )}
          </div>
        </div>

        {/* Hitos Populares */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-white">
            ⭐ Hitos Más Desbloqueados
          </h2>
          <div className="space-y-3">
            {stats.topBadges.length > 0 ? (
              stats.topBadges.map((badge: any) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{badge.icon || '🏆'}</span>
                    <p className="font-medium text-white">{badge.title}</p>
                  </div>
                  <span className="text-blue-400 font-bold">
                    {badge.count} usuarios
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-white/60 py-8">
                No hay hitos desbloqueados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Distribución por Nivel */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-6 text-white">
          📊 Distribución de Usuarios por Nivel
        </h2>
        {Object.keys(stats.levelCounts).length > 0 ? (
          <div className="flex items-end gap-4 h-64">
            {Object.entries(stats.levelCounts)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .slice(0, 10)
              .map(([level, count]) => {
                const maxCount = Math.max(...Object.values(stats.levelCounts))
                const height = (count / maxCount) * 100

                return (
                  <div
                    key={level}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-brand-light to-brand rounded-t-lg transition-all hover:from-brand-light/80 hover:to-brand"
                      style={{ height: `${height}%`, minHeight: '20px' }}
                    />
                    <p className="mt-2 text-sm text-white/60">Nv.{level}</p>
                    <p className="text-xs font-bold text-white">{count}</p>
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-center text-white/60 py-8">
            No hay datos de niveles
          </p>
        )}
      </div>
    </div>
  )
}
