'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  /** Nombre del bucket en Supabase Storage */
  bucket: string
  /** Carpeta dentro del bucket (ej: "courses/bitcoin-101") */
  folder: string
  /** URL actual de la imagen (si existe) */
  currentUrl?: string | null
  /** Callback cuando se sube una imagen exitosamente */
  onUpload: (url: string) => void
  /** Callback cuando se elimina la imagen */
  onRemove?: () => void
  /** Aspect ratio del contenedor */
  aspectRatio?: 'video' | 'square' | 'banner'
  /** Label del campo */
  label: string
  /** Texto de ayuda */
  hint?: string
  /** Tamaño maximo en MB */
  maxSizeMB?: number
  /** Deshabilitado */
  disabled?: boolean
}

export function ImageUpload({
  bucket,
  folder,
  currentUrl,
  onUpload,
  onRemove,
  aspectRatio = 'video',
  label,
  hint,
  maxSizeMB = 2,
  disabled = false
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    video: 'aspect-video',      // 16:9
    square: 'aspect-square',    // 1:1
    banner: 'aspect-[3/1]'      // 3:1
  }

  const handleFile = useCallback(async (file: File) => {
    if (disabled) return

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten imagenes JPG, PNG o WebP')
      return
    }

    // Validar tamano
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setError(`La imagen no puede superar ${maxSizeMB}MB`)
      return
    }

    setError(null)
    setUploading(true)

    // Mostrar preview local inmediatamente
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const supabase = createClient()

      // Verificar autenticacion
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('[ImageUpload] Error de autenticacion:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        })
        throw new Error('Error de autenticacion. Por favor, recarga la pagina.')
      }

      if (!user) {
        throw new Error('Debes iniciar sesion para subir imagenes')
      }

      // Generar nombre unico
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const fileName = `${timestamp}-${randomId}.${ext}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Log de la operacion de upload
      console.log('[ImageUpload] Iniciando upload:', {
        bucket,
        filePath,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        userId: user.id,
      })

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        // Log detallado del error de Supabase Storage
        console.error('[ImageUpload] ==================')
        console.error('[ImageUpload] Error de Supabase Storage:', {
          message: uploadError.message,
          name: uploadError.name,
          // @ts-expect-error - statusCode may exist on StorageError
          statusCode: uploadError.statusCode,
          // @ts-expect-error - error may exist on StorageError
          error: uploadError.error,
        })
        console.error('[ImageUpload] Detalles de la operacion:', {
          bucket,
          filePath,
          fileType: file.type,
          fileSize: file.size,
          userId: user.id,
        })
        console.error('[ImageUpload] Error completo:', uploadError)
        console.error('[ImageUpload] ==================')

        // Mapear errores comunes a mensajes en espanol
        const errorMessage = uploadError.message.toLowerCase()

        if (errorMessage.includes('bucket') && errorMessage.includes('not found')) {
          throw new Error(`El almacenamiento "${bucket}" no existe. Contacta al administrador.`)
        }
        if (errorMessage.includes('not allowed') || errorMessage.includes('policy')) {
          throw new Error('No tienes permisos para subir imagenes. Verifica tu rol.')
        }
        if (errorMessage.includes('payload too large') || errorMessage.includes('too large')) {
          throw new Error('La imagen es demasiado grande. Intenta con una mas pequena.')
        }
        if (errorMessage.includes('invalid') && errorMessage.includes('mime')) {
          throw new Error('Tipo de archivo no permitido. Usa JPG, PNG o WebP.')
        }
        if (errorMessage.includes('storage') && errorMessage.includes('quota')) {
          throw new Error('Almacenamiento lleno. Contacta al administrador.')
        }
        if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
          throw new Error('Ya existe un archivo con ese nombre.')
        }

        throw new Error(`Error al subir: ${uploadError.message}`)
      }

      console.log('[ImageUpload] Upload exitoso:', uploadData)

      // Obtener URL publica
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      console.log('[ImageUpload] Imagen subida:', urlData.publicUrl)

      // Notificar al padre
      onUpload(urlData.publicUrl)

    } catch (err) {
      // Log completo del error para debugging
      console.error('[ImageUpload] ==================')
      console.error('[ImageUpload] Error capturado:', err)

      if (err instanceof Error) {
        console.error('[ImageUpload] Error name:', err.name)
        console.error('[ImageUpload] Error message:', err.message)
        console.error('[ImageUpload] Error stack:', err.stack)

        // Intentar extraer mas info si es un error de Supabase
        const supabaseError = err as unknown as Record<string, unknown>
        if (supabaseError.status) {
          console.error('[ImageUpload] Error status:', supabaseError.status)
        }
        if (supabaseError.code) {
          console.error('[ImageUpload] Error code:', supabaseError.code)
        }
      }

      // Log del objeto completo como JSON
      try {
        console.error('[ImageUpload] JSON:', JSON.stringify(err, Object.getOwnPropertyNames(err as object)))
      } catch {
        // Ignorar si no se puede serializar
      }
      console.error('[ImageUpload] ==================')

      setError(err instanceof Error ? err.message : 'Error al subir la imagen. Revisa la consola para mas detalles.')
      // Revertir preview si falla
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }, [bucket, folder, currentUrl, maxSizeMB, onUpload, disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile, disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleRemove = useCallback(() => {
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onRemove?.()
    onUpload('')
  }, [onUpload, onRemove])

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      inputRef.current?.click()
    }
  }, [disabled, uploading])

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-white">
        {label}
      </label>

      {/* Hint */}
      {hint && (
        <p className="text-xs text-white/50">{hint}</p>
      )}

      {/* Drop zone */}
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-all overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${dragOver
            ? 'border-brand-light bg-brand-light/10'
            : 'border-white/20 hover:border-white/40 bg-white/5'
          }
          ${aspectClasses[aspectRatio]}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {preview ? (
          <>
            {/* Imagen preview */}
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay con acciones */}
            <div className={`
              absolute inset-0 bg-black/60 flex items-center justify-center gap-3
              transition-opacity
              ${uploading ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
            `}>
              {uploading ? (
                <div className="flex items-center gap-2 text-white">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm font-medium">Subiendo...</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      inputRef.current?.click()
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove()
                    }}
                    className="px-4 py-2 bg-error/30 hover:bg-error/40 rounded-lg text-white text-sm font-medium transition"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          /* Estado vacio */
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 p-4">
            <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-center">
              {uploading ? 'Subiendo...' : 'Arrastra una imagen o haz clic para seleccionar'}
            </span>
            <span className="text-xs mt-1 text-white/40">
              JPG, PNG o WebP - Max {maxSizeMB}MB
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-error flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  )
}

export default ImageUpload
