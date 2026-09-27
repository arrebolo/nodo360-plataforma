import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Cursos de Bitcoin, blockchain y Web3 en español — Nodo360'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image() {
  return crearImagenOg({
    seccion: 'Cursos',
    titular: 'Cursos de Bitcoin, blockchain y Web3',
    subtitulo: 'En español, con temario abierto y certificado al completarlos.',
    etiquetas: ['Gratis'],
  })
}
