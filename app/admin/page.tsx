'use client'

import { Users, BookOpen, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const stats = [
  {
    title: 'Usuarios Totales',
    value: '1,234',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Cursos Activos',
    value: '24',
    change: '+2',
    trend: 'up',
    icon: BookOpen,
  },
  {
    title: 'Ingresos del Mes',
    value: '$12,450',
    change: '+8.2%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    title: 'Tasa de Completado',
    value: '67%',
    change: '-2.1%',
    trend: 'down',
    icon: TrendingUp,
  },
]

const recentUsers = [
  { name: 'Carlos García', email: 'carlos@example.com', date: 'Hace 2 horas', plan: 'Premium' },
  { name: 'María López', email: 'maria@example.com', date: 'Hace 5 horas', plan: 'Básico' },
  { name: 'Juan Martínez', email: 'juan@example.com', date: 'Hace 1 día', plan: 'Premium' },
  { name: 'Ana Rodríguez', email: 'ana@example.com', date: 'Hace 2 días', plan: 'Básico' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60">Bienvenido al panel de administración de Nodo360</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#ff6b35]/20 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-[#ff6b35]" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-white/50">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Usuarios Recientes</h2>
          <div className="space-y-4">
            {recentUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{user.name}</p>
                    <p className="text-xs text-white/50">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${user.plan === 'Premium' ? 'bg-[#ff6b35]/20 text-[#ff6b35]' : 'bg-white/10 text-white/60'}`}>
                    {user.plan}
                  </span>
                  <p className="text-xs text-white/40 mt-1">{user.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors">
              <BookOpen className="w-6 h-6 text-[#ff6b35] mb-2" />
              <p className="text-sm text-white font-medium">Nuevo Curso</p>
              <p className="text-xs text-white/50">Crear curso</p>
            </button>
            <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors">
              <Users className="w-6 h-6 text-[#ff6b35] mb-2" />
              <p className="text-sm text-white font-medium">Invitar Usuario</p>
              <p className="text-xs text-white/50">Enviar invitación</p>
            </button>
            <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors">
              <DollarSign className="w-6 h-6 text-[#ff6b35] mb-2" />
              <p className="text-sm text-white font-medium">Ver Pagos</p>
              <p className="text-xs text-white/50">Transacciones</p>
            </button>
            <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors">
              <TrendingUp className="w-6 h-6 text-[#ff6b35] mb-2" />
              <p className="text-sm text-white font-medium">Analytics</p>
              <p className="text-xs text-white/50">Ver métricas</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
