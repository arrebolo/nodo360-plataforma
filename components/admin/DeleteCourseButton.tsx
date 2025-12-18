// components/admin/DeleteCourseButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCourseAction } from '@/app/admin/cursos/actions'

interface DeleteCourseButtonProps {
  courseId: string
  courseTitle: string
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    // Confirmacion
    const confirmed = window.confirm(
      `Eliminar el curso "${courseTitle}"?\n\nEsta accion eliminara tambien todos los modulos, lecciones, progreso de usuarios y certificados asociados.\n\nEsta accion no se puede deshacer.`
    )

    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      const result = await deleteCourseAction(courseId)

      if (!result.success) {
        setError(result.error || 'Error al eliminar')
        return
      }

      // Refrescar la pagina
      router.refresh()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-[12px] text-[#E15B5B] hover:text-[#FF7B7B] hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Eliminando...' : 'Eliminar'}
      </button>
      {error && (
        <span className="text-[10px] text-[#E15B5B] mt-1 max-w-[150px] text-right">
          {error}
        </span>
      )}
    </div>
  )
}
