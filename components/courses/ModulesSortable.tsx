'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SortableList, DragHandle } from '@/components/ui/SortableList'
import { LessonsSortable } from './LessonsSortable'
import { Button } from '@/components/ui/Button'

// ============================================
// TIPOS
// ============================================

interface Lesson {
  id: string
  title: string
  slug: string
  order_index: number
  is_free_preview?: boolean
  video_duration_minutes?: number
}

interface Module {
  id: string
  title: string
  description?: string
  order_index: number
  lessons: Lesson[]
}

interface ModulesSortableProps {
  courseId: string
  modules: Module[]
  onModulesChange: (modules: Module[]) => void
  onEditModule?: (module: Module) => void
  onDeleteModule?: (module: Module) => void
  onAddLesson?: (moduleId: string) => void
  onEditLesson?: (lesson: Lesson, moduleId: string) => void
  onDeleteLesson?: (lesson: Lesson, moduleId: string) => void
  disabled?: boolean
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ModulesSortable({
  courseId,
  modules,
  onModulesChange,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  disabled = false
}: ModulesSortableProps) {
  const [savingOrder, setSavingOrder] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map(m => m.id)) // Todos expandidos por defecto
  )

  // Toggle expandir/colapsar modulo
  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }, [])

  // Guardar nuevo orden de modulos en BD
  const saveModulesOrder = useCallback(async (newModules: Module[]) => {
    setSavingOrder(true)
    const supabase = createClient()

    try {
      // Actualizar order_index de cada modulo
      const updates = newModules.map((module, index) => ({
        id: module.id,
        order_index: index
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('modules')
          .update({ order_index: update.order_index })
          .eq('id', update.id)

        if (error) throw error
      }

      console.log('[ModulesSortable] Orden de modulos guardado')
    } catch (err) {
      console.error('[ModulesSortable] Error guardando orden:', err)
    } finally {
      setSavingOrder(false)
    }
  }, [])

  // Handler para reordenar modulos
  const handleModulesReorder = useCallback((newModules: Module[]) => {
    // Actualizar order_index localmente
    const updatedModules = newModules.map((m, index) => ({
      ...m,
      order_index: index
    }))

    onModulesChange(updatedModules)
    saveModulesOrder(updatedModules)
  }, [onModulesChange, saveModulesOrder])

  // Handler para reordenar lecciones dentro de un modulo
  const handleLessonsReorder = useCallback(async (moduleId: string, newLessons: Lesson[]) => {
    // Actualizar estado local
    const updatedModules = modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: newLessons.map((l, index) => ({ ...l, order_index: index }))
        }
      }
      return m
    })

    onModulesChange(updatedModules)

    // Guardar en BD
    const supabase = createClient()

    try {
      for (let i = 0; i < newLessons.length; i++) {
        const { error } = await supabase
          .from('lessons')
          .update({ order_index: i })
          .eq('id', newLessons[i].id)

        if (error) throw error
      }

      console.log('[ModulesSortable] Orden de lecciones guardado')
    } catch (err) {
      console.error('[ModulesSortable] Error guardando orden de lecciones:', err)
    }
  }, [modules, onModulesChange])

  // Renderizar un modulo
  const renderModule = useCallback((module: Module, isDragging: boolean) => {
    const isExpanded = expandedModules.has(module.id)
    const lessonsCount = module.lessons?.length || 0

    return (
      <div
        className={`
          bg-dark-surface border border-white/10 rounded-2xl overflow-hidden mb-3
          ${isDragging ? 'shadow-2xl shadow-brand-light/20 ring-2 ring-brand-light' : ''}
          ${savingOrder ? 'opacity-70' : ''}
        `}
      >
        {/* Header del modulo */}
        <div className="flex items-center gap-3 p-4 bg-white/5">
          {/* Drag handle */}
          {!disabled && <DragHandle />}

          {/* Boton expandir/colapsar */}
          <button
            type="button"
            onClick={() => toggleModule(module.id)}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            <svg
              className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Info del modulo */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {module.title}
            </h3>
            {module.description && (
              <p className="text-sm text-white/50 truncate">{module.description}</p>
            )}
          </div>

          {/* Badge de lecciones */}
          <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
            {lessonsCount} leccion{lessonsCount !== 1 ? 'es' : ''}
          </span>

          {/* Acciones */}
          {!disabled && (
            <div className="flex items-center gap-1">
              {onEditModule && (
                <button
                  type="button"
                  onClick={() => onEditModule(module)}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                  title="Editar modulo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDeleteModule && (
                <button
                  type="button"
                  onClick={() => onDeleteModule(module)}
                  className="p-2 hover:bg-error/20 rounded-lg transition text-white/60 hover:text-error"
                  title="Eliminar modulo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contenido expandible - Lecciones */}
        {isExpanded && (
          <div className="p-4 pt-0">
            {module.lessons && module.lessons.length > 0 ? (
              <LessonsSortable
                lessons={module.lessons}
                moduleId={module.id}
                onLessonsReorder={(newLessons) => handleLessonsReorder(module.id, newLessons)}
                onEditLesson={onEditLesson ? (lesson) => onEditLesson(lesson, module.id) : undefined}
                onDeleteLesson={onDeleteLesson ? (lesson) => onDeleteLesson(lesson, module.id) : undefined}
                disabled={disabled}
              />
            ) : (
              <div className="text-center py-6 text-white/40 text-sm">
                No hay lecciones en este modulo
              </div>
            )}

            {/* Boton anadir leccion */}
            {onAddLesson && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddLesson(module.id)}
                className="w-full mt-3 border border-dashed border-white/20 hover:border-white/40"
              >
                + Anadir leccion
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }, [expandedModules, toggleModule, disabled, savingOrder, onEditModule, onDeleteModule, onAddLesson, onEditLesson, onDeleteLesson, handleLessonsReorder])

  // Render overlay mientras se arrastra
  const renderOverlay = useCallback((module: Module) => {
    return (
      <div className="bg-dark-surface border-2 border-brand-light rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <DragHandle />
          <div>
            <h3 className="font-semibold text-white">{module.title}</h3>
            <span className="text-xs text-white/50">
              {module.lessons?.length || 0} lecciones
            </span>
          </div>
        </div>
      </div>
    )
  }, [])

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 bg-dark-surface border border-white/10 rounded-2xl">
        <div className="text-4xl mb-3">📦</div>
        <h3 className="text-lg font-semibold text-white mb-2">Sin modulos</h3>
        <p className="text-white/60 text-sm mb-4">
          Anade modulos para organizar el contenido del curso
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Indicador de guardando */}
      {savingOrder && (
        <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-brand-light bg-brand-light/10 px-3 py-1.5 rounded-full z-10">
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Guardando...
        </div>
      )}

      <SortableList
        items={modules}
        onReorder={handleModulesReorder}
        renderItem={renderModule}
        renderOverlay={renderOverlay}
        disabled={disabled || savingOrder}
      />
    </div>
  )
}
