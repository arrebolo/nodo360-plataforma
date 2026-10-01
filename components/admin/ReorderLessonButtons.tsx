'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { mensajeDeRespuesta } from '@/lib/ui/errores'

interface ReorderLessonButtonsProps {
  lessonId: string
  moduleId: string
  currentIndex: number
  totalLessons: number
}

export function ReorderLessonButtons({
  lessonId,
  moduleId,
  currentIndex,
  totalLessons
}: ReorderLessonButtonsProps) {
  const [isReordering, setIsReordering] = useState(false)
  // El error, EN PANTALLA. Antes era un alert(), que lo cierra cualquier cosa y no
  // deja rastro: en la auditoria estas acciones «fallaban sin avisar».
  const [error, setError] = useState<string | null>(null)

  const handleReorder = async (direction: 'up' | 'down') => {
    setError(null)
    setIsReordering(true)

    try {
      console.log('🔄 [Reorder Lesson] Reordenando:', direction)

      const response = await fetch('/api/admin/lessons/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          moduleId,
          direction
        })
      })

      if (!response.ok) throw new Error(await mensajeDeRespuesta(response, 'No se pudo reordenar la lección.'))

      console.log('✅ [Reorder Lesson] Reordenado correctamente')

      // Recargar la página para mostrar el nuevo orden
      window.location.reload()
    } catch (error) {
      console.error('❌ [Reorder Lesson] Error:', error)
      setError(error instanceof Error ? error.message : 'No se pudo reordenar la lección.')
      setIsReordering(false)
    }
  }

  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalLessons - 1

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
      {error && (
        <p className="max-w-[16rem] text-right text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}


