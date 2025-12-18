'use client'

import { useEffect, useState } from 'react'
import { getLevelFromXp } from '@/lib/gamification/leveling'
import UserLevel from '@/components/gamification/UserLevel'

interface GamificationStats {
  stats: {
    total_xp: number
    current_level: number
    xp_to_next_level: number
    total_badges: number
    current_streak: number
    longest_streak: number
  }
  badges: any[]
  recentActivity: any[]
}

interface LeaderboardEntry {
  user_id: string
  full_name: string | null
  total_xp: number
  current_level: number
  rank: number
}

export default function GamificationSection({ userId }: { userId: string }) {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          fetch('/api/gamification/stats'),
          fetch('/api/gamification/leaderboard')
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json()
          setLeaderboard(leaderboardData)
        }
      } catch (error) {
        console.error('[GamificationSection] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="mb-12">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-12">
      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3">
            <span className="text-4xl">🏆</span>
            <span className="text-white drop-shadow-lg">Top 3 de la Semana</span>
          </h2>

          <div className="flex items-end justify-center gap-6">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-full w-20 h-20 flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                  <span className="text-4xl">🥈</span>
                </div>
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 text-center min-w-[140px] shadow-xl border-2 border-gray-400/50">
                  <p className="text-3xl font-bold text-yellow-400 mb-1">#2</p>
                  <p className="text-white font-semibold mb-1 truncate">
                    {leaderboard[1].full_name || 'Anónimo'}
                  </p>
                  <p className="text-sm text-gray-300">
                    Nivel {leaderboard[1].current_level}
                  </p>
                  <p className="text-lg font-bold text-yellow-300 mt-2">
                    {leaderboard[1].total_xp} XP
                  </p>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center -mt-8">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-28 h-28 flex items-center justify-center mb-4 shadow-2xl transform hover:scale-110 transition-transform animate-pulse">
                  <span className="text-6xl">🏆</span>
                </div>
                <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-6 text-center min-w-[160px] shadow-2xl border-4 border-yellow-400/70">
                  <p className="text-5xl font-bold text-yellow-400 mb-2">#1</p>
                  <p className="text-white font-bold text-lg mb-2 truncate">
                    {leaderboard[0].full_name || 'Anónimo'}
                  </p>
                  <p className="text-sm text-gray-300">
                    Nivel {leaderboard[0].current_level}
                  </p>
                  <p className="text-2xl font-bold text-yellow-300 mt-3">
                    {leaderboard[0].total_xp} XP
                  </p>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-full w-20 h-20 flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                  <span className="text-4xl">🥉</span>
                </div>
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 text-center min-w-[140px] shadow-xl border-2 border-amber-700/50">
                  <p className="text-3xl font-bold text-yellow-400 mb-1">#3</p>
                  <p className="text-white font-semibold mb-1 truncate">
                    {leaderboard[2].full_name || 'Anónimo'}
                  </p>
                  <p className="text-sm text-gray-300">
                    Nivel {leaderboard[2].current_level}
                  </p>
                  <p className="text-lg font-bold text-yellow-300 mt-2">
                    {leaderboard[2].total_xp} XP
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Message if user is in top 3 */}
          {leaderboard.some(entry => entry.user_id === userId) && (
            <div className="mt-8 text-center">
              <p className="text-white font-semibold bg-white/10 backdrop-blur-sm inline-block px-6 py-3 rounded-full">
                🎉 ¡Felicidades! Estás en el Top 3
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            📊 Actividad Reciente
          </h3>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
              <div
                key={activity.id || index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {activity.event_type === 'lesson_completed' && '✅'}
                    {activity.event_type === 'course_completed' && '🎓'}
                    {activity.event_type === 'badge_unlocked' && '🏆'}
                    {activity.event_type === 'level_up' && '⬆️'}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {activity.description || activity.event_type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-emerald-400 font-bold">
                  +{activity.xp_amount} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
