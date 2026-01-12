'use client'

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
        <label className="block text-sm font-medium text-white mb-2">
          Descripción Corta *
        </label>
        <input
          type="text"
          name="description"
          value={shortDescription}
          onChange={(e) => onShortChange(e.target.value)}
          required
          maxLength={160}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
          placeholder="Descripción breve para cards y SEO (máx. 160 caracteres)"
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
        <label className="block text-sm font-medium text-white mb-2">
          Descripción Larga
        </label>
        <textarea
          name="long_description"
          value={longDescription}
          onChange={(e) => onLongChange(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition resize-none"
          placeholder="Descripción detallada del curso, qué aprenderán los estudiantes, requisitos, etc."
        />
        {errors?.long_description && (
          <p className="mt-2 text-sm text-red-400">{errors.long_description}</p>
        )}
      </div>
    </>
  )
}
