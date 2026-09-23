import { Info } from 'lucide-react'

/**
 * Aviso al pie de todos los articulos del blog.
 *
 * El texto vive solo aqui: cambiarlo en este archivo lo cambia en todos los
 * posts. No duplicar el aviso dentro del contenido de lib/blog-data.ts.
 */
export function BlogDisclaimer() {
  return (
    <aside
      role="note"
      aria-label="Aviso sobre este contenido"
      className="mt-12 rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6"
    >
      <div className="flex gap-3">
        <Info
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/40"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">Aviso</p>
          <p className="text-sm leading-relaxed text-white/60">
            Este artículo es contenido educativo. No constituye asesoramiento
            financiero ni una recomendación de inversión. Las criptomonedas son
            activos de alta volatilidad: su precio puede caer con rapidez y es
            posible perder la totalidad del importe invertido. Antes de tomar
            cualquier decisión, infórmate por tu cuenta y, si lo necesitas,
            consulta a un profesional autorizado.
          </p>
        </div>
      </div>
    </aside>
  )
}
