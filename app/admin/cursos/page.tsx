import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import CourseAdminCard from '@/components/admin/CourseAdminCard'
import Link from 'next/link'
import { Plus, BookOpen, GraduationCap, Users, Clock } from 'lucide-react'

export default async function AdminCoursesPage() {
  console.log('🎯 [Admin Courses] Cargando lista de cursos')

  await requireAdmin('/admin/cursos')
  const supabase = await createClient()

  // Fetch courses with counts
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select(`
      *,
      modules:modules(
        id,
        lessons:lessons(count)
      ),
      enrollments:course_enrollments(count)
    `)
    .order('created_at', { ascending: false })

  if (coursesError) {
    console.error('❌ [Admin Courses] Error al cargar cursos:', coursesError)
  }

  // Calculate stats
  const totalCourses = courses?.length || 0
  const totalModules = courses?.reduce((acc, course) => acc + (course.modules?.length || 0), 0) || 0
  // Count total lessons through modules
  const totalLessons = courses?.reduce((acc, course) => {
    const modulesLessons = course.modules?.reduce((modAcc: number, mod: any) => {
      return modAcc + (mod.lessons?.[0]?.count || 0)
    }, 0) || 0
    return acc + modulesLessons
  }, 0) || 0
  const totalEnrollments = courses?.reduce((acc, course) => acc + (course.enrollments?.[0]?.count || 0), 0) || 0

  console.log('✅ [Admin Courses] Cursos cargados:', totalCourses)

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-[#1a1f2e]/95 via-[#252b3d]/95 to-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 px-8 py-6 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Gestión de Cursos
            </h1>
            <p className="text-white/60 text-sm">
              Administra todo el contenido educativo de la plataforma
            </p>
          </div>

          <Link
            href="/admin/cursos/nuevo"
            className="group px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:from-[#ff7a45] hover:to-[#ffa52a] text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,53,0.4)] flex items-center gap-2"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Crear Curso
          </Link>
        </div>
      </div>

      <div className="px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Cursos */}
          <div className="group relative bg-gradient-to-br from-[#ff6b35]/10 via-white/5 to-white/5 backdrop-blur-sm border border-[#ff6b35]/20 rounded-2xl p-6 hover:border-[#ff6b35]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,53,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center shadow-[0_4px_20px_rgba(255,107,53,0.3)]">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-[#ff6b35] transition-colors">
              {totalCourses}
            </h3>
            <p className="text-sm text-white/60">Total Cursos</p>
            <p className="text-xs text-white/40 mt-1">En la plataforma</p>
          </div>

          {/* Total Módulos */}
          <div className="group relative bg-gradient-to-br from-[#24D4FF]/10 via-white/5 to-white/5 backdrop-blur-sm border border-[#24D4FF]/20 rounded-2xl p-6 hover:border-[#24D4FF]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(36,212,255,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#24D4FF] to-[#1ab8e0] flex items-center justify-center shadow-[0_4px_20px_rgba(36,212,255,0.3)]">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-[#24D4FF] transition-colors">
              {totalModules}
            </h3>
            <p className="text-sm text-white/60">Total Módulos</p>
            <p className="text-xs text-white/40 mt-1">Contenido estructurado</p>
          </div>

          {/* Total Lecciones */}
          <div className="group relative bg-gradient-to-br from-[#00C98D]/10 via-white/5 to-white/5 backdrop-blur-sm border border-[#00C98D]/20 rounded-2xl p-6 hover:border-[#00C98D]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,201,141,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00C98D] to-[#00a877] flex items-center justify-center shadow-[0_4px_20px_rgba(0,201,141,0.3)]">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-[#00C98D] transition-colors">
              {totalLessons}
            </h3>
            <p className="text-sm text-white/60">Total Lecciones</p>
            <p className="text-xs text-white/40 mt-1">Contenido disponible</p>
          </div>

          {/* Total Inscritos */}
          <div className="group relative bg-gradient-to-br from-purple-500/10 via-white/5 to-white/5 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-[0_4px_20px_rgba(168,85,247,0.3)]">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
              {totalEnrollments}
            </h3>
            <p className="text-sm text-white/60">Total Inscritos</p>
            <p className="text-xs text-white/40 mt-1">Estudiantes activos</p>
          </div>
        </div>

        {/* Courses Grid */}
        {courses && courses.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">
              Todos los Cursos ({totalCourses})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseAdminCard
                  key={course.id}
                  course={course}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="relative bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm border border-white/10 rounded-3xl p-16 text-center overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff6b35]/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#24D4FF]/5 rounded-full blur-[100px] animate-pulse delay-1000" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 border border-[#ff6b35]/30 flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-10 h-10 text-[#ff6b35]" />
              </div>

              {/* Text */}
              <h3 className="text-2xl font-bold text-white mb-3">
                No hay cursos creados aún
              </h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Comienza creando tu primer curso para ofrecer contenido educativo de alta calidad a tus estudiantes.
              </p>

              {/* CTA Button */}
              <Link
                href="/admin/cursos/nuevo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:from-[#ff7a45] hover:to-[#ffa52a] text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,107,53,0.4)] hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Crear Primer Curso
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
