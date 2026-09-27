import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'
import { getTermBySlug } from '@/lib/glossary-data'

export const alt = 'Término del glosario de Nodo360 con el principio de su definición'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const termino = getTermBySlug(slug)

  return crearImagenOg({
    seccion: 'Glosario',
    // La definicion la recorta la plantilla a 120 caracteres, por palabra.
    titular: termino?.term ?? 'Glosario',
    subtitulo: termino?.definition ?? null,
  })
}
