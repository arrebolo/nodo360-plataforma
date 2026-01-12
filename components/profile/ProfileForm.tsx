'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface ProfileFormProps {
  userId: string
  email: string
  initial: {
    full_name: string
    avatar_url: string | null
    avatar_path: string | null
    role: 'student' | 'instructor' | 'mentor' | 'admin'
  }
}

export function ProfileForm({ userId, email, initial }: ProfileFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(initial.full_name)
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Detectar si hay cambios
  const isDirty = fullName !== initial.full_name || file !== null

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }

    // Validar tamaño (max 2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB')
      return
    }

    setFile(selectedFile)
    setError(null)

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  // Subir avatar a Supabase Storage
  const uploadAvatar = async (): Promise<{ url: string; path: string } | null> => {
    if (!file) return null

    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `avatar-${Date.now()}.${ext}`
    const filePath = `${userId}/${fileName}`

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Error al subir la imagen')
    }

    // Obtener URL pública
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    return {
      url: data.publicUrl,
      path: filePath
    }
  }

  // Guardar cambios
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Preparar datos a actualizar
      const updates: Record<string, unknown> = {
        full_name: fullName.trim(),
        updated_at: new Date().toISOString()
      }

      // Subir avatar si hay nuevo archivo
      if (file) {
        const avatarData = await uploadAvatar()
        if (avatarData) {
          updates.avatar_url = avatarData.url
          updates.avatar_path = avatarData.path
        }
      }

      // Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (updateError) {
        console.error('Update error:', updateError)
        throw new Error('Error al guardar los cambios')
      }

      // Éxito
      setSuccess(true)
      setFile(null)
      setAvatarPreview(null)
      if (updates.avatar_url) {
        setAvatarUrl(updates.avatar_url as string)
      }

      // Refrescar la página para actualizar el header
      router.refresh()

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Obtener inicial para avatar placeholder
  const getInitial = () => {
    if (fullName) return fullName[0].toUpperCase()
    if (email) return email[0].toUpperCase()
    return '?'
  }

  // URL del avatar a mostrar (preview > actual > null)
  const displayAvatarUrl = avatarPreview || avatarUrl || null

  // Role labels en español
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    instructor: 'Instructor',
    mentor: 'Mentor',
    student: 'Estudiante'
  }

  return (
    <div className="space-y-6">
      {/* Mensajes de feedback */}
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm">
          Cambios guardados correctamente
        </div>
      )}

      {/* Sección Avatar */}
      <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Foto de perfil</h2>

        <div className="flex items-center gap-6">
          {/* Avatar preview */}
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-white/10 bg-white/5">
              {displayAvatarUrl ? (
                <img
                  src={displayAvatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-light to-brand">
                  <span className="text-3xl font-bold text-white">
                    {getInitial()}
                  </span>
                </div>
              )}
            </div>

            {/* Indicador de cambio pendiente */}
            {file && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-light border-2 border-dark" />
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1">
            <p className="text-sm text-white/60 mb-3">
              JPG, PNG o WebP. Máximo 2MB. Recomendado 512×512px.
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? 'Cambiar foto' : 'Subir foto'}
              </Button>

              {(avatarUrl || file) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setAvatarPreview(null)
                  }}
                >
                  {file ? 'Cancelar' : 'Quitar'}
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Sección Información */}
      <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Información personal</h2>

        <div className="space-y-4">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                         placeholder:text-white/40 focus:outline-none focus:border-brand-light/50
                         focus:ring-1 focus:ring-brand-light/50 transition"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                         text-white/50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-white/40">
              El email no se puede cambiar desde aquí
            </p>
          </div>

          {/* Rol (read-only) */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Rol en la plataforma
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                initial.role === 'admin'
                  ? 'bg-error/20 text-error'
                  : initial.role === 'instructor'
                  ? 'bg-brand-light/20 text-brand-light'
                  : initial.role === 'mentor'
                  ? 'bg-accent-blue/20 text-accent-blue'
                  : 'bg-white/10 text-white/70'
              }`}>
                {roleLabels[initial.role] || initial.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Seguridad */}
      <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Seguridad</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Contraseña</p>
            <p className="text-xs text-white/50 mt-1">
              Actualiza tu contraseña periódicamente para mayor seguridad
            </p>
          </div>
          <Button
            href="/dashboard/perfil/cambiar-password"
            variant="ghost"
            size="sm"
          >
            Cambiar contraseña
          </Button>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={!isDirty || saving}
          loading={saving}
          className="min-w-[160px]"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
