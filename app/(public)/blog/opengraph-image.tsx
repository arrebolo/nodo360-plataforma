import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Blog de Nodo360: Bitcoin, blockchain y Web3'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image() {
  return crearImagenOg({
    seccion: 'Blog',
    titular: 'Bitcoin y Web3, sin prisa y con fuentes',
    subtitulo: 'Artículos en español sobre cómo funcionan las cosas por dentro.',
  })
}
