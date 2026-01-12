import { requireAdmin } from '@/lib/admin/auth'
import { getUsers } from '@/lib/admin/queries'
import Link from 'next/link'
import { User, Mail, Calendar, TrendingUp, Shield, Search } from 'lucide-react'

export const metadata = {
  title: 'Usuarios - Admin Panel | Nodo360',
}

interface SearchParams {
  page?: string
  search?: string
  role?: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const { users, total } = await getUsers(page, 20)

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Usuarios</h1>
        <p className="text-white/60">Gestiona los usuarios de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs text-white/60">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-500/10 rounded-lg">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs text-white/60">Admins</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-xs text-white/60">Mentores</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {users.filter(u => u.role === 'mentor').length}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs text-white/60">Instructores</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {users.filter(u => u.role === 'instructor').length}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/50/10 rounded-lg">
              <User className="w-4 h-4 text-white/60" />
            </div>
            <span className="text-xs text-white/60">Estudiantes</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {users.filter(u => u.role === 'student').length}
          </p>
        </div>
      </div>

      {/* Filters - Simple search UI (functionality requires client component) */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:border-brand-light/50"
              disabled
            />
          </div>
          <select
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-light/50"
            disabled
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="mentor">Mentor</option>
            <option value="instructor">Instructor</option>
            <option value="student">Estudiante</option>
          </select>
        </div>
        <p className="text-xs text-white/60 mt-2">
          Búsqueda y filtros - próximamente
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-white/60">Usuario</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Email</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Rol</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Nivel</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">XP</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Registro</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-light/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-light" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.full_name || 'Sin nombre'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                          : user.role === 'mentor'
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                          : user.role === 'instructor'
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                          : 'bg-white/50/10 text-white/60 border border-white/30/30'
                      }`}
                    >
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'mentor'
                        ? 'Mentor'
                        : user.role === 'instructor'
                        ? 'Instructor'
                        : 'Estudiante'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white font-medium">
                      Nivel {(Array.isArray(user.user_gamification_stats)
                        ? user.user_gamification_stats[0]?.current_level
                        : user.user_gamification_stats?.current_level) || 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60">
                      {((Array.isArray(user.user_gamification_stats)
                        ? user.user_gamification_stats[0]?.total_xp
                        : user.user_gamification_stats?.total_xp) || 0).toLocaleString()} XP
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/usuarios/${user.id}`}
                      className="text-brand-light hover:text-brand-light/80 text-sm font-medium transition"
                    >
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-white/10 p-4 flex items-center justify-between">
            <p className="text-sm text-white/60">
              Página {page} de {totalPages} ({total} usuarios)
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/usuarios?page=${page - 1}`}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/usuarios?page=${page + 1}`}
                  className="px-4 py-2 bg-brand-light hover:bg-brand-light/80 rounded-lg text-white text-sm transition"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

