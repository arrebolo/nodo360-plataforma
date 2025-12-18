import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { Trophy, Zap, BookOpen, Award, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Mi Perfil | Nodo360',
  description: 'Gestiona tu perfil y datos personales',
}

export default async function PerfilPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/perfil')
  }

  // Obtener datos del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Obtener estadísticas de gamificación
  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Contar cursos y certificados
  const { count: coursesCount } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: certificatesCount } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: completedLessons } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_completed', true)

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
      })
    : 'N/A'

  return (
    <div className="min-h-screen bg-[#0a0d14]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Stats */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Trophy className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-gray-400">Nivel</span>
                  </div>
                  <span className="text-xl font-bold text-white">{stats?.current_level || 1}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Zap className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-gray-400">XP Total</span>
                  </div>
                  <span className="text-xl font-bold text-white">{stats?.total_xp?.toLocaleString() || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-gray-400">Cursos</span>
                  </div>
                  <span className="text-xl font-bold text-white">{coursesCount || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Award className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-gray-400">Certificados</span>
                  </div>
                  <span className="text-xl font-bold text-white">{certificatesCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-5 h-5" />
                <span>Miembro desde {memberSince}</span>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {completedLessons || 0} lecciones completadas
              </div>
            </div>

            {/* Racha */}
            {stats?.current_streak && stats.current_streak > 0 && (
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.current_streak} días</p>
                    <p className="text-orange-400 text-sm">Racha actual</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha - Formulario */}
          <div className="lg:col-span-2">
            <ProfileForm
              initialData={{
                id: user.id,
                email: user.email || '',
                full_name: profile?.full_name || '',
                avatar_url: profile?.avatar_url || '',
                bio: profile?.bio || '',
                website: profile?.website || '',
                twitter: profile?.twitter || '',
                linkedin: profile?.linkedin || '',
                github: profile?.github || '',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
