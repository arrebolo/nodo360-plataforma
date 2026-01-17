'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

interface CourseTabsProps {
  counts: {
    all: number
    published: number
    draft: number
  }
}

export default function CourseTabs({ counts }: CourseTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentTab = searchParams.get('tab') || 'all'

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (tab === 'all') {
      params.delete('tab')
      params.delete('status') // Limpiar filtro de status
    } else {
      params.set('tab', tab)
      params.set('status', tab) // Sincronizar con filtro
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const tabs = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'published', label: 'Publicados', count: counts.published },
    { id: 'draft', label: 'Borradores', count: counts.draft },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          disabled={isPending}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${currentTab === tab.id
              ? 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }
            ${isPending ? 'opacity-50' : ''}
          `}
        >
          {tab.label}
          <span className={`
            px-2 py-0.5 rounded-full text-xs
            ${currentTab === tab.id
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/50'
            }
          `}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}
