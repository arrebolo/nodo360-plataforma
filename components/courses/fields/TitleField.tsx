'use client'

interface TitleFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TitleField({ value, onChange, error }: TitleFieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-white mb-2">
        Título del Curso *
      </label>
      <input
        type="text"
        name="title"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
        placeholder="ej. Bitcoin para Principiantes"
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
