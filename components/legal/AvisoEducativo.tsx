import { Info } from 'lucide-react'

/**
 * Aviso de contenido educativo.
 *
 * El texto vive SOLO aqui. Lo usan el blog, la ficha de curso y la pagina de
 * leccion; cambiarlo en este archivo lo cambia en los tres. No duplicarlo
 * dentro del contenido de lib/blog-data.ts ni en el HTML de las lecciones.
 *
 * Por que existe: hasta el 24/09/2026 solo el blog llevaba aviso, y los cursos
 * de trading —el contenido mas sensible de la plataforma— no llevaban ninguno.
 * Estaba unicamente en /terminos, que nadie lee.
 */

type Tipo = 'articulo' | 'curso' | 'leccion'

const SUJETO: Record<Tipo, string> = {
  articulo: 'Este artículo es contenido educativo.',
  curso: 'Este curso es contenido educativo.',
  leccion: 'Esta lección es contenido educativo.',
}

export function AvisoEducativo({
  tipo = 'articulo',
  className = '',
}: {
  tipo?: Tipo
  /** Margen superior u otros ajustes de la pagina que lo coloca. */
  className?: string
}) {
  return (
    <aside
      role="note"
      aria-label="Aviso sobre este contenido"
      className={`rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 ${className}`}
    >
      <div className="flex gap-3">
        <Info
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/40"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">Aviso</p>
          <p className="text-sm leading-relaxed text-white/60">
            {SUJETO[tipo]} No constituye asesoramiento financiero ni una
            recomendación de inversión. Las criptomonedas son activos de alta
            volatilidad: su precio puede caer con rapidez y es posible perder la
            totalidad del importe invertido. Antes de tomar cualquier decisión,
            infórmate por tu cuenta y, si lo necesitas, consulta a un
            profesional autorizado.
          </p>
        </div>
      </div>
    </aside>
  )
}
