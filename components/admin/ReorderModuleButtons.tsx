'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { mensajeDeRespuesta } from '@/lib/ui/errores'

interface ReorderModuleButtonsProps {
  moduleId: string
  courseId: string
  currentIndex: number
  totalModules: number
  /**
   * A quien llamar: '/api/instructor' desde la zona del instructor, '/api/admin' desde
   * el panel. El permiso NO lo decide esto, lo decide la ruta: la de instructor exige
   * que el curso sea tuyo y la de admin exige admin. Esta aqui porque ninguna pantalla
   * de /dashboard/instructor debe llamar a /api/admin, y porque los cuatro botones del
   * editor del instructor recibian 403.
   */
  api?: string
}

export function ReorderModuleButtons({
  moduleId,
  courseId,
  currentIndex,
  totalModules,
  api = '/api/admin',
}: ReorderModuleButtonsProps) {
  const [isReordering, setIsReordering] = useState(false)
  // El error, EN PANTALLA. Antes era un alert(), que lo cierra cualquier cosa y no
  // deja rastro: en la auditoria estas acciones «fallaban sin avisar».
  const [error, setError] = useState<string | null>(null)

  const handleReorder = async (direction: 'up' | 'down') => {
    setError(null)
    setIsReordering(true)

    try {
      console.log('🔄 [Reorder Module] Reordenando:', direction)

      const response = await fetch(`${api}/modules/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          courseId,
          direction
        })
      })

      if (!response.ok) throw new Error(await mensajeDeRespuesta(response, 'No se pudo reordenar el módulo.'))

      console.log('✅ [Reorder Module] Reordenado correctamente')

      // Recargar la página para mostrar el nuevo orden
      window.location.reload()
    } catch (error) {
      console.error('❌ [Reorder Module] Error:', error)
      setError(error instanceof Error ? error.message : 'No se pudo reordenar el módulo.')
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
      {error && (
        <p className="max-w-[16rem] text-right text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}


