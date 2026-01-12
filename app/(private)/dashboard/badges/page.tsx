import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Mis Badges | Nodo360',
  description: 'Todos tus badges y logros desbloqueados'
}

// Mapeo de iconos por defecto segun categoria/nombre
function getDefaultIcon(badge: any): string {
  const name = (badge?.title || badge?.name || '').toLowerCase()
  const category = badge?.category?.toLowerCase() || ''

  // Por nombre
  if (name.includes('lección') || name.includes('leccion')) return '📖'
  if (name.includes('curso')) return '🎓'
  if (name.includes('nivel')) return '⭐'
  if (name.includes('racha')) return '🔥'
  if (name.includes('quiz')) return '✅'
  if (name.includes('perfecto')) return '💯'
  if (name.includes('primera')) return '🎯'

  // Por categoria
  if (category === 'progress') return '📈'
  if (category === 'achievement') return '🏆'
  if (category === 'streak') return '🔥'
  if (category === 'social') return '👥'

  // Por rareza
  if (badge?.rarity === 'legendary') return '👑'
  if (badge?.rarity === 'epic') return '💎'
  if (badge?.rarity === 'rare') return '⭐'

  return '🏅'
}

// Decodificar entidades HTML o usar icono por defecto
function getIcon(icon: string | null, badge: any): string {
  if (!icon) return getDefaultIcon(badge)

  // Si es una entidad HTML, usar icono por defecto
  if (icon.includes('&#') || icon.includes('&amp;') || icon.includes('&lt;')) {
    return getDefaultIcon(badge)
  }

  return icon
}

// Estilos por rareza
function getRarityStyles(rarity: string) {
  const styles: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    common: {
      bg: 'from-slate-500/20 to-slate-600/20',
      border: 'border-slate-500/30',
      text: 'text-slate-300',
      glow: '',
    },
    rare: {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/40',
      text: 'text-blue-300',
      glow: 'shadow-blue-500/20',
    },
    epic: {
      bg: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/40',
      text: 'text-purple-300',
      glow: 'shadow-purple-500/20',
    },
    legendary: {
      bg: 'from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-500/50',
      text: 'text-yellow-300',
      glow: 'shadow-yellow-500/30 shadow-lg',
    },
  }
  return styles[rarity] || styles.common
}

function getRarityLabel(rarity: string) {
  const labels: Record<string, string> = {
    common: 'Común',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Legendario',
  }
  return labels[rarity] || rarity
}

