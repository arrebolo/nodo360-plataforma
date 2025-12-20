'use client'

import { TrendingUp, Users, BookOpen, DollarSign, Calendar } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/60">Métricas y estadísticas de la plataforma</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          <button className="px-3 py-1.5 text-sm bg-[#ff6b35] text-white rounded-lg">7 días</button>
          <button className="px-3 py-1.5 text-sm text-white/60 hover:text-white">30 días</button>
          <button className="px-3 py-1.5 text-sm text-white/60 hover:text-white">90 días</button>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Usuarios Activos</h3>
            <Users className="w-5 h-5 text-[#ff6b35]" />
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/20 rounded-xl">
            <p className="text-white/40">Gráfico de usuarios</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Ingresos</h3>
            <DollarSign className="w-5 h-5 text-[#ff6b35]" />
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/20 rounded-xl">
            <p className="text-white/40">Gráfico de ingresos</p>
          </div>
        </div>

        {/* Courses Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Cursos Populares</h3>
            <BookOpen className="w-5 h-5 text-[#ff6b35]" />
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/20 rounded-xl">
            <p className="text-white/40">Gráfico de cursos</p>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Actividad Diaria</h3>
            <Calendar className="w-5 h-5 text-[#ff6b35]" />
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/20 rounded-xl">
            <p className="text-white/40">Gráfico de actividad</p>
          </div>
        </div>
      </div>
    </div>
  )
}
