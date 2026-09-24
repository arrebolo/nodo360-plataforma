import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, BookOpen, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react'

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

  // El embed de courses es un LEFT JOIN, asi que e.course llega en null
  // cuando el curso deja de ser visible: RLS oculta los que no estan
  // publicados. Sin este filtro, el spread de null dejaba una tarjeta sin id
  // ni slug, con enlace a /cursos/undefined y key duplicada en React.
  // Se descartan esas matriculas en vez de pintarlas rotas: el curso ya no
  // existe para esta persona, y un hueco silencioso es mejor que un enlace
  // que no lleva a ninguna parte.
  // Contenido publicado DESPUES de que esta persona pasara por el curso.
  //
  // Por comparacion de fechas, sin columna nueva: se toma la ultima actividad
  // suya en el curso -su progreso mas reciente, o la fecha en que lo termino-
  // y se cuentan las lecciones creadas despues. Al ampliar un curso de 6 a 9
  // lecciones, quien ya lo habia terminado no se enteraba de nada.
  const cursoIds = ((enrollments || []) as any[]).map((e) => e.course?.id).filter(Boolean)
  const nuevasPorCurso = new Map<string, { total: number; primerSlug: string | null }>()

  if (cursoIds.length > 0) {
    const [{ data: modulos }, { data: misProgresos }] = await Promise.all([
      supabase.from('modules').select('id, course_id').in('course_id', cursoIds),
      supabase.from('user_progress').select('lesson_id, completed_at').eq('user_id', user.id).eq('is_completed', true),
    ])

    const { data: todasLecciones } = await supabase
      .from('lessons')
      .select('id, slug, created_at, module_id, order_index')
      .in('module_id', (modulos || []).map((m: any) => m.id))
      .order('order_index')

    const fechaPorLeccion = new Map((misProgresos || []).map((p: any) => [p.lesson_id, p.completed_at]))

    for (const e of ((enrollments || []) as any[])) {
      if (!e.course?.id) continue
      const modsCurso = (modulos || []).filter((m: any) => m.course_id === e.course.id).map((m: any) => m.id)
      const lecs = (todasLecciones || []).filter((l: any) => modsCurso.includes(l.module_id))
      if (lecs.length === 0) continue

      const fechas = lecs.map((l: any) => fechaPorLeccion.get(l.id)).filter(Boolean) as string[]
      const ultimaActividad = fechas.sort().pop() || e.completed_at
      if (!ultimaActividad) continue

      const nuevas = lecs.filter(
        (l: any) => l.created_at > ultimaActividad && !fechaPorLeccion.has(l.id)
      )
      if (nuevas.length > 0) {
        nuevasPorCurso.set(e.course.id, { total: nuevas.length, primerSlug: nuevas[0].slug })
      }
    }
  }

  const courses = (enrollments || [])
    .filter((e: any) => e.course)
    .map((e: any) => ({
      ...e.course,
      progress: e.progress_percentage || 0,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
      lastAccessed: e.last_accessed_at,
      contenidoNuevo: nuevasPorCurso.get(e.course.id) ?? null,
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
          subtitle={`${courses.length} curso${courses.length !== 1 ? 's' : ''} inscrito${
            courses.length !== 1 ? 's' : ''
          }`}
        />

        {courses.length === 0 ? (
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-light/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-brand-light" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No tienes cursos inscritos
            </h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Explora nuestro catálogo y comienza tu viaje de aprendizaje.
            </p>
            <Button href="/cursos">Ver cursos</Button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* En progreso */}
            {inProgressCourses.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-brand" />
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
                        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-brand transition-colors">
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
                              className="h-2 rounded-full bg-gradient-to-r from-brand-light to-brand transition-all"
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
                      /* Con contenido nuevo, la tarjeta lleva directamente a la
                         primera leccion nueva en vez de al temario: es lo que
                         esa persona ha venido a ver. La tarjeta entera ya es un
                         enlace, asi que no cabe anidar otro dentro del aviso. */
                      href={
                        course.contenidoNuevo?.primerSlug
                          ? `/cursos/${course.slug}/${course.contenidoNuevo.primerSlug}`
                          : `/cursos/${course.slug}`
                      }
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

                        {/* Contenido publicado despues de que lo terminara.
                            La redaccion es deliberada: "se ha ampliado", no
                            "te falta". El curso sigue completado y el
                            certificado sigue siendo valido; esto es una
                            invitacion, no un aviso de que haya perdido algo. */}
                        {course.contenidoNuevo && (
                          <div className="mt-3 rounded-lg border border-brand/30 bg-brand/10 p-3">
                            <p className="text-xs text-white/80">
                              <Sparkles className="mr-1 inline h-3.5 w-3.5 text-brand-light" aria-hidden="true" />
                              Este curso se ha ampliado con{' '}
                              <strong className="text-white">
                                {course.contenidoNuevo.total}{' '}
                                {course.contenidoNuevo.total === 1 ? 'lección nueva' : 'lecciones nuevas'}
                              </strong>{' '}
                              desde que lo terminaste.
                            </p>
                            <p className="mt-1 text-[11px] text-white/50">
                              Tu certificado sigue siendo válido. Pulsa para ir a la primera.
                            </p>
                          </div>
                        )}
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


