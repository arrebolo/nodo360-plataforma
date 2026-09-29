'use client'

import { LabelWithTooltip } from '@/components/ui/Tooltip'
import { Tooltip } from '@/components/ui/Tooltip'

interface PricingTogglesProps {
  isFree: boolean
  isPremium: boolean
  price: number | null
  onIsFreeChange: (value: boolean) => void
  onIsPremiumChange: (value: boolean) => void
  onPriceChange: (value: number | null) => void
  errors?: {
    price?: string
  }
}

export function PricingToggles({
  isFree,
  isPremium,
  price,
  onIsFreeChange,
  onIsPremiumChange,
  onPriceChange,
  errors,
}: PricingTogglesProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-6 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_free"
            value="true"
            checked={isFree}
            onChange={(e) => onIsFreeChange(e.target.checked)}
            className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand-light focus:ring-2 focus:ring-brand-light/20"
          />
          <span className="text-white font-medium">Curso Gratuito</span>
          <Tooltip content="El curso sera accesible sin pago. Ideal para cursos introductorios" />
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_premium"
            value="true"
            checked={isPremium}
            onChange={(e) => onIsPremiumChange(e.target.checked)}
            className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand focus:ring-2 focus:ring-brand/20"
          />
          <span className="text-white font-medium">Premium</span>
          <Tooltip content="Requiere suscripcion Premium para acceder. Se incluye en la membresia" />
        </label>
      </div>

      {!isFree && (
        <div>
          <LabelWithTooltip
            label="Precio (USD)"
            tooltip="Precio en dolares. Usa 0 para curso gratuito. Hoy no hay pasarela de pago: todo el catalogo es gratuito"
            htmlFor="course-price"
          />
          <input
            id="course-price"
            type="number"
            name="price"
            value={price ?? ''}
            onChange={(e) => onPriceChange(e.target.value ? parseFloat(e.target.value) : null)}
            min="0"
            step="0.01"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
            placeholder="Ej: 49.99"
          />
          {/*
            Aqui se calculaba «Tu comisión: $X - $Y por venta» multiplicando el
            precio por 0,35 y 0,40. Ni hay ventas ni hay acuerdo de reparto.
          */}
          <p className="mt-2 text-sm text-white/50">
            Hoy todo el contenido de Nodo360 es gratuito y no hay remuneración para
            instructores. Si en el futuro hay monetización, las condiciones se
            acordarán por escrito antes de cualquier cobro.
          </p>
          {errors?.price && <p className="mt-2 text-sm text-red-400">{errors.price}</p>}
        </div>
      )}
    </div>
  )
}
