'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { mensajeDeRespuesta } from '@/lib/ui/errores'

interface DeleteModuleButtonProps {
  moduleId: string
  moduleTitle: string
  /**
   * A quien llamar: '/api/instructor' desde la zona del instructor, '/api/admin' desde
   * el panel. El permiso NO lo decide esto, lo decide la ruta: la de instructor exige
   * que el curso sea tuyo y la de admin exige admin. Esta aqui porque ninguna pantalla
   * de /dashboard/instructor debe llamar a /api/admin, y porque los cuatro botones del
   * editor del instructor recibian 403.
   */
  api?: string

  courseId: string
}

export function DeleteModuleButton({
  moduleId,
  moduleTitle,
  courseId,
  api = '/api/admin',
}: DeleteModuleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  // El error, EN PANTALLA. Antes era un alert(), que lo cierra cualquier cosa y no
  // deja rastro: en la auditoria estas acciones «fallaban sin avisar».
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el módulo "${moduleTitle}"?\n\nEsto eliminará todas las lecciones del módulo.\nEsta acción no se puede deshacer.`)) {
      return
    }

    setError(null)

    setIsDeleting(true)

    try {
      console.log('🗑️ [Delete Module] Eliminando módulo:', moduleId)

      const response = await fetch(`${api}/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error(await mensajeDeRespuesta(response, 'No se pudo eliminar el módulo.'))

      console.log('✅ [Delete Module] Módulo eliminado')
      router.refresh()
    } catch (error) {
      console.error('❌ [Delete Module] Error:', error)
      setError(error instanceof Error ? error.message : 'No se pudo eliminar el módulo.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
      >
        <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
      </button>
      {error && (
        <p className="max-w-[16rem] text-right text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}


