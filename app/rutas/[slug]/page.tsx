import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, BookOpen, Layers, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLearningPathBySlug, getCoursesByLearningPathSlug } from '@/lib/db/learning-paths'
import { Footer } from '@/components/navigation/Footer'
import { PathUnavailable } from '@/components/learning-path/PathUnavailable'
import { CoursePreviewBanner } from '@/components/course/CoursePreviewBanner'
import { isCurrentUserAdmin } from '@/lib/auth/isAdmin'
import { CourseListJsonLd } from '@/components/seo/JsonLd'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const path = await getLearningPathBySlug(slug)

  if (!path) {
    return { title: 'Ruta no encontrada' }
  }

  // Una ruta sin cursos publicados no se indexa: lo unico que hay que ver es la
  // pagina de "en preparacion".
  const courses = await getCoursesByLearningPathSlug(slug)
  const hayPublicados = courses.some((c) => c.status === 'published')

  // Solo el nombre: el "| Nodo360" lo pone la plantilla de app/layout.tsx.
  // Llevaba ademas un "| Rutas" propio, asi que estas paginas acababan en
  // "| Rutas | Nodo360" y los terminos del glosario en "| Glosario | Nodo360",
  // cada seccion con un formato distinto.
  const titulo = path.name
  // og:title no pasa por la plantilla del layout: la marca se pone aqui para
  // que la tarjeta compartida diga lo mismo que la pestana.
  const tituloConMarca = `${titulo} | Nodo360`
  const descripcion =
    path.short_description || `Ruta de aprendizaje en Nodo360: ${path.name}.`
  const url = `/rutas/${slug}`

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      siteName: 'Nodo360',
      url,
      title: tituloConMarca,
      description: descripcion,
    },
    twitter: {
      card: 'summary_large_image',
      title: tituloConMarca,
      description: descripcion,
    },
    ...(hayPublicados ? {} : { robots: { index: false, follow: false } }),
  }
}

/** El nivel del curso, en la palabra que lee el alumno. */
function etiquetaDeNivel(nivel: string | null): string {
  switch (nivel) {
    case 'beginner':
      return 'Principiante'
    case 'intermediate':
      return 'Intermedio'
    case 'advanced':
      return 'Avanzado'
    default:
      return ''
  }
}

export default async function RutaDetallePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Pagina publica: se puede leer sin sesion. Antes redirigia a /login, de modo
  // que un buscador indexaba el formulario de acceso en lugar de la ruta y un
  // visitante no llegaba a ver nunca que se estudia en ella. La sesion solo
  // hace falta para la accion de empezar la ruta, mas abajo.
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener ruta
  const path = await getLearningPathBySlug(slug)
  if (!path) {
    notFound()
  }

  // Obtener cursos de la ruta
  const courses = await getCoursesByLearningPathSlug(slug)
  const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 0), 0)

  // Una ruta sin ningun curso publicado no tiene nada que ofrecer todavia.
  // Los admin si la ven, vacia, para poder gestionarla.
  const hayPublicados = courses.some((c) => c.status === 'published')
  const esAdmin = user ? await isCurrentUserAdmin(user.id) : false

  if (!hayPublicados && !esAdmin) {
    return <PathUnavailable pathName={path.name} pathSlug={slug} />
  }

  // Verificar si el usuario tiene esta ruta activa. Sin sesion no hay ruta
  // activa que comprobar, y la consulta se ahorra.
  const { data: userData } = user
    ? await supabase
        .from('users')
        .select('active_path_id')
        .eq('id', user.id)
        .single()
    : { data: null }

  const isActive = userData?.active_path_id === path.id

  return (
    <div className="min-h-screen bg-dark">
      {/* La ruta, para un buscador: una secuencia ordenada de cursos y no una
          pagina con enlaces sueltos. Solo cuando hay algo publicado; una lista
          vacia no describe nada. */}
      {hayPublicados && (
        <CourseListJsonLd
          name={path.name}
          description={path.short_description}
          courses={courses.map((curso) => ({
            slug: curso.slug,
            title: curso.title,
            description: curso.description,
            is_free: curso.is_free ?? true,
          }))}
        />
      )}
      {!hayPublicados && (
        <CoursePreviewBanner message="esta ruta no tiene cursos publicados y no aparece en el listado." />
      )}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/60">
          <Link href="/rutas" className="hover:text-white transition">
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

              {path.subtitle && (
                <p className="text-lg text-white/80">
                  {path.subtitle}
                </p>
              )}

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

            {/* Estado. Sin sesion, lo unico que pide login es esta accion, y
                vuelve aqui despues de entrar. Con sesion, lo de siempre. */}
            <div className="flex flex-col items-start sm:items-end gap-3">
              {!user ? (
                <Link
                  href={`/login?redirect=/rutas/${slug}`}
                  className="px-4 py-2 bg-brand-light hover:bg-brand text-white font-medium rounded-lg transition-colors"
                >
                  Empezar esta ruta
                </Link>
              ) : isActive ? (
                <div className="px-4 py-2 bg-success/20 border border-success/30 rounded-lg">
                  <span className="text-success font-medium">Ruta activa</span>
                </div>
              ) : (
                <Link
                  href={`/dashboard/rutas/${path.slug}`}
                  className="px-4 py-2 bg-brand-light hover:bg-brand text-white font-medium rounded-lg transition-colors"
                >
                  Seleccionar ruta
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Descripción larga - Glassmorphism card */}
        {path.long_description && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              {path.emoji && <span>{path.emoji}</span>}
              Sobre esta ruta
            </h2>
            <p className="text-white/70 whitespace-pre-wrap leading-relaxed">{path.long_description}</p>
          </div>
        )}

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
              <p className="text-white/60">Esta ruta todavía no tiene cursos asignados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const isComingSoon = (course.total_lessons || 0) === 0

                return (
                  <Link key={course.id} href={`/cursos/${course.slug}`} className="block group">
                    <div className="relative overflow-hidden bg-dark-surface border border-white/10 rounded-2xl min-h-[260px] flex flex-col transition-all duration-150 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg">
                      {/* Línea de acento */}
                      <div className={`absolute inset-x-0 top-0 h-1 ${isComingSoon ? 'bg-white/20' : 'bg-white/30'}`} />

                      {/* Coming soon badge */}
                      {isComingSoon && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60 z-10 border border-white/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                          Próximamente
                        </span>
                      )}

                      <div className="p-5 pt-6 flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-white line-clamp-2">
                          {course.title}
                        </h3>

                        {course.description && (
                          <p className="mt-2 text-sm text-white/60 line-clamp-3">
                            {course.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/50">
                          {etiquetaDeNivel(course.level) && (
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap className="h-3.5 w-3.5" />
                              {etiquetaDeNivel(course.level)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            {course.total_modules || 0} módulos
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {course.total_lessons || 0} lecciones
                          </span>
                        </div>

                        <div className="mt-auto pt-4">
                          <span className="inline-flex items-center text-sm font-medium text-brand-light group-hover:text-brand">
                            Ver curso
                            <span className="ml-1">→</span>
                          </span>
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

      <Footer />
    </div>
  )
}
