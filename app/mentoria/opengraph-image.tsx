import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Mentoría en Nodo360'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image() {
  return crearImagenOg({
    seccion: 'Mentoría',
    titular: 'Alguien con experiencia, mientras estudias',
    subtitulo: 'Acompañamiento de mentores de la comunidad de Nodo360.',
  })
}
