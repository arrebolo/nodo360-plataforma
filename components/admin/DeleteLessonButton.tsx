'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteLessonButtonProps {
  lessonId: string
  lessonTitle: string
  moduleId: string
  courseId: string
}

export function DeleteLessonButton({ lessonId, lessonTitle, moduleId, courseId }: DeleteLessonButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la lección "${lessonTitle}"?\n\nSe eliminará el progreso de usuarios en esta lección.\nEsta acción no se puede deshacer.`)) {
      return
    }

    setIsDeleting(true)

    try {
      console.log('🗑️ [Delete Lesson] Eliminando lección:', lessonId)

      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al eliminar')

      console.log('✅ [Delete Lesson] Lección eliminada')
      router.refresh()
    } catch (error) {
      console.error('❌ [Delete Lesson] Error:', error)
      alert('Error al eliminar lección')
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
