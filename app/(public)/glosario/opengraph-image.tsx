import { crearImagenOg, TAMANO_OG, TIPO_OG } from '@/lib/og/plantilla'
import { glossaryTerms } from '@/lib/glossary-data'

export const alt = 'Glosario de Bitcoin, blockchain y Web3 en español — Nodo360'
export const size = TAMANO_OG
export const contentType = TIPO_OG

export default async function Image() {
  return crearImagenOg({
    seccion: 'Glosario',
    titular: 'Los términos de Bitcoin y Web3, explicados',
    subtitulo: 'Definiciones breves en español, sin jerga innecesaria.',
    etiquetas: [`${glossaryTerms.length} términos`],
  })
}
