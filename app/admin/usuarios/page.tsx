'use client'

import { Search, MoreVertical, Mail, Ban, CheckCircle } from 'lucide-react'

const usuarios = [
  { id: 1, name: 'Carlos García', email: 'carlos@example.com', plan: 'Premium', status: 'Activo', joined: '2024-01-15' },
  { id: 2, name: 'María López', email: 'maria@example.com', plan: 'Básico', status: 'Activo', joined: '2024-02-20' },
  { id: 3, name: 'Juan Martínez', email: 'juan@example.com', plan: 'Premium', status: 'Suspendido', joined: '2024-03-10' },
  { id: 4, name: 'Ana Rodríguez', email: 'ana@example.com', plan: 'Básico', status: 'Activo', joined: '2024-04-05' },
]

export default function AdminUsuariosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Usuarios</h1>
        <p className="text-white/60">Gestiona los usuarios de la plataforma</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar usuarios..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
        />
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Usuario</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Plan</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Estado</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Registro</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-white/60">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-sm text-white/50">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${user.plan === 'Premium' ? 'bg-[#ff6b35]/20 text-[#ff6b35]' : 'bg-white/10 text-white/60'}`}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${user.status === 'Activo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/70">{user.joined}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-white/50 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
