'use client'

import { LabelWithTooltip } from '@/components/ui/Tooltip'

interface SlugFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function SlugField({ value, onChange, error }: SlugFieldProps) {
  return (
    <div className="mb-6">
      <LabelWithTooltip
        label="Slug (URL amigable)"
        tooltip="Se genera automaticamente del titulo. Solo letras minusculas, numeros y guiones"
        required
        htmlFor="course-slug"
      />
      <input
        id="course-slug"
        type="text"
        name="slug"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
        placeholder="Ej: introduccion-bitcoin-principiantes"
      />
      <p className="mt-2 text-sm text-white/50">
        URL: /cursos/{value || 'slug-del-curso'}
      </p>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
