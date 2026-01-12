'use client'

interface SlugFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function SlugField({ value, onChange, error }: SlugFieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-white mb-2">
        Slug (URL amigable) *
      </label>
      <input
        type="text"
        name="slug"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
        placeholder="bitcoin-para-principiantes"
      />
      <p className="mt-2 text-sm text-white/70">
        URL: /cursos/{value || 'slug-del-curso'}
      </p>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
