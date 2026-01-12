'use client'

import { useState, useEffect } from 'react'
import { Route } from 'lucide-react'

interface LearningPath {
  id: string
  name: string
  slug: string
  emoji: string | null
  is_active: boolean
}

interface AssignedPath {
  learning_path_id: string
  position: number
  is_required: boolean
}

interface CoursePathsSelectorProps {
  courseId: string
}

export function CoursePathsSelector({ courseId }: CoursePathsSelectorProps) {
  const [availablePaths, setAvailablePaths] = useState<LearningPath[]>([])
  const [assignedPaths, setAssignedPaths] = useState<AssignedPath[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Cargar rutas disponibles y asignadas
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar todas las rutas
        const pathsRes = await fetch('/api/admin/learning-paths')
        if (pathsRes.ok) {
          const data = await pathsRes.json()
          setAvailablePaths(data.paths || [])
        }

        // Cargar rutas asignadas al curso
        const assignedRes = await fetch(`/api/admin/courses/${courseId}/paths`)
        if (assignedRes.ok) {
          const data = await assignedRes.json()
          setAssignedPaths(data.paths || [])
        }
      } catch (error) {
        console.error('Error cargando rutas:', error)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchData()
    }
  }, [courseId])

  const isAssigned = (pathId: string) => assignedPaths.some(p => p.learning_path_id === pathId)

  const handleTogglePath = async (pathId: string) => {
    setSaving(true)
    setMessage(null)

    try {
      if (isAssigned(pathId)) {
        // Quitar de la ruta
        const res = await fetch(`/api/admin/courses/${courseId}/paths`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learning_path_id: pathId }),
        })

        if (res.ok) {
          setAssignedPaths(prev => prev.filter(p => p.learning_path_id !== pathId))
          setMessage({ type: 'success', text: 'Curso removido de la ruta' })
        } else {
          const data = await res.json()
          throw new Error(data.error || 'Error al remover')
        }
      } else {
        // Anadir a la ruta
        const res = await fetch(`/api/admin/courses/${courseId}/paths`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learning_path_id: pathId,
            position: assignedPaths.length,
            is_required: true,
          }),
        })

        if (res.ok) {
          setAssignedPaths(prev => [...prev, {
            learning_path_id: pathId,
            position: assignedPaths.length,
            is_required: true,
          }])
          setMessage({ type: 'success', text: 'Curso anadido a la ruta' })
        } else {
          const data = await res.json()
          throw new Error(data.error || 'Error al anadir')
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al actualizar' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Route className="w-5 h-5 text-brand-light" />
          Rutas de Aprendizaje
        </h3>
        <p className="text-sm text-white/50 mt-1">
          Asigna este curso a una o mas rutas de aprendizaje
        </p>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-light/30 border-t-brand-light rounded-full animate-spin" />
          </div>
        ) : availablePaths.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/50">No hay rutas de aprendizaje disponibles</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availablePaths.map(path => {
              const assigned = isAssigned(path.id)
              return (
                <label
                  key={path.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                    assigned
                      ? 'bg-brand-light/10 border border-brand-light/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  } ${saving ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={assigned}
                    onChange={() => handleTogglePath(path.id)}
                    disabled={saving}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-brand-light focus:ring-brand-light focus:ring-offset-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {path.emoji && <span>{path.emoji}</span>}
                      <span className="font-medium text-white truncate">{path.name}</span>
                      {!path.is_active && (
                        <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/50">
                          Inactiva
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/40">/{path.slug}</span>
                  </div>
                  {assigned && (
                    <svg className="w-5 h-5 text-brand-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </label>
              )
            })}
          </div>
        )}

        {/* Mensaje */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-error/10 text-error border border-error/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Info de rutas asignadas */}
        {assignedPaths.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/40">
              Este curso esta en {assignedPaths.length} ruta{assignedPaths.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoursePathsSelector
