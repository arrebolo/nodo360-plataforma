import { AvisoEducativo } from '@/components/legal/AvisoEducativo'

/**
 * Aviso al pie de todos los articulos del blog.
 *
 * Se conserva como envoltorio para no tocar la pagina del blog, pero el texto
 * vive en components/legal/AvisoEducativo.tsx, compartido con la ficha de
 * curso y la pagina de leccion. Asi no pueden separarse con el tiempo.
 */
export function BlogDisclaimer() {
  return <AvisoEducativo tipo="articulo" className="mt-12" />
}
