import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Rutas de aprendizaje de Nodo360'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image() {
  return crearImagenOg({
    seccion: 'Rutas de aprendizaje',
    titular: 'Por dónde empezar, y qué viene después',
    subtitulo: 'Los cursos ordenados en rutas, para no tener que decidirlo tú.',
  })
}
