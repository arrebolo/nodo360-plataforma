'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'

interface LoadMoreButtonProps {
  currentCount: number
  totalCount: number
  pageSize?: number
}

export default function LoadMoreButton({
  currentCount,
  totalCount,
  pageSize = 10
}: LoadMoreButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const hasMore = currentCount < totalCount

  if (!hasMore) return null

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString())
    const currentLimit = parseInt(params.get('limit') || String(pageSize))
    params.set('limit', String(currentLimit + pageSize))

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex flex-col items-center gap-3 mt-8">
      <p className="text-sm text-white/50">
        Mostrando {currentCount} de {totalCount} cursos
      </p>
      <button
        onClick={handleLoadMore}
        disabled={isPending}
        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white transition-all disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando...
          </>
        ) : (
          <>
            <ChevronDown className="w-5 h-5" />
            Cargar mas
          </>
        )}
      </button>
    </div>
  )
}
