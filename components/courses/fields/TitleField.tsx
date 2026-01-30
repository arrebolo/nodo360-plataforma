'use client'

import { LabelWithTooltip } from '@/components/ui/Tooltip'

interface TitleFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TitleField({ value, onChange, error }: TitleFieldProps) {
  return (
    <div className="mb-6">
      <LabelWithTooltip
        label="Titulo del Curso"
        tooltip="Un titulo claro y descriptivo que indique el tema principal del curso"
        required
        htmlFor="course-title"
      />
      <input
        id="course-title"
        type="text"
        name="title"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
        placeholder="Ej: Introduccion a Bitcoin para principiantes"
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
