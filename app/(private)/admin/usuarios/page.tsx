import { requireAdmin } from '@/lib/admin/auth'
import { getUsers, getUserRoleCounts } from '@/lib/admin/queries'
import Link from 'next/link'
import { User, Mail, Calendar, TrendingUp, Shield, Search } from 'lucide-react'
import BetaToggle from '@/components/admin/BetaToggle'

export const metadata = {
  title: 'Usuarios',
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
  const busqueda = params.search ?? ''
  const rol = params.role ?? ''

  const [{ users, total }, recuentos] = await Promise.all([
    getUsers(page, 20, busqueda, rol),
    getUserRoleCounts(),
  ])

  const totalPages = Math.ceil(total / 20)
  const hayFiltro = Boolean(busqueda.trim() || rol)

  // Los enlaces de paginacion tienen que llevarse el filtro puesto.
  //
  // Antes eran `?page=N` a secas: pulsar Siguiente con una busqueda activa
  // devolvia la lista entera desde la pagina 2, sin avisar de que el filtro se
  // habia perdido.
  const enlace = (n: number) => {
    const q = new URLSearchParams()
    if (busqueda.trim()) q.set('search', busqueda.trim())
    if (rol) q.set('role', rol)
    if (n > 1) q.set('page', String(n))
    const cola = q.toString()
    return cola ? `/admin/usuarios?${cola}` : '/admin/usuarios'
  }

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
          <p className="text-2xl font-bold text-white">{recuentos.total}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-500/10 rounded-lg">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs text-white/60">Admins</span>
          </div>
          <p className="text-2xl font-bold text-white">{recuentos.admins}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-xs text-white/60">Mentores</span>
          </div>
          <p className="text-2xl font-bold text-white">{recuentos.mentores}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs text-white/60">Instructores</span>
          </div>
          <p className="text-2xl font-bold text-white">{recuentos.instructores}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/50/10 rounded-lg">
              <User className="w-4 h-4 text-white/60" />
            </div>
            <span className="text-xs text-white/60">Estudiantes</span>
          </div>
          <p className="text-2xl font-bold text-white">{recuentos.estudiantes}</p>
        </div>
      </div>

      {/*
        BUSQUEDA Y FILTRO, con un formulario GET y sin componente de cliente.
        El comentario anterior decia que la funcionalidad exigia uno; no lo exige.
        Un <form method="get"> pone lo escrito en la URL, que es justo donde esta
        pagina ya leia `search` y `role`: los tenia declarados en SearchParams y no
        los usaba. Asi se puede compartir el enlace de una busqueda, funciona sin
        JavaScript, y el filtrado ocurre en la base y no en memoria.
      */}
      <form method="get" action="/admin/usuarios" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              name="search"
              defaultValue={busqueda}
              placeholder="Buscar por nombre o email..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:border-brand-light/50"
            />
          </div>
          <select
            name="role"
            defaultValue={rol}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-light/50"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="mentor">Mentor</option>
            <option value="instructor">Instructor</option>
            <option value="student">Estudiante</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Buscar
          </button>
          {hayFiltro && (
            <Link
              href="/admin/usuarios"
              className="px-4 py-2 rounded-lg bg-white/10 text-white/70 font-medium text-sm hover:bg-white/15 transition-colors text-center"
            >
              Limpiar
            </Link>
          )}
        </div>
        {hayFiltro && (
          <p className="text-xs text-white/60 mt-3">
            {total} {total === 1 ? 'resultado' : 'resultados'}
            {busqueda.trim() ? ` para "${busqueda.trim()}"` : ''}
            {rol ? ` con rol ${rol}` : ''}
          </p>
        )}
        {recuentos.sinConfirmar > 0 && !hayFiltro && (
          <p className="text-xs text-amber-400/80 mt-3">
            Hay {recuentos.sinConfirmar} cuenta{recuentos.sinConfirmar === 1 ? '' : 's'} sin
            confirmar. No cuentan en las tarjetas y se borran solas a los 7 dias del registro.
          </p>
        )}
      </form>

      {/* Users Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-white/60">Usuario</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Email</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Rol</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Beta</th>
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
                    {/*
                      SIN CONFIRMAR: la fila existe porque Supabase tiene que crear
                      la cuenta para poder confirmarla, pero esa direccion no se ha
                      verificado. No cuenta en las tarjetas ni en las estadisticas, y
                      aqui se dice en vez de disimularlo. Se borra sola a los 7 dias.
                    */}
                    {!user.email_confirmed_at && (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">
                        Sin confirmar
                      </span>
                    )}
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
                    <BetaToggle
                      userId={user.id}
                      initialValue={user.is_beta || false}
                      userRole={user.role}
                    />
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
                  href={enlace(page - 1)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={enlace(page + 1)}
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

