'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function SelectPathButton({
  pathSlug,
  isActive = false,
}: {
  pathSlug: string
  isActive?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function select() {
    if (loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/user/select-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pathSlug }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('Error selecting path:', data?.error ?? 'Unknown error')
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const continuePath = () => router.push('/dashboard/rutas')

  if (isActive) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Ruta activa
        </span>

        <Button variant="primary" onClick={continuePath}>
          Continuar ruta
          <span aria-hidden className="text-white/80">→</span>
        </Button>
      </div>
    )
  }

  return (
    <Button variant="primary" onClick={select} disabled={loading}>
      {loading ? 'Seleccionando...' : 'Elegir esta ruta'}
      {!loading && <span aria-hidden className="text-white/80">→</span>}
    </Button>
  )
}


