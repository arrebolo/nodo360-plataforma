import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, BookOpen, CheckCircle2, PlayCircle } from 'lucide-react'

export const metadata = {
  title: 'Mis Cursos | Nodo360',
  description: 'Todos tus cursos inscritos y tu progreso',
}

export default async function MisCursosPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener cursos inscritos con progreso
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      id,
      progress_percentage,
      enrolled_at,
      completed_at,
      last_accessed_at,
      course:courses(
        id,
        slug,
        title,
        description,
        thumbnail_url,
        level
      )
    `)
    .eq('user_id', user.id)
    .order('last_accessed_at', { ascending: false, nullsFirst: false })

  const courses = (enrollments || []).map((e: any) => ({
    ...e.course,
    progress: e.progress_percentage || 0,
    enrolledAt: e.enrolled_at,
    completedAt: e.completed_at,
    lastAccessed: e.last_accessed_at,
  }))

  const completedCourses = courses.filter((c: any) => c.completedAt)
  const inProgressCourses = courses.filter((c: any) => !c.completedAt)

  return (
    <div className="min-h-screen">
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
          icon={BookOpen}
          title="Mis Cursos"
          description={`${courses.length} curso${courses.length !== 1 ? 's' : ''} inscrito${
            courses.length !== 1 ? 's' : ''
          }`}
        />

        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No tienes cursos inscritos
            </h2>
            <p className="text-white/60 mb-6">
              Explora nuestro catálogo y empieza a aprender hoy.
            </p>
            <Button href="/cursos">Ver cursos</Button>
          </Card>
        ) : (
          <div className="space-y-10">
            {/* En progreso */}
            {inProgressCourses.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#f7931a]/20 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-[#f7931a]" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    En progreso ({inProgressCourses.length})
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressCourses.map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/cursos/${course.slug}`}
                      className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
                    >
                      {course.thumbnail_url && (
                        <div className="aspect-video bg-black/20 overflow-hidden">
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="p-5 flex flex-col h-full">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#f7931a] transition-colors">
                          {course.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 capitalize">
                            {course.level || 'básico'}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="mt-auto">
                          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                            <span>Progreso</span>
                            <span>{Math.round(course.progress)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Completados */}
            {completedCourses.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    Completados ({completedCourses.length})
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedCourses.map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/cursos/${course.slug}`}
                      className="group rounded-2xl border border-green-500/30 bg-green-500/5 overflow-hidden hover:bg-green-500/10 transition-all duration-300"
                    >
                      {course.thumbnail_url && (
                        <div className="aspect-video bg-black/20 overflow-hidden relative">
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                          </div>
                        </div>
                      )}

                      <div className="p-5">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Completado
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
