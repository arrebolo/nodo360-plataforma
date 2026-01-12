import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'

export const metadata = {
  title: 'Mi Perfil | Nodo360',
  description: 'Actualiza tu información personal y foto de perfil',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, avatar_url, avatar_path, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
              <p className="text-white/60">Actualiza tu información personal</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <ProfileForm
          userId={user.id}
          email={user.email ?? ''}
          initial={{
            full_name: profile?.full_name ?? '',
            avatar_url: profile?.avatar_url ?? null,
            avatar_path: profile?.avatar_path ?? null,
            role: (profile?.role ?? 'student') as 'student' | 'instructor' | 'mentor' | 'admin',
          }}
        />
      </div>
    </div>
  )
}
