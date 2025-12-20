'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteCourseAction } from './actions'

interface DeleteCourseButtonProps {
  courseId: string
  courseTitle: string
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)

    try {
      const result = await deleteCourseAction(courseId)

      if (result.success) {
        setShowConfirm(false)
        router.refresh()
      } else {
        alert(`Error al eliminar: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400">¿Seguro?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            'Si, eliminar'
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-2 py-1 text-xs rounded bg-white/5 text-neutral-400 hover:bg-white/10"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      title={`Eliminar ${courseTitle}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
