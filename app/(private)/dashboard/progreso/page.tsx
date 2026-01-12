import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, TrendingUp, BookOpen, Flame, Trophy, Target, Zap } from 'lucide-react'

export const metadata = {
  title: 'Mi Progreso | Nodo360',
  description: 'Estadisticas detalladas de tu aprendizaje'
}

export default async function MiProgresoPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener estadisticas de gamificacion
  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Obtener total de lecciones completadas
  const { count: lessonsCompleted } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_completed', true)

  // Obtener cursos inscritos
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('id, progress_percentage, completed_at')
    .eq('user_id', user.id)

  const totalCourses = enrollments?.length || 0
  const completedCourses = enrollments?.filter((e: any) => e.completed_at)?.length || 0
  const avgProgress = totalCourses > 0
    ? Math.round(enrollments!.reduce((acc: number, e: any) => acc + (e.progress_percentage || 0), 0) / totalCourses)
    : 0

  // Obtener certificados
  const { count: totalCertificates } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Obtener badges
  const { count: totalBadges } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Lecciones completadas esta semana
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: weekLessons } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .gte('completed_at', weekAgo.toISOString())

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        {/* Header */}
        <PageHeader
          icon={TrendingUp}
          title="Mi Progreso"
          subtitle="Estadisticas detalladas de tu aprendizaje"
        />

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            title="XP Total"
            value={stats?.total_xp?.toLocaleString() || '0'}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            title="Nivel"
            value={stats?.current_level || 1}
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            title="Racha"
            value={`${stats?.current_streak || 0} dias`}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Lecciones"
            value={lessonsCompleted || 0}
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            title="Cursos Completados"
            value={`${completedCourses}/${totalCourses}`}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            title="Certificados"
            value={totalCertificates || 0}
          />
        </div>

        {/* Actividad Semanal */}
        <Card className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-lg font-semibold text-white">Actividad Semanal</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-3xl font-bold text-white">{weekLessons || 0}</div>
              <div className="text-sm text-white/50">Lecciones esta semana</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-3xl font-bold text-white">{avgProgress}%</div>
              <div className="text-sm text-white/50">Progreso promedio</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-3xl font-bold text-white">{totalBadges || 0}</div>
              <div className="text-sm text-white/50">Badges obtenidos</div>
            </div>
          </div>
        </Card>

        {/* Nivel y XP */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Progreso de Nivel</h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{stats?.current_level || 1}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/50">XP para siguiente nivel</span>
                <span className="text-white font-medium">
                  {stats?.total_xp?.toLocaleString() || 0} / {stats?.xp_to_next_level?.toLocaleString() || 100} XP
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{
                    width: `${Math.min(100, ((stats?.total_xp || 0) / (stats?.xp_to_next_level || 100)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-white/50">
            Completa lecciones, cursos y desafios para ganar XP y subir de nivel.
          </p>
        </Card>
      </div>
    </div>
  )
}