export default async function BadgesPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener stats
  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Obtener badges del usuario (usa admin para bypass RLS)
  const { data: userBadges, error: userBadgesError } = await admin
    .from('user_badges')
    .select(`
      *,
      badge:badge_id (*)
    `)
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })

  if (userBadgesError) {
    console.error('Error fetching user badges:', userBadgesError)
  }

  // Obtener todos los badges activos
  const { data: allBadges } = await admin
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('rarity', { ascending: true })

  const earnedBadgeIds = userBadges?.map(ub => ub.badge_id) || []

  // Stats con valores seguros (fix XP negativos)
  const totalXP = Math.max(stats?.total_xp || 0, 0)
  const currentLevel = Math.max(stats?.current_level || 1, 1)
  const streakDays = Math.max(stats?.current_streak || 0, 0)
  const badgeCount = userBadges?.length || 0

  // Calcular progreso de nivel
  const xpPerLevel = 100
  const xpInCurrentLevel = totalXP % xpPerLevel
  const progressPercent = (xpInCurrentLevel / xpPerLevel) * 100

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
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="text-3xl">🏅</span>
          Mis Badges
        </h1>
        <p className="text-white/50">Desbloquea logros completando cursos y actividades</p>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-brand-light/20 via-brand/20 to-purple-500/20 border border-brand-light/30 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Nivel */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-3xl font-bold text-white">Nivel {currentLevel}</p>
            <p className="text-sm text-white/50">Tu nivel actual</p>
          </div>

          {/* XP */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalXP.toLocaleString()}</p>
            <p className="text-sm text-white/50">XP Total</p>
          </div>

          {/* Badges */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-3xl font-bold text-white">{badgeCount}</p>
            <p className="text-sm text-white/50">Badges obtenidos</p>
          </div>

          {/* Racha */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <p className="text-3xl font-bold text-white">{streakDays}</p>
            <p className="text-sm text-white/50">Días de racha</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/70">Progreso al siguiente nivel</span>
            <span className="text-brand-light">{xpInCurrentLevel}/{xpPerLevel} XP</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-light to-brand rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Desbloqueados */}
      {userBadges && userBadges.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Badges Desbloqueados
            <span className="ml-2 px-2 py-0.5 bg-success/20 text-success text-sm rounded-full">
              {userBadges.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userBadges.map((ub: any) => {
              const badge = ub.badge
              const styles = getRarityStyles(badge?.rarity || 'common')
              const icon = getIcon(badge?.icon_url, badge)

              return (
                <div
                  key={ub.id}
                  className={`group relative p-5 rounded-2xl bg-gradient-to-br ${styles.bg} border ${styles.border} ${styles.glow} hover:scale-105 transition-all duration-300`}
                >
                  {/* Icono */}
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center text-4xl">
                      {icon}
                    </div>
                  </div>

                  {/* Nombre */}
                  <h3 className="text-center font-bold text-white text-base mb-1">
                    {badge?.title || badge?.name || 'Badge'}
                  </h3>

                  {/* Descripcion */}
                  <p className="text-center text-sm text-white/60 mb-3 line-clamp-2">
                    {badge?.description}
                  </p>

                  {/* Rareza y XP */}
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles.text} bg-white/10`}>
                      {getRarityLabel(badge?.rarity)}
                    </span>
                    {badge?.xp_reward > 0 && (
                      <span className="text-xs text-brand-light font-medium">
                        +{badge.xp_reward} XP
                      </span>
                    )}
                  </div>

                  {/* Fecha obtenido */}
                  <p className="text-center text-xs text-white/30 mt-3">
                    {ub.unlocked_at ? new Date(ub.unlocked_at).toLocaleDateString('es-ES') : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Badges por Desbloquear */}
      {allBadges && allBadges.filter(b => !earnedBadgeIds.includes(b.id)).length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Badges por Desbloquear
            <span className="ml-2 px-2 py-0.5 bg-white/10 text-white/50 text-sm rounded-full">
              {allBadges.filter(b => !earnedBadgeIds.includes(b.id)).length}
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allBadges
              .filter(b => !earnedBadgeIds.includes(b.id))
              .map((badge: any) => {
                const styles = getRarityStyles(badge.rarity || 'common')
                const icon = getIcon(badge.icon_url, badge)

                return (
                  <div
                    key={badge.id}
                    className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 opacity-60 hover:opacity-80 transition-all"
                  >
                    {/* Icono con grayscale */}
                    <div className="flex justify-center mb-4 grayscale">
                      <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-4xl">
                        {icon}
                      </div>
                    </div>

                    {/* Nombre */}
                    <h3 className="text-center font-bold text-white/70 text-base mb-1">
                      {badge.title || badge.name}
                    </h3>

                    {/* Descripcion */}
                    <p className="text-center text-sm text-white/40 mb-3 line-clamp-2">
                      {badge.description}
                    </p>

                    {/* Rareza */}
                    <div className="flex items-center justify-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${styles.text} bg-white/5`}>
                        {getRarityLabel(badge.rarity)}
                      </span>
                    </div>

                    {/* Lock overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-dark/80 flex items-center justify-center">
                        <span className="text-xl">🔒</span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* Empty state si no hay badges */}
      {(!userBadges || userBadges.length === 0) && (!allBadges || allBadges.length === 0) && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
            <span className="text-4xl">🏅</span>
          </div>
          <p className="text-white/50">No hay badges disponibles aún</p>
          <p className="text-sm text-white/30 mt-1">Completa cursos para desbloquear logros</p>
        </div>
      )}

      {/* Como desbloquear */}
      <section className="p-6 bg-dark-surface border border-white/10 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>💡</span>
          ¿Cómo desbloquear más badges?
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <span className="text-2xl">📚</span>
            <h4 className="font-medium text-white mt-2">Completa lecciones</h4>
            <p className="text-sm text-white/50">Termina lecciones para ganar badges de progreso</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <span className="text-2xl">🎓</span>
            <h4 className="font-medium text-white mt-2">Finaliza cursos</h4>
            <p className="text-sm text-white/50">Completa cursos enteros para badges especiales</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <span className="text-2xl">🔥</span>
            <h4 className="font-medium text-white mt-2">Mantén tu racha</h4>
            <p className="text-sm text-white/50">Estudia varios días seguidos</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <span className="text-2xl">⭐</span>
            <h4 className="font-medium text-white mt-2">Sube de nivel</h4>
            <p className="text-sm text-white/50">Gana XP para desbloquear badges por nivel</p>
          </div>
        </div>
      </section>
    </div>
  )
}
