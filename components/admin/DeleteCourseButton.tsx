'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteCourseButtonProps {
  courseId: string
  courseTitle: string
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    // Confirmación
    if (!confirm(`¿Eliminar el curso "${courseTitle}"?\n\nEsta acción eliminará:\n• Todos los módulos\n• Todas las lecciones\n• Todo el progreso de usuarios\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    setIsDeleting(true)

    try {
      console.log('🗑️ [Delete Button] Eliminando curso:', courseId)

      // Llamar al endpoint de delete
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar curso')
      }

      console.log('✅ [Delete Button] Curso eliminado')
      router.push('/admin/cursos')
      router.refresh()
    } catch (error) {
      console.error('❌ [Delete Button] Error:', error)
      alert('Error al eliminar el curso')
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 className={`w-5 h-5 ${isDeleting ? 'animate-pulse' : ''}`} />
      {isDeleting ? 'Eliminando...' : 'Eliminar Curso'}
    </button>
  )
}
