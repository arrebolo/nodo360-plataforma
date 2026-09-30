'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
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
    bio: string
    website: string
    twitter: string
    linkedin: string
    github: string
  }
}

export function ProfileForm({ userId, email, initial }: ProfileFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(initial.full_name)
  const [bio, setBio] = useState(initial.bio)
  const [website, setWebsite] = useState(initial.website)
  const [twitter, setTwitter] = useState(initial.twitter)
  const [linkedin, setLinkedin] = useState(initial.linkedin)
  const [github, setGithub] = useState(initial.github)
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Detectar si hay cambios
  /**
   * Un enlace, o nada.
   *
   * La base tiene el mismo CHECK desde la 101, y ahi es donde de verdad se
   * impide: esto se escribe con el cliente de sesion contra PostgREST, donde no
   * hay formulario. Aqui se valida para decirlo ANTES de intentarlo, no para ser
   * la barrera.
   */
  const ENLACE = new RegExp('^https?://\S+$', 'i')
  const esEnlace = (v: string) => v.trim() === '' || ENLACE.test(v.trim())

  const errorDeEnlace =
    !esEnlace(website) ? 'La web tiene que empezar por https://'
    : !esEnlace(linkedin) ? 'El enlace de LinkedIn tiene que empezar por https://'
    : !esEnlace(github) ? 'El enlace de GitHub tiene que empezar por https://'
    : null

  const isDirty =
    fullName !== initial.full_name ||
    bio !== initial.bio ||
    website !== initial.website ||
    twitter !== initial.twitter ||
    linkedin !== initial.linkedin ||
    github !== initial.github ||
    file !== null

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
      // Sin updated_at: la pone la base con el trigger trigger_users_updated_at
      // (migracion 085). Mandarla desde aqui hacia fallar TODO el UPDATE con
      // «permission denied for column updated_at», porque updated_at no esta
      // entre las columnas que authenticated puede escribir, y no debe estarlo:
      // una marca de tiempo de modificacion no la pone el cliente.
      const updates: Record<string, unknown> = {
        full_name: fullName.trim(),
        // Cadena vacia y no null: asi se puede BORRAR un enlace. El CHECK de la
        // 101 acepta las dos cosas justo por esto.
        bio: bio.trim(),
        website: website.trim(),
        twitter: twitter.trim(),
        linkedin: linkedin.trim(),
        github: github.trim(),
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

          {/* Biografia */}
          <div>
            <label htmlFor="perfil-bio" className="block text-sm font-medium text-white/80 mb-2">
              Biografía
            </label>
            <textarea
              id="perfil-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Quién eres y de qué puedes hablar con conocimiento. Sin currículum: dos o tres frases."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/50 transition"
            />
            <p className="mt-1 text-xs text-white/40">
              Se muestra en tu perfil público. {600 - bio.length} caracteres restantes.
            </p>
          </div>

          {/* Enlaces */}
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['perfil-web', 'Web', website, setWebsite, 'https://tu-web.com'],
              ['perfil-x', 'X', twitter, setTwitter, '@tu_usuario o la URL'],
              ['perfil-linkedin', 'LinkedIn', linkedin, setLinkedin, 'https://linkedin.com/in/…'],
              ['perfil-github', 'GitHub', github, setGithub, 'https://github.com/…'],
            ] as const).map(([id, etiqueta, valor, set, ejemplo]) => {
              const mal = etiqueta !== 'X' && !esEnlace(valor)
              return (
                <div key={id}>
                  <label htmlFor={id} className="block text-sm font-medium text-white/80 mb-2">
                    {etiqueta}
                  </label>
                  <input
                    id={id}
                    type="text"
                    value={valor}
                    onChange={(e) => set(e.target.value)}
                    placeholder={ejemplo}
                    aria-invalid={mal}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-1 transition ${mal ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : 'border-white/10 focus:border-brand-light/50 focus:ring-brand-light/50'}`}
                  />
                </div>
              )
            })}
          </div>

          {errorDeEnlace && <p className="text-sm text-red-400">{errorDeEnlace}</p>}

          {/* Las areas de conocimiento NO son un campo: salen de las especialidades
              VERIFICADAS, porque un campo libre afirmaria un conocimiento que nadie ha
              comprobado. */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">
              <strong className="text-white">Áreas de conocimiento.</strong> No se escriben
              aquí: salen de las especialidades en las que estás verificado, y aparecen solas
              en tu perfil público. Un campo libre afirmaría algo que nadie ha comprobado.
            </p>
            <Link
              href="/dashboard/instructor/verificacion"
              className="mt-2 inline-block text-sm text-brand-light hover:underline"
            >
              Mi verificación →
            </Link>
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
