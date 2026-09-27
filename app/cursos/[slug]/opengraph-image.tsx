import { createClient } from '@/lib/supabase/server'
import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'
import { nivelEnCastellano } from '@/lib/og/texto'

export const alt = 'Ficha de un curso de Nodo360: título, nivel, número de lecciones y precio'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: curso } = await supabase
    .from('courses')
    .select('title, description, level, total_lessons, is_free')
    .eq('slug', slug)
    .maybeSingle()

  const nivel = nivelEnCastellano(curso?.level)
  const lecciones = curso?.total_lessons
    ? `${curso.total_lessons} ${curso.total_lessons === 1 ? 'lección' : 'lecciones'}`
    : null

  return crearImagenOg({
    seccion: 'Curso',
    titular: curso?.title ?? 'Curso',
    subtitulo: curso?.description ?? null,
    // El orden importa: la primera pastilla va en naranja.
    etiquetas: [
      ...(curso?.is_free !== false ? ['Gratis'] : []),
      ...(nivel ? [nivel] : []),
      ...(lecciones ? [lecciones] : []),
    ],
  })
}
