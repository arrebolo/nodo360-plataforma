// components/forms/ExperienceSelect.tsx
'use client'

import type { ChangeEvent } from 'react'

interface ExperienceSelectProps {
  id?: string
  name?: string
  label?: string
  helperText?: string
  value?: string
  required?: boolean
  error?: string
  onChange?: (value: string) => void
}

const OPTIONS = [
  { value: '', label: 'Seleccionar…' },
  { value: '1-2', label: '1–2 años' },
  { value: '3-5', label: '3–5 años' },
  { value: '5-10', label: '5–10 años' },
  { value: '10+', label: 'Más de 10 años' },
]

export function ExperienceSelect({
  id = 'experience',
  name = 'experience',
  label = 'Experiencia',
  helperText = '¿Cuántos años de experiencia tienes en crypto/blockchain?',
  value = '',
  required,
  error,
  onChange,
}: ExperienceSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value)
  }

  const hasError = Boolean(error)

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>

      {/* Helper text */}
      {helperText && (
        <p className="text-xs text-white/60">{helperText}</p>
      )}

      {/* Select container */}
      <div className="relative mt-1">
        <select
          id={id}
          name={name}
          required={required}
          value={value}
          onChange={handleChange}
          aria-invalid={hasError}
          className={`
            w-full appearance-none rounded-xl border bg-black/40 text-sm text-white
            px-4 py-2.5 pr-10
            transition-all duration-200
            outline-none
            ${hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-white/20 hover:border-white/30 focus:border-[#f8a94a] focus:ring-1 focus:ring-[#f8a94a]'
            }
          `}
        >
          {OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#0a0c12] text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>

        {/* Flecha del select */}
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/50">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}
