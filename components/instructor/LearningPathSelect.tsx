'use client'

import { useState, useEffect } from 'react'
import { Route, Check, Loader2 } from 'lucide-react'

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

interface LearningPathSelectProps {
  courseId: string
}

export function LearningPathSelect({ courseId }: LearningPathSelectProps) {
  const [availablePaths, setAvailablePaths] = useState<LearningPath[]>([])
  const [assignedPaths, setAssignedPaths] = useState<AssignedPath[]>([])
  const [loading, setLoading] = useState(true)
  const [savingPathId, setSavingPathId] = useState<string | null>(null)
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
    setSavingPathId(pathId)
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
          setMessage({ type: 'success', text: 'Ruta removida' })
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
          setMessage({ type: 'success', text: 'Ruta asignada' })
        } else {
          const data = await res.json()
          throw new Error(data.error || 'Error al asignar')
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al actualizar' })
    } finally {
      setSavingPathId(null)
      setTimeout(() => setMessage(null), 2500)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-2">
        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Route className="w-4 h-4 text-brand-light" />
          Ruta de Aprendizaje
        </label>
        <div className="flex items-center justify-center py-6 rounded-xl border border-white/10 bg-[#0d1117]">
          <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
        </div>
      </div>
    )
  }

  if (availablePaths.length === 0) {
    return (
      <div className="grid gap-2">
        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Route className="w-4 h-4 text-brand-light" />
          Ruta de Aprendizaje
        </label>
        <div className="py-4 px-4 rounded-xl border border-white/10 bg-[#0d1117] text-center">
          <p className="text-sm text-white/50">No hay rutas de aprendizaje disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-white/80 flex items-center gap-2">
        <Route className="w-4 h-4 text-brand-light" />
        Ruta de Aprendizaje
      </label>
      <p className="text-xs text-white/50 -mt-1">
        Selecciona en que rutas aparecera este curso
      </p>

      <div className="rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden">
        <div className="divide-y divide-white/5">
          {availablePaths.map(path => {
            const assigned = isAssigned(path.id)
            const isSaving = savingPathId === path.id

            return (
              <label
                key={path.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                  assigned
                    ? 'bg-brand-light/5'
                    : 'hover:bg-white/5'
                } ${isSaving ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={assigned}
                    onChange={() => handleTogglePath(path.id)}
                    disabled={isSaving}
                    className="sr-only peer"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                    assigned
                      ? 'bg-brand-light border-brand-light'
                      : 'border-white/20 bg-transparent'
                  }`}>
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    ) : assigned ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {path.emoji && <span className="text-base">{path.emoji}</span>}
                  <span className={`text-sm truncate ${assigned ? 'text-white' : 'text-white/70'}`}>
                    {path.name}
                  </span>
                  {!path.is_active && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/40">
                      Inactiva
                    </span>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        {/* Mensaje de feedback */}
        {message && (
          <div className={`px-4 py-2 text-xs border-t ${
            message.type === 'success'
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Info de rutas asignadas */}
        {assignedPaths.length > 0 && !message && (
          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-[11px] text-white/40">
              {assignedPaths.length} ruta{assignedPaths.length !== 1 ? 's' : ''} asignada{assignedPaths.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LearningPathSelect
