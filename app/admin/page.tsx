import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import Link from 'next/link'
import { BookOpen, Users, GraduationCap, TrendingUp, Plus, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Dashboard Admin | Nodo360',
}

export default async function AdminDashboardPage() {
  console.log('🎯 [Admin Dashboard] Cargando dashboard')
  await requireAdmin()

  const supabase = await createClient()

  // Stats básicos
  const { count: coursesCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })

  const { count: modulesCount } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })

  const { count: lessonsCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Últimos cursos
  const { data: recentCourses } = await supabase
    .from('courses')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('✅ [Admin Dashboard] Datos cargados')

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Panel de Administración
          </h1>
          <p className="text-[#C5C7D3]">
            Bienvenido al centro de control de Nodo360
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Cursos */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#ff6b35]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#ff6b35]/10 rounded-xl border border-[#ff6b35]/30">
                <BookOpen className="w-6 h-6 text-[#ff6b35]" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {coursesCount || 0}
            </div>
            <div className="text-sm text-[#C5C7D3]">Total Cursos</div>
          </div>

          {/* Total Módulos */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#24D4FF]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#24D4FF]/10 rounded-xl border border-[#24D4FF]/30">
                <GraduationCap className="w-6 h-6 text-[#24D4FF]" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {modulesCount || 0}
            </div>
            <div className="text-sm text-[#C5C7D3]">Total Módulos</div>
          </div>

          {/* Total Lecciones */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#00C98D]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#00C98D]/10 rounded-xl border border-[#00C98D]/30">
                <TrendingUp className="w-6 h-6 text-[#00C98D]" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {lessonsCount || 0}
            </div>
            <div className="text-sm text-[#C5C7D3]">Total Lecciones</div>
          </div>

          {/* Total Usuarios */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#f7931a]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#f7931a]/10 rounded-xl border border-[#f7931a]/30">
                <Users className="w-6 h-6 text-[#f7931a]" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {usersCount || 0}
            </div>
            <div className="text-sm text-[#C5C7D3]">Total Usuarios</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/admin/cursos/nuevo"
            className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#ff6b35]/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff6b35] transition">
                  Crear Nuevo Curso
                </h3>
                <p className="text-[#C5C7D3]">
                  Comienza a crear contenido educativo
                </p>
              </div>
              <Plus className="w-8 h-8 text-[#ff6b35]" />
            </div>
          </Link>

          <Link
            href="/admin/cursos"
            className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#24D4FF]/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#24D4FF] transition">
                  Gestionar Cursos
                </h3>
                <p className="text-[#C5C7D3]">
                  Ver y editar cursos existentes
                </p>
              </div>
              <ArrowRight className="w-8 h-8 text-[#24D4FF]" />
            </div>
          </Link>
        </div>

        {/* Últimos Cursos */}
        {recentCourses && recentCourses.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Últimos Cursos Creados
            </h2>
            <div className="space-y-4">
              {recentCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/admin/cursos/${course.id}`}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-[#24D4FF]/50 transition"
                >
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-[#C5C7D3]">
                      {new Date(course.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      course.status === 'published'
                        ? 'bg-[#00C98D]/10 text-[#00C98D] border border-[#00C98D]/30'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {course.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                    <ArrowRight className="w-5 h-5 text-white/30" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
