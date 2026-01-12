'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteModuleButtonProps {
  moduleId: string
  moduleTitle: string
  courseId: string
}

export function DeleteModuleButton({ moduleId, moduleTitle, courseId }: DeleteModuleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el módulo "${moduleTitle}"?\n\nEsto eliminará todas las lecciones del módulo.\nEsta acción no se puede deshacer.`)) {
      return
    }

    setIsDeleting(true)

    try {
      console.log('🗑️ [Delete Module] Eliminando módulo:', moduleId)

      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al eliminar')

      console.log('✅ [Delete Module] Módulo eliminado')
      router.refresh()
    } catch (error) {
      console.error('❌ [Delete Module] Error:', error)
      alert('Error al eliminar módulo')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
    >
      <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
    </button>
  )
}


