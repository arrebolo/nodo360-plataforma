import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { User, ArrowRight } from 'lucide-react'
import WelcomeHeader from './components/WelcomeHeader'
import StatsGrid from './components/StatsGrid'
import CourseCardPremium from './components/CourseCardPremium'
import AchievementsBadges from './components/AchievementsBadges'
import BookmarksSection from './components/BookmarksSection'
import CertificatesNFT from './components/CertificatesNFT'
import CommunitySection from './components/CommunitySection'

export default async function DashboardPage() {
  console.log('🔍 [Dashboard] Cargando datos del usuario')

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('❌ [Dashboard] Usuario no autenticado')
    redirect('/login')
  }

  // Query 1: Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Query 2: Cursos inscritos con progreso
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      course:courses (
        id,
        title,
        slug,
        thumbnail_url,
        level,
        total_lessons
      )
    `)
    .eq('user_id', user.id)
    .order('last_accessed_at', { ascending: false })

  // Query 3: Progreso de lecciones
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)

  // Query 4: Bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      *,
      lesson:lessons (
        id,
        title,
        slug,
        module:modules (
          course:courses (
            title,
            slug
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Calcular estadísticas
  const completedLessons = progress?.filter(p => p.is_completed).length || 0
  const totalWatchTime = progress?.reduce((acc, p) => acc + (p.watch_time_seconds || 0), 0) || 0
  const hoursStudied = Math.round(totalWatchTime / 3600)

  // Mock de logros (implementar después con tabla real)
  const achievements = 2

  const stats = [
    { icon: '📚', label: 'Cursos activos', value: enrollments?.length || 0, change: '+2 esta semana' },
    { icon: '✅', label: 'Lecciones completadas', value: completedLessons, change: completedLessons > 0 ? '+3 hoy 🎯' : '' },
    { icon: '🔥', label: 'Días de racha', value: 7, change: '¡Record! 🌟' },
    { icon: '🏆', label: 'Logros obtenidos', value: achievements, change: '+1 nuevo ⭐' }
  ]

  console.log('✅ [Dashboard] Datos cargados correctamente')

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      {/* Fondo animado con gradiente */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#1a1f2e] via-[#2a2844] to-[#1a1f2e] animate-gradient" />

      {/* Contenido principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Header */}
        <WelcomeHeader
          name={profile?.full_name || user.email?.split('@')[0] || 'Usuario'}
          streak={7}
        />

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Card: Personalizar Perfil */}
        <div className="mt-8">
          <Link
            href="/dashboard/perfil"
            className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#00C98D]/50 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#00C98D]/10 rounded-xl border border-[#00C98D]/30 group-hover:bg-[#00C98D]/20 transition">
                <User className="w-6 h-6 text-[#00C98D]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#00C98D] transition">
                  Personaliza tu Perfil
                </h3>
                <p className="text-[#C5C7D3] text-sm">
                  Elige tu avatar y actualiza tu información
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#00C98D] group-hover:translate-x-1 transition" />
          </Link>
        </div>

        {/* Sección: Mis Cursos */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🎯 Continúa tu aprendizaje</h2>
            <a
              href="/cursos"
              className="text-[#ff6b35] hover:text-[#f7931a] transition-colors"
            >
              Ver todos los cursos →
            </a>
          </div>

          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-6">
              {enrollments.slice(0, 3).map((enrollment) => {
                const courseProgress = progress?.filter(
                  p => p.lesson_id // Aquí necesitarías join con lessons para filtrar por curso
                ).length || 0

                const progressPercentage = enrollment.progress_percentage || 0

                return (
                  <CourseCardPremium
                    key={enrollment.id}
                    course={{
                      id: enrollment.course.id,
                      title: enrollment.course.title,
                      slug: enrollment.course.slug,
                      thumbnail: enrollment.course.thumbnail_url || '/placeholder-course.jpg',
                      level: enrollment.course.level,
                      progress: progressPercentage,
                      totalLessons: enrollment.course.total_lessons || 0,
                      completedLessons: courseProgress,
                      lastLesson: 'Última lección vista' // Implementar lógica real
                    }}
                  />
                )
              })}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
              <p className="text-xl mb-4">📚 Aún no tienes cursos</p>
              <p className="text-white/60 mb-6">¡Explora nuestro catálogo y empieza a aprender!</p>
              <a
                href="/cursos"
                className="inline-block bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
              >
                Explorar Cursos
              </a>
            </div>
          )}
        </section>

        {/* Logros y Badges */}
        <AchievementsBadges />

        {/* Grid: Bookmarks + Certificados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          <BookmarksSection bookmarks={bookmarks || []} />
          <CertificatesNFT />
        </div>

        {/* Comunidad */}
        <CommunitySection />

      </div>
    </div>
  )
}
