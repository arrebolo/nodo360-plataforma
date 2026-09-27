import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Nodo360 — Aprende Bitcoin y Web3 en español, con cursos gratuitos'
export const size = TAMANO_OG
export const contentType = TIPO_OG

/** La tarjeta del sitio. Sustituye a la inexistente og-nodo360.png. */
export default async function Image() {
  return crearImagenOg({
    portada: true,
    titular: 'Nodo360',
    subtitulo: 'Aprende Bitcoin y Web3 en español · Cursos gratuitos',
  })
}
