import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLearningPathWithProgress } from '@/lib/db/learning-paths'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: path } = await supabase
    .from('learning_paths')
    .select('name, short_description')
    .eq('slug', slug)
    .maybeSingle()

  return {
    title: path ? `${path.name} | Nodo360` : 'Ruta no encontrada',
    description: path?.short_description || 'Ruta de aprendizaje en Nodo360',
  }
}

export default async function RouteDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener ruta con progreso
  const path = await getLearningPathWithProgress(slug, user?.id ?? null)

  if (!path) {
    notFound()
  }

  // Determinar URL del botón principal
  const getContinueUrl = () => {
    if (!path.first_incomplete_course_slug) return null

    if (path.first_incomplete_lesson_slug) {
      return `/cursos/${path.first_incomplete_course_slug}/${path.first_incomplete_lesson_slug}`
    }
    return `/cursos/${path.first_incomplete_course_slug}`
  }

  const continueUrl = getContinueUrl()
  const isCompleted = path.route_progress_percent === 100 && path.total_lessons > 0

  return (
    <main className="min-h-screen bg-[#070a10]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/rutas"
            className="inline-flex items-center gap-1.5 text-sm text-amber-400/80 hover:text-amber-400 transition-colors"
          >
            <span>←</span>
            <span>Todas las rutas</span>
          </Link>
        </nav>

        {/* Header con progreso */}
        <header className="mb-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Info de la ruta */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{path.emoji || '📚'}</span>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {path.name}
                </h1>
              </div>

              {path.short_description && (
                <p className="text-neutral-300 text-base max-w-2xl">
                  {path.short_description}
                </p>
              )}

              {path.long_description && (
                <p className="mt-2 text-neutral-500 text-sm max-w-2xl">
                  {path.long_description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {path.courses.length} curso{path.courses.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  {path.total_lessons} lecciones
                </span>
                {user && path.completed_lessons > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {path.completed_lessons} completadas
                  </span>
                )}
              </div>
            </div>

            {/* Progreso y CTA */}
            <div className="flex flex-col items-center md:items-end gap-4 min-w-[200px]">
              {user ? (
                <>
                  {/* Barra de progreso */}
                  <div className="w-full max-w-[200px]">
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>Progreso</span>
                      <span>{path.route_progress_percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${path.route_progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Botón CTA */}
                  {isCompleted ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <span>✓</span>
                      <span>Ruta completada</span>
                    </div>
                  ) : continueUrl ? (
                    <Link
                      href={continueUrl}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-all hover:-translate-y-0.5"
                    >
                      {path.route_progress_percent > 0 ? 'Continuar ruta' : 'Empezar ruta'}
                      <span>→</span>
                    </Link>
                  ) : null}
                </>
              ) : (
                <div className="text-center md:text-right">
                  <p className="text-sm text-neutral-400 mb-2">
                    Inicia sesión para seguir tu progreso
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-all"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Lista de cursos */}
        {path.courses.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 rounded-2xl border border-white/5 bg-white/5">
            <span className="text-5xl block mb-4">📭</span>
            <p className="text-lg">Esta ruta aún no tiene cursos configurados.</p>
            <p className="text-sm mt-2">¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              Cursos en esta ruta
            </h2>

            {path.courses.map((course, index) => {
              const isCurrentCourse = course.slug === path.first_incomplete_course_slug
              const isPreviousCompleted = index === 0 || path.courses[index - 1]?.progress_percent === 100
              const canAccess = course.status === 'published' && (index === 0 || isPreviousCompleted || course.progress_percent > 0)

              return (
                <div
                  key={course.id}
                  className={`relative rounded-2xl border p-5 transition-all ${
                    isCurrentCourse
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : course.progress_percent === 100
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Número de orden */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                        course.progress_percent === 100
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isCurrentCourse
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-white/10 text-neutral-400'
                      }`}
                    >
                      {course.progress_percent === 100 ? '✓' : index + 1}
                    </div>

                    {/* Info del curso */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white truncate">
                          {course.title}
                        </h3>

                        {/* Badge de estado */}
                        {course.status !== 'published' ? (
                          <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            Próximamente
                          </span>
                        ) : course.is_free ? (
                          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            Gratis
                          </span>
                        ) : null}
                      </div>

                      {course.description && (
                        <p className="text-sm text-neutral-400 line-clamp-2 mb-2">
                          {course.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        <span>{course.lessons_count} lecciones</span>

                        {user && course.status === 'published' && (
                          <>
                            <span>•</span>
                            <span
                              className={
                                course.progress_percent === 100
                                  ? 'text-emerald-400'
                                  : course.progress_percent > 0
                                  ? 'text-amber-400'
                                  : ''
                              }
                            >
                              {course.progress_percent === 100
                                ? 'Completado'
                                : course.progress_percent > 0
                                ? `${course.progress_percent}% completado`
                                : 'No empezado'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Barra de progreso del curso */}
                      {user && course.status === 'published' && course.progress_percent > 0 && (
                        <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              course.progress_percent === 100
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${course.progress_percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Botón de acción */}
                    <div className="shrink-0">
                      {course.status === 'published' ? (
                        canAccess ? (
                          <Link
                            href={
                              course.first_incomplete_lesson_slug
                                ? `/cursos/${course.slug}/${course.first_incomplete_lesson_slug}`
                                : `/cursos/${course.slug}`
                            }
                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 ${
                              isCurrentCourse
                                ? 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-black'
                                : course.progress_percent === 100
                                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                            }`}
                          >
                            {course.progress_percent === 100
                              ? 'Repasar'
                              : course.progress_percent > 0
                              ? 'Continuar'
                              : 'Empezar'}
                            <span>→</span>
                          </Link>
                        ) : (
                          <div className="text-xs text-neutral-500 text-right max-w-[120px]">
                            Completa el curso anterior
                          </div>
                        )
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-500">
                          🔒
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
