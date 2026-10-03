'use client'

import { LabelWithTooltip } from '@/components/ui/Tooltip'

interface DescriptionFieldsProps {
  shortDescription: string
  longDescription: string
  onShortChange: (value: string) => void
  onLongChange: (value: string) => void
  errors?: {
    description?: string
    long_description?: string
  }
}

export function DescriptionFields({
  shortDescription,
  longDescription,
  onShortChange,
  onLongChange,
  errors,
}: DescriptionFieldsProps) {
  return (
    <>
      {/* Short Description */}
      <div className="mb-6">
        <LabelWithTooltip
          label="Descripción Corta"
          tooltip="Máximo 160 caracteres. Aparece en las tarjetas de cursos y en los resultados de búsqueda (SEO)"
          required
          htmlFor="course-description"
        />
        <input
          id="course-description"
          type="text"
          name="description"
          value={shortDescription}
          onChange={(e) => onShortChange(e.target.value)}
          required
          maxLength={160}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
          placeholder="Ej: Aprende los fundamentos de Bitcoin desde cero. Ideal para principiantes sin conocimientos previos."
        />
        <p className="mt-2 text-sm text-white/50">
          {shortDescription.length}/160 caracteres
        </p>
        {errors?.description && (
          <p className="mt-1 text-sm text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Long Description */}
      <div className="mb-6">
        <LabelWithTooltip
          label="Descripción Completa"
          tooltip="Explica qué aprenderán los estudiantes, para quién es el curso, requisitos previos y beneficios"
          htmlFor="course-long-description"
        />
        <textarea
          id="course-long-description"
          name="long_description"
          value={longDescription}
          onChange={(e) => onLongChange(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition resize-none"
          placeholder="En este curso aprenderás:&#10;- Qué es Bitcoin y cómo funciona&#10;- Cómo crear y gestionar tu primera cartera&#10;- Conceptos básicos de seguridad&#10;&#10;Requisitos: ninguno, empezamos desde cero.&#10;&#10;Para quién es: principiantes curiosos sobre Bitcoin y criptomonedas."
        />
        {errors?.long_description && (
          <p className="mt-2 text-sm text-red-400">{errors.long_description}</p>
        )}
      </div>
    </>
  )
}
