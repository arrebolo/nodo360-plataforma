'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

type Variant = 'default' | 'small'

export function SelectPathButton({
  pathSlug,
  variant = 'default',
  label = 'Elegir',
}: {
  pathSlug: string
  variant?: Variant
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSelect() {
    try {
      setLoading(true)
      setError(null)

      // Endpoint esperado: /api/paths/select (ajusta si el tuyo se llama distinto)
      const res = await fetch('/api/paths/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathSlug }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'No se pudo seleccionar la ruta')
      }

      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const sizeClass =
    variant === 'small'
      ? 'px-4 py-2.5 text-sm rounded-xl'
      : 'px-5 py-3 text-sm rounded-xl'

  return (
    <div className="inline-flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSelect}
        disabled={loading}
        className={[
          'inline-flex items-center justify-center gap-2 font-semibold transition-all',
          'border',
          'bg-white/[0.03] text-white/85 border-white/10',
          'hover:bg-[#ff6b35] hover:text-white hover:border-[#ff6b35]/40',
          'active:scale-[0.99]',
          'focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          sizeClass,
        ].join(' ')}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {error ? <p className="text-xs text-red-400/90">{error}</p> : null}
    </div>
  )
}
