import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Leaderboard | Nodo360',
  description: 'Ranking de los mejores estudiantes'
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Admin client para queries del leaderboard (bypass RLS para ver todos los usuarios)
  const admin = createAdminClient()

  // Obtener stats del usuario actual
  const { data: myStats } = await supabase
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Obtener top 100 usuarios con sus datos (usa admin para bypass RLS)
  const { data: leaderboard, error: leaderboardError } = await admin
    .from('user_gamification_stats')
    .select(`
      user_id,
      total_xp,
      current_level,
      current_streak
    `)
    .gt('total_xp', 0)
    .order('total_xp', { ascending: false })
    .limit(100)

  if (leaderboardError) {
    console.error('🏆 [Leaderboard] Error:', leaderboardError)
  }

  // Obtener info de usuarios del leaderboard
  const userIds = leaderboard?.map(l => l.user_id) || []
  const { data: usersData } = await admin
    .from('users')
    .select('id, full_name, avatar_url, email')
    .in('id', userIds.length > 0 ? userIds : ['no-users'])

  // Crear mapa de usuarios para acceso rapido
  const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])

  // Encontrar posicion del usuario actual
  const myPosition = leaderboard?.findIndex(l => l.user_id === user.id) ?? -1

  // Asegurar valores positivos para stats del usuario (fix XP negativos)
  const totalXP = Math.max(myStats?.total_xp || 0, 0)
  const currentLevel = Math.max(myStats?.current_level || 1, 1)
  const streakDays = Math.max(myStats?.current_streak || 0, 0)

  // Calcular progreso de nivel
  const xpPerLevel = 100
  const xpInCurrentLevel = totalXP % xpPerLevel
  const progressPercent = (xpInCurrentLevel / xpPerLevel) * 100

  const getMedal = (position: number) => {
    if (position === 0) return { emoji: '🥇', bg: 'from-yellow-500/30 to-amber-500/30' }
    if (position === 1) return { emoji: '🥈', bg: 'from-gray-400/30 to-gray-500/30' }
    if (position === 2) return { emoji: '🥉', bg: 'from-amber-600/30 to-orange-600/30' }
    return { emoji: '', bg: '' }
  }

  const getUserName = (userId: string) => {
    const userData = usersMap.get(userId)
    if (userData?.full_name) return userData.full_name
    if (userData?.email) return userData.email.split('@')[0]
    return 'Usuario'
  }

  const getUserInitial = (userId: string) => {
    return getUserName(userId).charAt(0).toUpperCase()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏆</span>
          <h1 className="text-2xl font-bold text-white">Leaderboard Global</h1>
        </div>
        <p className="text-white/50">Compite con otros estudiantes y sube en el ranking</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mi posicion - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-brand-light/20 to-brand/20 border border-brand-light/30 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-sm text-white/60">Tu Nivel</p>
                <p className="text-2xl font-bold text-white">Nivel {currentLevel}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70">{totalXP.toLocaleString()} XP</span>
                <span className="text-white/50">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-light to-brand rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-white/40">Total XP</p>
                <p className="text-lg font-bold text-white">{totalXP.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-white/40">Racha</p>
                <p className="text-lg font-bold text-white">{streakDays} días</p>
              </div>
            </div>

            {/* Mi posicion */}
            {myPosition >= 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-sm text-white/50">Tu posición</p>
                <p className="text-3xl font-bold text-brand-light">#{myPosition + 1}</p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <span>💡</span>
              Sube en el ranking
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/70">
                <span className="text-success">✓</span>
                Completa lecciones (+10 XP)
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <span className="text-success">✓</span>
                Termina cursos (+50-300 XP)
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <span className="text-success">✓</span>
                Desbloquea badges (+5-500 XP)
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <span className="text-success">✓</span>
                Mantén tu racha (+25-200 XP)
              </li>
            </ul>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <div className="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="text-xl">📊</span>
                Top 100 Estudiantes
              </h2>
            </div>

            {leaderboard && leaderboard.length > 0 ? (
              <div className="divide-y divide-white/5">
                {leaderboard.map((entry, index) => {
                  const medal = getMedal(index)
                  const isMe = entry.user_id === user.id
                  const entryXP = Math.max(entry.total_xp || 0, 0)
                  const entryLevel = Math.max(entry.current_level || 1, 1)

                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-4 transition ${
                        isMe
                          ? 'bg-brand-light/10'
                          : index < 3
                            ? `bg-gradient-to-r ${medal.bg}`
                            : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Posicion */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        index < 3
                          ? 'text-2xl'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {index < 3 ? medal.emoji : index + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-white font-semibold">
                        {getUserInitial(entry.user_id)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isMe ? 'text-brand-light' : 'text-white'}`}>
                          {getUserName(entry.user_id)}
                          {isMe && <span className="ml-2 text-xs">(Tú)</span>}
                        </p>
                        <p className="text-sm text-white/50">Nivel {entryLevel}</p>
                      </div>

                      {/* XP */}
                      <div className="text-right">
                        <p className="font-bold text-white">{entryXP.toLocaleString()}</p>
                        <p className="text-xs text-white/40">XP</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-white/50">No hay usuarios en el leaderboard aún</p>
                <p className="text-sm text-white/30 mt-1">¡Sé el primero en ganar XP!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>🎯</span>
          ¿Cómo funciona el ranking?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/70">
          <div>
            <h4 className="text-white font-medium mb-2">Criterios de Ordenamiento</h4>
            <ul className="space-y-1 text-sm">
              <li>1. XP Total (mayor a menor)</li>
              <li>2. Nivel Actual (mayor a menor)</li>
              <li>3. Fecha de registro (primero en llegar)</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Actualizaciones</h4>
            <ul className="space-y-1 text-sm">
              <li>• Ranking en tiempo real</li>
              <li>• XP actualizado al instante</li>
              <li>• Posición recalculada automáticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
