import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'

export const alt = 'Cuánto cuesta Nodo360: hoy, nada'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image() {
  return crearImagenOg({
    seccion: 'Precio',
    titular: '¿Cuánto cuesta Nodo360?',
    subtitulo: 'Hoy, nada. Cursos, rutas, exámenes y certificados, sin tarjeta.',
  })
}
