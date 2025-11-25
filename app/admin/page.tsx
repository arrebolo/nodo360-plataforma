import { requireAdmin } from '@/lib/admin/auth'
import { getAdminStats } from '@/lib/admin/queries'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Users, GraduationCap, TrendingUp, Plus, ArrowRight, Trophy, Zap, Target, Award } from 'lucide-react'

export const metadata = {
  title: 'Dashboard Admin | Nodo360',
}

export default async function AdminDashboardPage() {
  console.log('🎯 [Admin Dashboard] Cargando dashboard')
  await requireAdmin()

  const supabase = await createClient()
  const stats = await getAdminStats()

  // Últimos cursos
  const { data: recentCourses } = await supabase
    .from('courses')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('✅ [Admin Dashboard] Datos cargados', stats)

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Vista general del sistema</p>
        </div>

        {/* Stats Grid - Contenido */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Cursos */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#ff6b35]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#ff6b35]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[#ff6b35]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.courses}
            </div>
            <div className="text-sm text-gray-400">Total Cursos</div>
          </div>

          {/* Total Usuarios */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#24D4FF]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#24D4FF]/10 rounded-lg">
                <Users className="w-6 h-6 text-[#24D4FF]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.users}
            </div>
            <div className="text-sm text-gray-400">Total Usuarios</div>
          </div>

          {/* Total Lecciones */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#00C98D]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#00C98D]/10 rounded-lg">
                <GraduationCap className="w-6 h-6 text-[#00C98D]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.lessons}
            </div>
            <div className="text-sm text-gray-400">Total Lecciones</div>
          </div>

          {/* Total Hitos */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#f7931a]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#f7931a]/10 rounded-lg">
                <Trophy className="w-6 h-6 text-[#f7931a]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.badges}
            </div>
            <div className="text-sm text-gray-400">Hitos Disponibles</div>
          </div>
        </div>

        {/* Stats Grid - Actividad */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Usuarios Activos */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.activeUsers}
            </div>
            <div className="text-sm text-gray-400">Usuarios Activos (7d)</div>
          </div>

          {/* XP Esta Semana */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Target className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalXpThisWeek.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">XP Otorgado (7d)</div>
          </div>

          {/* Hitos Hoy */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Award className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.badgesUnlockedToday}
            </div>
            <div className="text-sm text-gray-400">Hitos Desbloqueados Hoy</div>
          </div>

          {/* Lecciones Completadas Hoy */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.lessonsCompletedToday}
            </div>
            <div className="text-sm text-gray-400">Lecciones Completadas Hoy</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/cursos/nuevo"
            className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-[#ff6b35]/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Plus className="w-6 h-6 text-[#ff6b35]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Crear Nuevo Curso
            </h3>
            <p className="text-sm text-gray-400">
              Comienza a crear contenido
            </p>
          </Link>

          <Link
            href="/admin/usuarios"
            className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-[#24D4FF]/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Users className="w-6 h-6 text-[#24D4FF]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Gestionar Usuarios
            </h3>
            <p className="text-sm text-gray-400">
              Ver y editar usuarios
            </p>
          </Link>

          <Link
            href="/admin/gamificacion"
            className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-[#f7931a]/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-6 h-6 text-[#f7931a]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Gamificación
            </h3>
            <p className="text-sm text-gray-400">
              Hitos, XP y niveles
            </p>
          </Link>
        </div>

        {/* Últimos Cursos */}
        {recentCourses && recentCourses.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Últimos Cursos Creados
              </h2>
              <Link
                href="/admin/cursos"
                className="text-sm text-[#ff6b35] hover:text-[#ff8c5a] transition flex items-center gap-1"
              >
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/admin/cursos/${course.id}`}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-[#ff6b35]/50 transition"
                >
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {new Date(course.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      course.status === 'published'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {course.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}
