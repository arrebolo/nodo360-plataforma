import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvatarSelector } from '@/components/profile/AvatarSelector'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Mi Perfil | Nodo360'
}

export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e] p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[#C5C7D3] hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Mi Perfil</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Avatar Selector */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Avatar</h2>
            <AvatarSelector
              currentAvatar={profile?.avatar_url}
              userName={profile?.full_name || 'Usuario'}
              userId={user.id}
            />
          </div>

          {/* Información del perfil */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Información</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Nombre completo
                  </label>
                  <p className="text-white font-medium">{profile?.full_name || 'No especificado'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Email
                  </label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Rol
                  </label>
                  <p className="text-white font-medium capitalize">{profile?.role || 'student'}</p>
                </div>
              </div>
            </div>

            {/* Botón editar perfil (futuro) */}
            <button className="w-full px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition">
              Editar información
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
