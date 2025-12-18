// app/(private)/admin/formadores/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestion de Formadores | Admin Nodo360'
}

interface User {
  full_name: string
  email: string
  avatar_url: string | null
}

interface Specialty {
  name: string
  icon: string
}

interface EducatorSpecialty {
  specialty: Specialty | null
}

interface Educator {
  id: string
  display_name: string
  avatar_url: string | null
  type: string
  status: string
  rating_avg: number | null
  total_sessions: number
  user: User | null
  specialties: EducatorSpecialty[]
}

export default async function AdminFormadoresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que es admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener todos los formadores
  const { data: educators } = await supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, email, avatar_url),
      specialties:educator_specialties (
        specialty:specialty_id (name, icon)
      )
    `)
    .order('created_at', { ascending: false })

  const safeEducators = (educators || []) as Educator[]

  // Contar por estado
  const pending = safeEducators.filter(e => e.status === 'pending').length
  const instructors = safeEducators.filter(e => e.type === 'instructor' && e.status === 'active').length
  const mentors = safeEducators.filter(e => e.type === 'mentor' && e.status === 'active').length

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    active: { label: 'Activo', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    inactive: { label: 'Inactivo', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    suspended: { label: 'Suspendido', color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
              ← Volver al admin
            </Link>
            <h1 className="text-2xl font-bold">Gestion de Formadores</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/formadores/solicitudes"
              className={`px-4 py-2 rounded-lg text-sm transition ${pending > 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/10 text-gray-400'}`}
            >
              Solicitudes ({pending})
            </Link>
            <Link
              href="/admin/formadores/promociones"
              className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-sm"
            >
              Promociones
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold">{safeEducators.length}</div>
            <div className="text-xs text-gray-400">Total formadores</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{pending}</div>
            <div className="text-xs text-gray-400">Pendientes</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-400">{instructors}</div>
            <div className="text-xs text-gray-400">Instructores</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-400">{mentors}</div>
            <div className="text-xs text-gray-400">Mentores</div>
          </div>
        </div>

        {/* Tabla de formadores */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Formador</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Tipo</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Estado</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Especialidades</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Stats</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {safeEducators.map(educator => {
                  const config = statusConfig[educator.status]
                  const isMentor = educator.type === 'mentor'

                  return (
                    <tr key={educator.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                            {educator.avatar_url || educator.user?.avatar_url ? (
                              <img
                                src={educator.avatar_url || educator.user?.avatar_url || ''}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">
                                {educator.display_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{educator.display_name}</div>
                            <div className="text-xs text-gray-400">{educator.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${isMentor ? 'text-amber-400' : 'text-blue-400'}`}>
                          {isMentor ? 'Mentor' : 'Instructor'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {educator.specialties?.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded">
                              {s.specialty?.icon} {s.specialty?.name}
                            </span>
                          ))}
                          {educator.specialties?.length > 2 && (
                            <span className="text-xs text-gray-500">+{educator.specialties.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-400">
                          <span className="text-yellow-400">★</span> {Number(educator.rating_avg || 0).toFixed(1)}
                          <span className="mx-1">-</span>
                          {educator.total_sessions || 0} sesiones
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/formadores/${educator.id}`}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Gestionar →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {safeEducators.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No hay formadores registrados
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
