import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'
import { getLearningPathBySlug, getCoursesByLearningPathSlug } from '@/lib/db/learning-paths'

export const alt = 'Ruta de aprendizaje de Nodo360: nombre, descripción y número de cursos'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [ruta, cursos] = await Promise.all([
    getLearningPathBySlug(slug),
    getCoursesByLearningPathSlug(slug),
  ])

  return crearImagenOg({
    seccion: 'Ruta de aprendizaje',
    titular: ruta?.name ?? 'Ruta de aprendizaje',
    subtitulo: ruta?.subtitle ?? ruta?.short_description ?? null,
    etiquetas: cursos.length
      ? [`${cursos.length} ${cursos.length === 1 ? 'curso' : 'cursos'}`]
      : [],
  })
}
