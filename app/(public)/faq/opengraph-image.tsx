import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Preguntas frecuentes sobre Bitcoin y Web3 — Nodo360'
export const size = TAMANO_OG
export const contentType = TIPO_OG

/**
 * /faq no estaba en la lista del encargo, pero su layout declara openGraph
 * propio, y eso impide heredar la tarjeta del sitio: se quedaba sin og:image
 * ninguna. Con fichero propio, resuelto y ademas con su texto.
 */
export default async function Image() {
  return crearImagenOg({
    seccion: 'Preguntas frecuentes',
    titular: 'Las dudas que salen siempre, respondidas',
    subtitulo: 'Sobre Bitcoin, blockchain, Web3 y sobre la propia plataforma.',
  })
}
