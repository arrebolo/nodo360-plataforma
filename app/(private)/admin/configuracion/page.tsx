import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Zap, TrendingUp, Bell, Shield, Database } from 'lucide-react'
import XPConfigForm from './XPConfigForm'
import LevelConfigForm from './LevelConfigForm'

async function getSystemConfig() {
  const supabase = await createClient()

  // XP por acción (valores por defecto) - legacy (si lo sigues usando en otros sitios)
  const xpConfigLegacy = {
    lesson_completed: 50,
    course_completed: 500,
    streak_bonus: 10,
    quiz_passed: 25,
    perfect_score: 50,
    daily_login: 5,
  }

  // ✅ XPConfig esperado por XPConfigForm (contract actual)
  const xpConfig = {
    lesson_complete: xpConfigLegacy.lesson_completed,
    module_complete: 30, // no existe en legacy: default razonable
    course_complete: xpConfigLegacy.course_completed,
    quiz_complete: xpConfigLegacy.quiz_passed,
    daily_streak: xpConfigLegacy.daily_login,
    badge_earned: 50, // no existe en legacy: default
  }

  // Configuración de niveles (valores por defecto)
  const levelConfig = {
    xp_base: 100,
    xp_multiplier: 1.5,
    max_level: 100,
  }

  // Contar estadísticas actuales
  //
  // EL RECUENTO, CON EL SERVICIO. Un count pasa por la RLS igual que un select:
  // con la politica por funcion de la 123, este panel diria «4 usuarios» en vez
  // de los que hay. requireAdmin() en el layout ya ha decidido quien entra aqui.
  const { count: totalUsers } = await createAdminClient()
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })

  const { count: totalBadges } = await supabase
    .from('badges')
    .select('*', { count: 'exact', head: true })

  const { data: xpData } = await supabase
    .from('user_gamification_stats')
    .select('total_xp')

  const totalXP = xpData?.reduce((sum, u) => sum + (u.total_xp || 0), 0) || 0

  return {
    xpConfig,
    levelConfig,
    stats: {
      totalUsers: totalUsers || 0,
      totalCourses: totalCourses || 0,
      totalBadges: totalBadges || 0,
      totalXP,
    },
  }
}

export default async function ConfiguracionPage() {
  await requireAdmin()

  const { xpConfig, levelConfig, stats } = await getSystemConfig()

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
        <p className="text-white/60 mt-1">
          Gestiona los parámetros globales de gamificación y sistema
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Database className="text-blue-400" size={20} />
            </div>
            <span className="text-sm text-white/60">Usuarios</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Database className="text-purple-400" size={20} />
            </div>
            <span className="text-sm text-white/60">Cursos</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalCourses}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Database className="text-yellow-400" size={20} />
            </div>
            <span className="text-sm text-white/60">Hitos</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalBadges}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Zap className="text-emerald-400" size={20} />
            </div>
            <span className="text-sm text-white/60">XP Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalXP.toLocaleString()}</p>
        </div>
      </div>

      {/* Configuración de XP */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-brand/10 to-brand/10 border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Zap className="text-yellow-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Configuración de XP</h2>
              <p className="text-white/60 mt-1">
                Define cuánto XP ganan los usuarios por cada acción
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <XPConfigForm initialConfig={xpConfig} />
        </div>
      </div>

      {/* Configuración de Niveles */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Configuración de Niveles
              </h2>
              <p className="text-white/60 mt-1">
                Establece cómo funcionan los niveles y la progresión
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <LevelConfigForm initialConfig={levelConfig} />
        </div>
      </div>

      {/* Otras Configuraciones (Placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Bell className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white">Notificaciones</h3>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Configura las notificaciones del sistema (próximamente)
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-not-allowed opacity-50">
              <input type="checkbox" disabled className="w-4 h-4 rounded bg-white/5 border-white/10" />
              <span className="text-sm text-white/60">Notificar nuevos hitos</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-not-allowed opacity-50">
              <input type="checkbox" disabled className="w-4 h-4 rounded bg-white/5 border-white/10" />
              <span className="text-sm text-white/60">Notificar subida de nivel</span>
            </label>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="text-red-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white">Seguridad</h3>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Opciones de seguridad del sistema (próximamente)
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-not-allowed opacity-50">
              <input type="checkbox" disabled className="w-4 h-4 rounded bg-white/5 border-white/10" />
              <span className="text-sm text-white/60">Requerir 2FA para admins</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-not-allowed opacity-50">
              <input type="checkbox" disabled className="w-4 h-4 rounded bg-white/5 border-white/10" />
              <span className="text-sm text-white/60">Modo mantenimiento</span>
            </label>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          💡 <strong>Nota:</strong> Los cambios en la configuración de XP y niveles afectan el
          comportamiento del sistema de gamificación. Los cambios se aplican inmediatamente
          después de guardar.
        </p>
      </div>
    </div>
  )
}


