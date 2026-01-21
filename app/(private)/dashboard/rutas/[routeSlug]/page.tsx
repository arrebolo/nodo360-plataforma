import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, BookOpen, Layers, CheckCircle, Play, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLearningPaths, getCoursesByLearningPathSlug } from '@/lib/db/learning-paths'
import { SelectPathButton } from '@/components/routes/SelectPathButton'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ routeSlug: string }>
}): Promise<Metadata> {
  const { routeSlug } = await params
  const paths = await getLearningPaths()
  const path = paths.find((p) => p.slug === routeSlug)

  return {
    title: path ? `${path.name} | Nodo360` : 'Ruta no encontrada',
    description: path?.short_description || 'Ruta de aprendizaje en Nodo360',
  }
}

export default async function RutaDetallePage({
  params,
}: {
  params: Promise<{ routeSlug: string }>
}) {
  const { routeSlug } = await params

  const supabase = await createClient()

  // Fetch user and paths in parallel
  const [{ data: { user } }, paths] = await Promise.all([
    supabase.auth.getUser(),
    getLearningPaths()
  ])

  const path = paths.find((p) => p.slug === routeSlug)
  if (!path) notFound()

  // Fetch courses and user data in parallel
  const [courses, userData] = await Promise.all([
    getCoursesByLearningPathSlug(path.slug),
    user
      ? supabase.from('users').select('active_path_id').eq('id', user.id).single()
      : Promise.resolve({ data: null })
  ])

  const activePathId = userData?.data?.active_path_id ?? null
  const isActive = activePathId === path.id
  const isLoggedIn = !!user

  const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 0), 0)

  // Obtener progreso del usuario para cada curso en paralelo
  const coursesProgress: Record<string, { completed: number; total: number }> = {}

  if (user && courses.length > 0) {
    // Fetch all modules for all courses in one query
    const courseIds = courses.map(c => c.id)
    const { data: allModules } = await supabase
      .from('modules')
      .select('id, course_id')
      .in('course_id', courseIds)

    const moduleIds = allModules?.map(m => m.id) || []

    if (moduleIds.length > 0) {
      // Fetch all lessons and progress in parallel
      const [{ data: allLessons }, { data: allProgress }] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, module_id')
          .in('module_id', moduleIds),
        supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('is_completed', true)
      ])

      // Build lookup maps for efficient processing
      const modulesByCourse: Record<string, string[]> = {}
      allModules?.forEach(m => {
        if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = []
        modulesByCourse[m.course_id].push(m.id)
      })

      const lessonsByModule: Record<string, string[]> = {}
      allLessons?.forEach(l => {
        if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
        lessonsByModule[l.module_id].push(l.id)
      })

      const completedLessons = new Set(allProgress?.map(p => p.lesson_id) || [])

      // Calculate progress for each course
      for (const course of courses) {
        const courseModuleIds = modulesByCourse[course.id] || []
        const courseLessonIds = courseModuleIds.flatMap(mId => lessonsByModule[mId] || [])
        const completedCount = courseLessonIds.filter(lid => completedLessons.has(lid)).length

        coursesProgress[course.id] = {
          completed: completedCount,
          total: courseLessonIds.length
        }
      }
    }
  }

  const getCourseStatus = (courseId: string, totalLessons: number) => {
    if (!user || totalLessons === 0) return 'new'
    const progress = coursesProgress[courseId]
    if (!progress) return 'new'
    if (progress.completed === 0) return 'new'
    if (progress.completed >= progress.total) return 'completed'
    return 'in_progress'
  }

  const getProgressPercentage = (courseId: string) => {
    const progress = coursesProgress[courseId]
    if (!progress || progress.total === 0) return 0
    return Math.round((progress.completed / progress.total) * 100)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-white/60">
        <Link href="/dashboard/rutas" className="hover:text-white transition">
          Rutas
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white/80">{path.name}</span>
      </nav>

      {/* HERO DE LA RUTA */}
      <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {path.emoji && <span className="text-3xl">{path.emoji}</span>}
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {path.name}
              </h1>
            </div>

            {path.short_description && (
              <p className="text-white/70 max-w-2xl">
                {path.short_description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-white/60 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                {courses.length} cursos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {totalLessons} lecciones
              </span>
            </div>
          </div>

          {/* Estado + CTA */}
          <div className="flex flex-col items-start sm:items-end gap-3">
            {isLoggedIn ? (
              <SelectPathButton pathSlug={path.slug} isActive={isActive} />
            ) : (
              <Button variant="primary" href={`/login?redirect=/dashboard/rutas/${path.slug}`}>
                Iniciar sesion
                <span aria-hidden className="text-white/80">→</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* CURSOS DE LA RUTA */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Cursos de esta ruta</h2>
          <p className="text-sm text-white/60 mt-1">
            {courses.length} cursos para completar
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="bg-dark-surface border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/60">Esta ruta todavia no tiene cursos asignados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {courses.map((course: {
              id: string
              title: string
              slug: string
              description?: string | null
              total_modules?: number | null
              total_lessons?: number | null
            }, index) => {
              const status = getCourseStatus(course.id, course.total_lessons || 0)
              const progress = getProgressPercentage(course.id)
              const isComingSoon = (course.total_lessons || 0) === 0

              const borderColor = {
                completed: 'border-l-emerald-500',
                in_progress: 'border-l-brand-orange',
                new: 'border-l-white/20'
              }[status]

              const statusConfig = {
                completed: { text: 'Completado', Icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400' },
                in_progress: { text: 'En progreso', Icon: Play, color: 'bg-brand-orange/20 text-brand-orange' },
                new: { text: 'Nuevo', Icon: Sparkles, color: 'bg-white/10 text-white/60' }
              }[status]

              return (
                <Link key={course.id} href={`/cursos/${course.slug}`} className="block group">
                  <div className={`
                    relative bg-white/5 border border-white/10 rounded-xl
                    border-l-4 ${borderColor}
                    transition-all duration-200
                    hover:bg-white/[0.07] hover:border-white/20 hover:shadow-lg hover:shadow-black/20
                    hover:-translate-y-0.5
                  `}>
                    <div className="p-5 flex gap-4">
                      {/* Número del curso */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white/40">{index + 1}</span>
                      </div>

                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {/* Título + Badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-white group-hover:text-brand-light transition-colors">
                                {course.title}
                              </h3>

                              {!isComingSoon && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                  <statusConfig.Icon className="w-3 h-3" />
                                  {statusConfig.text}
                                </span>
                              )}

                              {isComingSoon && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                                  Proximamente
                                </span>
                              )}
                            </div>

                            {/* Descripción */}
                            {course.description && (
                              <p className="mt-1 text-sm text-white/60 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            {/* Barra de progreso */}
                            {!isComingSoon && user && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                                  <span>{coursesProgress[course.id]?.completed || 0} de {coursesProgress[course.id]?.total || course.total_lessons} lecciones</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      status === 'completed' ? 'bg-emerald-500' : 'bg-brand-orange'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Stats */}
                            <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
                              <span className="inline-flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5" />
                                {course.total_modules || 0} modulos
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                {course.total_lessons || 0} lecciones
                              </span>
                            </div>
                          </div>

                          {/* Botón CTA */}
                          <div className="flex-shrink-0 hidden sm:block">
                            <span className={`
                              inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
                              transition-all duration-200
                              ${status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30'
                                : status === 'in_progress'
                                  ? 'bg-brand-orange text-white group-hover:bg-brand-orange/90'
                                  : 'bg-white/10 text-white group-hover:bg-brand-orange group-hover:text-white'
                              }
                            `}>
                              {status === 'completed' ? 'Repasar' : status === 'in_progress' ? 'Continuar' : 'Empezar'}
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
