import Link from 'next/link'
import { BookOpen, Compass, Hammer, ChevronRight } from 'lucide-react'

import { getPathsWithPublishedCourses } from '@/lib/db/learning-paths'
import { Footer } from '@/components/navigation/Footer'

/**
 * Pagina que ve quien entra a una ruta de aprendizaje que existe pero todavia
 * no tiene ningun curso publicado.
 *
 * Mismo criterio que CourseUnavailable: el 404 se reserva para lo que no
 * existe, y a quien llega aqui se le reorienta en vez de dejarlo en un callejon.
 * Se muestra el nombre de la ruta, nada mas suyo, y no se dan fechas
 * (Principio #7).
 *
 * Los admin no llegan aqui: ven la ruta vacia para poder gestionarla.
 */

type Props = {
  pathName: string
  pathSlug: string
}

export async function PathUnavailable({ pathName, pathSlug }: Props) {
  const sugeridas = await getPathsWithPublishedCourses(pathSlug, 3)

  return (
    <div className="min-h-screen bg-dark">
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Hammer className="h-6 w-6 text-white/50" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Esta ruta está en preparación
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
                La ruta «{pathName}» todavía no tiene cursos publicados. Sus
                cursos aparecerán aquí cuando el contenido esté terminado y
                revisado. No damos fechas: preferimos publicarlo bien a
                publicarlo pronto.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/rutas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-light to-brand px-6 py-3 font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-brand-light/40"
            >
              <Compass className="h-5 w-5" aria-hidden="true" />
              Ver rutas de aprendizaje
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all duration-300 hover:border-brand-light/50"
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              Ver todos los cursos
            </Link>
          </div>
        </div>

        {sugeridas.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-white">
              Rutas con cursos disponibles ahora
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sugeridas.map((ruta) => (
                <Link
                  key={ruta.id}
                  href={`/rutas/${ruta.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-brand-light/40 hover:bg-white/[0.07]"
                >
                  {ruta.emoji && (
                    <span className="text-3xl" aria-hidden="true">
                      {ruta.emoji}
                    </span>
                  )}
                  <h3 className="mt-3 font-semibold text-white group-hover:text-brand-light">
                    {ruta.name}
                  </h3>
                  {ruta.short_description && (
                    <p className="mt-2 line-clamp-2 text-sm text-white/60">
                      {ruta.short_description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-light">
                    Ver la ruta
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
