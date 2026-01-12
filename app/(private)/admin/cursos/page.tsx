import { createClient } from '@/lib/supabase/server'
import CourseAdminCard from '@/components/admin/CourseAdminCard'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Plus, BookOpen, GraduationCap, Users, Clock } from 'lucide-react'

type SearchParams = {
  status?: string
}

function normalizeStatus(status?: string) {
  const raw = (status || '').toLowerCase()
  if (raw === 'draft') return 'draft'
  if (raw === 'published') return 'published'
  return null
}

function statusLabel(status: 'draft' | 'published' | null) {
  if (status === 'draft') return 'Borradores'
  if (status === 'published') return 'Publicados'
  return null
}

// ✅ Metadata dinámica según filtro
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParams
}): Promise<Metadata> {
  const status = normalizeStatus(searchParams?.status)
  const label = statusLabel(status)

  const title = label
    ? `Cursos (${label}) | Admin | Nodo360`
    : 'Cursos | Admin | Nodo360'

  const description = label
    ? `Gestión de cursos (${label.toLowerCase()}) en Nodo360.`
    : 'Gestión de cursos en Nodo360.'

  return { title, description }
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  console.log('🎯 [Admin Courses] Cargando lista de cursos')

  const supabase = await createClient()

  const statusFilter = normalizeStatus(searchParams?.status)
  const label = statusLabel(statusFilter)

  // 🔁 ReturnTo: preserva filtro al navegar a detalle/editar
  const returnTo = statusFilter
    ? `/admin/cursos?status=${statusFilter}`
    : '/admin/cursos'

  // ----------------------------
  // Fetch courses (manteniendo estructura actual para no romper CourseAdminCard)
  // ----------------------------
  let query = supabase
    .from('courses')
    .select(
      `
      *,
      modules:modules(
        id,
        lessons:lessons(count)
      ),
      enrollments:course_enrollments(count)
    `
    )
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)

  const { data: courses, error: coursesError } = await query

  if (coursesError) {
    console.error('❌ [Admin Courses] Error al cargar cursos:', coursesError)
  }

  // ----------------------------
  // Stats globales + resultados filtro
  // ----------------------------
  const resultsCount = courses?.length || 0

  const [
    { count: coursesCount },
    { count: modulesCount },
    { count: lessonsCount },
    { count: enrollmentsCount },
  ] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('modules').select('id', { count: 'exact', head: true }),
    supabase.from('lessons').select('id', { count: 'exact', head: true }),
    supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
  ])

  const totalCoursesGlobal = coursesCount ?? 0
  const totalModulesGlobal = modulesCount ?? 0
  const totalLessonsGlobal = lessonsCount ?? 0
  const totalEnrollmentsGlobal = enrollmentsCount ?? 0

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-dark-surface/95 via-dark-soft/95 to-dark-surface/95 backdrop-blur-lg border-b border-white/10 px-8 py-6 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
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
            className="group px-6 py-3 bg-gradient-to-r from-brand-light to-brand hover:from-brand-light hover:to-brand text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,53,0.4)] flex items-center gap-2"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Crear Curso
          </Link>
        </div>
      </div>

      <div className="px-8">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link
            href="/admin/cursos"
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              !statusFilter
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            Todos
          </Link>
          <Link
            href="/admin/cursos?status=draft"
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              statusFilter === 'draft'
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            Borradores
          </Link>
          <Link
            href="/admin/cursos?status=published"
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              statusFilter === 'published'
                ? 'bg-green-500/10 border-green-500/30 text-green-200'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            Publicados
          </Link>

          <div className="ml-auto flex items-center gap-3 text-sm">
            {label ? (
              <span className="text-white/60">
                Mostrando: <span className="text-white/85">{label}</span>
              </span>
            ) : (
              <span className="text-white/60">
                Mostrando: <span className="text-white/85">Todos</span>
              </span>
            )}

            <span className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-white/70">
              Resultados: <span className="text-white">{resultsCount}</span>
            </span>
          </div>
        </div>

        {/* KPIs globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="group relative bg-gradient-to-br from-brand-light/10 via-white/5 to-white/5 backdrop-blur-sm border border-brand-light/20 rounded-2xl p-6 hover:border-brand-light/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,53,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center shadow-[0_4px_20px_rgba(255,107,53,0.3)]">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-brand-light transition-colors">
              {totalCoursesGlobal}
            </h3>
            <p className="text-sm text-white/60">Total Cursos</p>
            <p className="text-xs text-white/40 mt-1">En la plataforma</p>
          </div>

          <div className="group relative bg-gradient-to-br from-accent-blue/10 via-white/5 to-white/5 backdrop-blur-sm border border-accent-blue/20 rounded-2xl p-6 hover:border-accent-blue/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(36,212,255,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-blue-dark flex items-center justify-center shadow-[0_4px_20px_rgba(36,212,255,0.3)]">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-accent-blue transition-colors">
              {totalModulesGlobal}
            </h3>
            <p className="text-sm text-white/60">Total Módulos</p>
            <p className="text-xs text-white/40 mt-1">Contenido estructurado</p>
          </div>

          <div className="group relative bg-gradient-to-br from-success/10 via-white/5 to-white/5 backdrop-blur-sm border border-success/20 rounded-2xl p-6 hover:border-success/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,201,141,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success-dark flex items-center justify-center shadow-[0_4px_20px_rgba(0,201,141,0.3)]">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-success transition-colors">
              {totalLessonsGlobal}
            </h3>
            <p className="text-sm text-white/60">Total Lecciones</p>
            <p className="text-xs text-white/40 mt-1">Contenido disponible</p>
          </div>

          <div className="group relative bg-gradient-to-br from-purple-500/10 via-white/5 to-white/5 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-[0_4px_20px_rgba(168,85,247,0.3)]">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
              {totalEnrollmentsGlobal}
            </h3>
            <p className="text-sm text-white/60">Total Inscritos</p>
            <p className="text-xs text-white/40 mt-1">Estudiantes activos</p>
          </div>
        </div>

        {/* Grid */}
        {courses && courses.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">
              {label ? (
                <>
                  Cursos ({resultsCount}) — <span className="text-white/70">{label}</span>
                </>
              ) : (
                <>Todos los Cursos ({resultsCount})</>
              )}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => (
                <CourseAdminCard
                  key={course.id}
                  course={course}
                  returnTo={returnTo}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm border border-white/10 rounded-3xl p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-light/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[100px] animate-pulse delay-1000" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-light/20 to-brand/20 border border-brand-light/30 flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-10 h-10 text-brand-light" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {label ? `No hay cursos en ${label.toLowerCase()}` : 'No hay cursos creados aún'}
              </h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                {label
                  ? 'Cambia el filtro o crea un nuevo curso para que aparezca aquí.'
                  : 'Comienza creando tu primer curso para ofrecer contenido educativo de alta calidad a tus estudiantes.'}
              </p>

              <Link
                href="/admin/cursos/nuevo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-light to-brand hover:from-brand-light hover:to-brand text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,107,53,0.4)] hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                {label ? 'Crear Curso' : 'Crear Primer Curso'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
