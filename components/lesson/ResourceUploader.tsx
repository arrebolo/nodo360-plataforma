'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Resource {
  id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  order_index: number
}

interface ResourceUploaderProps {
  lessonId: string
  resources: Resource[]
  onResourcesChange: (resources: Resource[]) => void
  disabled?: boolean
}

const fileTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  'application/pdf': { icon: '📄', label: 'PDF', color: 'text-red-400' },
  'application/zip': { icon: '📦', label: 'ZIP', color: 'text-yellow-400' },
  'application/x-zip-compressed': { icon: '📦', label: 'ZIP', color: 'text-yellow-400' },
  'image/jpeg': { icon: '🖼️', label: 'Imagen', color: 'text-blue-400' },
  'image/png': { icon: '🖼️', label: 'Imagen', color: 'text-blue-400' },
  'image/webp': { icon: '🖼️', label: 'Imagen', color: 'text-blue-400' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', label: 'Excel', color: 'text-green-400' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', label: 'Word', color: 'text-blue-400' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📽️', label: 'PowerPoint', color: 'text-orange-400' },
  'text/plain': { icon: '📃', label: 'Texto', color: 'text-gray-400' },
  'text/markdown': { icon: '📃', label: 'Markdown', color: 'text-gray-400' }
}

function getFileConfig(mimeType: string) {
  return fileTypeConfig[mimeType] || { icon: '📎', label: 'Archivo', color: 'text-white/60' }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ResourceUploader({
  lessonId,
  resources,
  onResourcesChange,
  disabled = false
}: ResourceUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    const supabase = createClient()
    const newResources: Resource[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validar tamano (50MB)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`${file.name} excede el limite de 50MB`)
        }

        setUploadProgress(Math.round(((i) / files.length) * 100))

        // Generar path unico
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const ext = file.name.split('.').pop() || ''
        const fileName = `${timestamp}-${randomId}.${ext}`
        const filePath = `${lessonId}/${fileName}`

        // Subir archivo
        const { error: uploadError } = await supabase.storage
          .from('lesson-resources')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Obtener URL publica
        const { data: urlData } = supabase.storage
          .from('lesson-resources')
          .getPublicUrl(filePath)

        // Crear registro en BD
        // Note: lesson_resources table must be created in Supabase
        const { data: resourceData, error: dbError } = await (supabase as any)
          .from('lesson_resources')
          .insert({
            lesson_id: lessonId,
            title: file.name.replace(/\.[^/.]+$/, ''),
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            order_index: resources.length + i
          })
          .select()
          .single()

        if (dbError) throw dbError

        newResources.push(resourceData)
      }

      onResourcesChange([...resources, ...newResources])
      setUploadProgress(100)

    } catch (err) {
      console.error('[ResourceUploader] Error:', err)
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [lessonId, resources, onResourcesChange, disabled])

  const handleDelete = useCallback(async (resource: Resource) => {
    if (disabled) return

    if (!confirm(`Eliminar "${resource.title}"?`)) return

    const supabase = createClient()

    try {
      const url = new URL(resource.file_url)
      const pathMatch = url.pathname.match(/lesson-resources\/(.+)$/)

      if (pathMatch) {
        await supabase.storage
          .from('lesson-resources')
          .remove([pathMatch[1]])
      }

      const { error } = await (supabase as any)
        .from('lesson_resources')
        .delete()
        .eq('id', resource.id)

      if (error) throw error

      onResourcesChange(resources.filter(r => r.id !== resource.id))

    } catch (err) {
      console.error('[ResourceUploader] Delete error:', err)
      setError('Error al eliminar recurso')
    }
  }, [resources, onResourcesChange, disabled])

  const handleUpdateTitle = useCallback(async (resource: Resource) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await (supabase as any)
        .from('lesson_resources')
        .update({ title: editTitle.trim() })
        .eq('id', resource.id)

      if (error) throw error

      onResourcesChange(resources.map(r =>
        r.id === resource.id ? { ...r, title: editTitle.trim() } : r
      ))

    } catch (err) {
      console.error('[ResourceUploader] Update error:', err)
      setError('Error al actualizar titulo')
    } finally {
      setEditingId(null)
    }
  }, [editTitle, resources, onResourcesChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white">
          Recursos adjuntos
        </label>
        <span className="text-xs text-white/50">
          {resources.length} archivo{resources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de recursos */}
      {resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((resource) => {
            const config = getFileConfig(resource.file_type)
            const isEditing = editingId === resource.id

            return (
              <div
                key={resource.id}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl group"
              >
                <span className={`text-xl ${config.color}`}>
                  {config.icon}
                </span>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleUpdateTitle(resource)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTitle(resource)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                      className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-brand-light"
                    />
                  ) : (
                    <p
                      className="text-sm text-white truncate cursor-pointer hover:text-brand-light"
                      onClick={() => {
                        setEditingId(resource.id)
                        setEditTitle(resource.title)
                      }}
                      title="Click para editar titulo"
                    >
                      {resource.title}
                    </p>
                  )}
                  <p className="text-xs text-white/50">
                    {config.label} - {formatFileSize(resource.file_size)}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                    title="Descargar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleDelete(resource)}
                      className="p-1.5 hover:bg-error/20 rounded-lg transition text-white/60 hover:text-error"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Zona de upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed border-white/10' : 'border-white/20 hover:border-white/40 cursor-pointer'}
          ${uploading ? 'border-brand-light bg-brand-light/10' : ''}
        `}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-brand-light">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Subiendo...</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-light transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 mx-auto mb-2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-white/60">
              Arrastra archivos o <span className="text-brand-light">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-white/40 mt-1">
              PDF, ZIP, Excel, Word, PowerPoint, imagenes - Max 50MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-error flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => handleUpload(e.target.files)}
        className="hidden"
        disabled={disabled || uploading}
        accept=".pdf,.zip,.xlsx,.docx,.pptx,.jpg,.jpeg,.png,.webp,.txt,.md"
      />
    </div>
  )
}
