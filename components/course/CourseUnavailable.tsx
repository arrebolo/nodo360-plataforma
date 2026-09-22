import Link from 'next/link'
import { BookOpen, Compass, Hammer, Archive } from 'lucide-react'

import { getSuggestedPublishedCourses } from '@/lib/courses/suggestions'
import { RelatedCourses } from '@/components/course/RelatedCourses'
import { Footer } from '@/components/navigation/Footer'

/**
 * Pagina que ve quien llega a un curso que existe pero no puede ver.
 *
 * Sustituye al 404 que se devolvia antes. No muestra descripcion, temario,
 * lecciones ni ningun contenido del curso: solo su titulo, para que la persona
 * sepa que llego al sitio correcto y que el curso no esta disponible.
 *
 * No se dan fechas ni se promete nada (Principio #7).
 *
 * Quien SI puede ver el curso (admin, su instructor, y los mentores cuando esta
 * en revision) nunca llega aqui: recibe la vista previa con su aviso.
 */

type Props = {
  courseId: string
  courseTitle: string
  status?: string | null
}

/**
 * Estados en los que el curso todavia no ha llegado al catalogo.
 * 'coming_soon' entra aqui: un curso anunciado como proximo no esta retirado,
 * esta por llegar.
 */
const EN_PREPARACION = ['draft', 'pending_review', 'changes_requested', 'coming_soon']

/** Estados en los que el curso se retiro */
const RETIRADO = ['archived', 'rejected']

export async function CourseUnavailable({ courseId, courseTitle, status }: Props) {
  const enPreparacion = EN_PREPARACION.includes(status ?? '')
  const retirado = RETIRADO.includes(status ?? '')

  const { courses, pathName } = await getSuggestedPublishedCourses(courseId, 3)

  const Icono = enPreparacion ? Hammer : Archive

  // Tres casos, cada uno con su titulo y su cuerpo. El tercero es la red de
  // seguridad para un estado que no conozcamos: no afirma que se haya retirado
  // ni promete que vaya a llegar.
  const titulo = enPreparacion
    ? 'Este curso está en preparación'
    : retirado
      ? 'Este curso ya no está disponible'
      : 'Este curso no está disponible'

  const cuerpo = enPreparacion
    ? `El curso «${courseTitle}» todavía no está publicado. Aparecerá en el catálogo cuando el contenido esté terminado y revisado. No damos fechas: preferimos publicarlo bien a publicarlo pronto.`
    : retirado
      ? `El curso «${courseTitle}» se retiró del catálogo. Puede que su contenido se haya integrado en otro curso o que haya quedado desactualizado.`
      : `El curso «${courseTitle}» no está disponible en este momento.`

  const tituloSugerencias = pathName
    ? `Mientras tanto, de la ruta ${pathName}`
    : 'Cursos disponibles ahora'

  return (
    <div className="min-h-screen bg-dark">
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Icono className="h-6 w-6 text-white/50" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {titulo}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
                {cuerpo}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cursos"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-light to-brand px-6 py-3 font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-brand-light/40"
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              Ver todos los cursos
            </Link>
            <Link
              href="/rutas"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all duration-300 hover:border-brand-light/50"
            >
              <Compass className="h-5 w-5" aria-hidden="true" />
              Ver rutas de aprendizaje
            </Link>
          </div>
        </div>

        {courses.length > 0 && (
          <div className="mt-12">
            <RelatedCourses courses={courses} title={tituloSugerencias} limit={3} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
