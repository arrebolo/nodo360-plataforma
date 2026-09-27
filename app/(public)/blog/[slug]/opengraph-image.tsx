import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'
import { getPostBySlug } from '@/lib/blog-data'

export const alt = 'Artículo del blog de Nodo360: su título y la sección'
export const size = TAMANO_OG
export const contentType = TIPO_OG

/**
 * La tarjeta que se ve al compartir un articulo.
 *
 * Hasta ahora se compartia la portada de public/blog/: una fotografia o un
 * render, sin una sola palabra encima. En WhatsApp o en X eso es una imagen
 * bonita que no dice de que va el articulo ni de quien es, y el titulo queda
 * relegado a la linea de texto pequeno que cada cliente recorta a su manera.
 *
 * La portada NO desaparece: sigue abriendo el articulo dentro de la pagina y
 * sigue siendo la imagen del JSON-LD. Lo que cambia es la tarjeta de compartir.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  return crearImagenOg({
    seccion: 'Blog',
    titular: post?.title ?? 'Blog',
    subtitulo: post?.description ?? null,
    // La descripcion de un articulo ronda los 155 caracteres: con el limite
    // por defecto se cortaba a media frase.
    maximoSubtitulo: 170,
  })
}
