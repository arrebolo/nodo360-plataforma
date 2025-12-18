// app/(private)/admin/formadores/solicitudes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solicitudes de Formadores | Admin Nodo360'
}

interface User {
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
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
  tagline: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  user: User | null
  specialties: EducatorSpecialty[]
}

export default async function AdminSolicitudesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener solicitudes pendientes
  const { data: pendingEducators } = await supabase
    .from('educators')
    .select(`
      *,
      user:user_id (full_name, email, avatar_url, created_at),
      specialties:educator_specialties (
        specialty:specialty_id (name, icon)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const safePending = (pendingEducators || []) as Educator[]

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/formadores" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver a formadores
          </Link>
          <h1 className="text-2xl font-bold">Solicitudes Pendientes</h1>
          <p className="text-gray-400 text-sm mt-1">
            {safePending.length} solicitudes por revisar
          </p>
        </div>

        {safePending.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">No hay solicitudes pendientes</h2>
            <p className="text-gray-400">
              Todas las solicitudes han sido procesadas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {safePending.map(educator => (
              <div
                key={educator.id}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                      {educator.avatar_url || educator.user?.avatar_url ? (
                        <img
                          src={educator.avatar_url || educator.user?.avatar_url || ''}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {educator.display_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{educator.display_name}</h3>
                      <p className="text-sm text-gray-400">{educator.user?.email}</p>
                      {educator.tagline && (
                        <p className="text-sm text-gray-300 mt-1">{educator.tagline}</p>
                      )}

                      {/* Especialidades solicitadas */}
                      {educator.specialties && educator.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {educator.specialties.map((s, i) => (
                            <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded">
                              {s.specialty?.icon} {s.specialty?.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bio */}
                      {educator.bio && (
                        <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                          {educator.bio}
                        </p>
                      )}

                      {/* Fecha de solicitud */}
                      <p className="text-xs text-gray-500 mt-3">
                        Solicitado: {new Date(educator.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/formadores/${educator.id}`}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Revisar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
