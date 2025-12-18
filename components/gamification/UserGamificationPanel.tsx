// components/gamification/UserGamificationPanel.tsx
import { createClient } from '@/lib/supabase/server'
import { Trophy, Flame, Star, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface UserGamificationStats {
  total_xp: number
  current_level: number
  xp_to_next_level: number
  total_badges: number
  current_streak: number
  longest_streak: number
  lessons_completed: number
  courses_completed: number
  certificates_earned: number
}

interface UserBadge {
  id: string
  unlocked_at: string
  is_featured: boolean | null
  badges: {
    id: string
    title: string
    description: string | null
    icon: string | null
    category: string | null
    rarity: string | null
    color: string | null
  } | null
}

function getXpProgress(stats: UserGamificationStats | null) {
  if (!stats) {
    return { percent: 0, totalXp: 0, toNext: 100 }
  }

  const totalXp = stats.total_xp || 0
  const toNext = stats.xp_to_next_level || 100

  // Si xp_to_next_level es el XP total que falta:
  // Por ejemplo: nivel 2, 150 XP acumulados, faltan 50 → percent = 75%
  const maxXpThisLevel = totalXp + toNext
  const percent =
    maxXpThisLevel > 0 ? Math.min(100, Math.round((totalXp / maxXpThisLevel) * 100)) : 0

  return { percent, totalXp, toNext }
}

export default async function UserGamificationPanel() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Stats del usuario
  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select(
      'total_xp, current_level, xp_to_next_level, total_badges, current_streak, longest_streak, lessons_completed, courses_completed, certificates_earned'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  // Últimas medallas
  const { data: badges } = await supabase
    .from('user_badges')
    .select(
      `
      id,
      unlocked_at,
      is_featured,
      badges:badge_id (
        id,
        title,
        description,
        icon,
        category,
        rarity,
        color
      )
    `
    )
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })
    .limit(6)

  const { percent, totalXp, toNext } = getXpProgress(stats || null)

  return (
    <section className="w-full mb-8">
      <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        {/* Tarjeta principal XP */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#020617] to-[#020617] border border-white/10 shadow-xl">
          {/* Glow de fondo */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#f7931a]/20 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#22c55e]/10 blur-3xl" />
          </div>

          <div className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
                  <Sparkles className="w-4 h-4 text-[#f97316]" />
                  Gamificación
                </div>
                <h2 className="mt-1 text-lg sm:text-xl font-semibold text-white">
                  Tu progreso en <span className="text-[#f7931a]">Nodo360</span>
                </h2>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs text-white/50">Nivel actual</span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#fde047]" />
                  <span className="text-2xl font-bold text-white">
                    {stats?.current_level ?? 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de XP */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-white/60 mb-1.5">
                <span>Experiencia</span>
                <span>
                  {totalXp} XP · Próximo nivel en {toNext} XP
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#f97316] to-[#facc15] transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-white/60">Racha actual</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-white">
                    {stats?.current_streak ?? 0} días
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-white/60">Lecciones</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {stats?.lessons_completed ?? 0} completadas
                </p>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-white/60">Cursos</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {stats?.courses_completed ?? 0} completados
                </p>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-white/60">Certificados</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {stats?.certificates_earned ?? 0}
                </p>
              </div>
            </div>

            {/* CTA pequeña */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-white/50">
                Sigue completando lecciones para subir de nivel y desbloquear nuevas
                medallas.
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition"
              >
                Ver mi panel
              </Link>
            </div>
          </div>
        </div>

        {/* Medallas recientes */}
        <div className="rounded-2xl bg-[#020617] border border-white/10 shadow-xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#fbbf24]" />
              <h3 className="text-sm font-semibold text-white">Medallas recientes</h3>
            </div>
            <span className="text-xs text-white/50">
              {stats?.total_badges ?? 0} medallas totales
            </span>
          </div>

          {(!badges || badges.length === 0) && (
            <p className="text-xs text-white/50">
              Aún no has desbloqueado medallas. Completa lecciones y cursos para ganar las
              primeras.
            </p>
          )}

          {badges && badges.length > 0 && (
            <div className="mt-1 space-y-2">
              {badges.map((b) => {
                const badge = b.badges as unknown as {
                  id: string
                  title: string
                  description: string
                  icon: string
                  category: string
                  rarity: string
                  color: string
                } | null
                if (!badge) return null

                const color =
                  badge.color ||
                  (badge.rarity === 'legendary'
                    ? '#f97316'
                    : badge.rarity === 'epic'
                    ? '#8b5cf6'
                    : badge.rarity === 'rare'
                    ? '#22c55e'
                    : '#e5e7eb')

                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-black shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {badge.icon ? badge.icon : '🏅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white truncate max-w-[160px]">
                          {badge.title}
                        </p>
                        {badge.rarity && (
                          <span className="text-[10px] uppercase tracking-wide text-white/60">
                            {badge.rarity}
                          </span>
                        )}
                      </div>
                      {badge.description && (
                        <p className="text-[11px] text-white/60 truncate">
                          {badge.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-auto pt-3">
            <Link
              href="/perfil"
              className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition"
            >
              Ver todas mis medallas y estadísticas →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
