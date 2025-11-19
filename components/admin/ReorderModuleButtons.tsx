'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface ReorderModuleButtonsProps {
  moduleId: string
  courseId: string
  currentIndex: number
  totalModules: number
}

export function ReorderModuleButtons({
  moduleId,
  courseId,
  currentIndex,
  totalModules
}: ReorderModuleButtonsProps) {
  const [isReordering, setIsReordering] = useState(false)
  const router = useRouter()

  const handleReorder = async (direction: 'up' | 'down') => {
    setIsReordering(true)

    try {
      console.log('🔄 [Reorder Module] Reordenando:', direction)

      const response = await fetch('/api/admin/modules/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          courseId,
          direction
        })
      })

      if (!response.ok) throw new Error('Error al reordenar')

      console.log('✅ [Reorder Module] Reordenado correctamente')
      router.refresh()
    } catch (error) {
      console.error('❌ [Reorder Module] Error:', error)
      alert('Error al reordenar módulo')
    } finally {
      setIsReordering(false)
    }
  }

  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalModules - 1

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => handleReorder('up')}
        disabled={isFirst || isReordering}
        className="p-1 bg-white/5 border border-white/10 rounded text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
        title="Subir"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleReorder('down')}
        disabled={isLast || isReordering}
        className="p-1 bg-white/5 border border-white/10 rounded text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
        title="Bajar"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  )
}
