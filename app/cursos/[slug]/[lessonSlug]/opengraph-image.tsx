import { createClient } from '@/lib/supabase/server'
import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Lección de un curso de Nodo360: su título y el curso al que pertenece'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>
}) {
  const { slug, lessonSlug } = await params
  const supabase = await createClient()

  const { data: leccion } = await supabase
    .from('lessons')
    .select('title, courses!inner(title, slug)')
    .eq('slug', lessonSlug)
    .eq('courses.slug', slug)
    .maybeSingle()

  const curso = leccion?.courses as unknown as { title: string } | null

  return crearImagenOg({
    seccion: 'Lección',
    titular: leccion?.title ?? 'Lección',
    subtitulo: curso?.title ?? null,
  })
}
