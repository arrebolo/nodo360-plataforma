'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  long_description: string | null
  level: string
  status: string
  is_premium: boolean
  thumbnail_url: string | null
  banner_url: string | null
}

interface EditCourseFormProps {
  course: Course
}

export function EditCourseForm({ course }: EditCourseFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState(course.title ?? '')
  const [slug, setSlug] = useState(course.slug ?? '')
  const [shortDescription, setShortDescription] = useState(course.description ?? '')
  const [longDescription, setLongDescription] = useState(course.long_description ?? '')
  const [level, setLevel] = useState(course.level ?? 'beginner')
  const [status, setStatus] = useState(course.status ?? 'draft')
  const [isPremium, setIsPremium] = useState(course.is_premium ?? false)
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? '')
  const [bannerUrl, setBannerUrl] = useState(course.banner_url ?? '')

  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          description: shortDescription,
          long_description: longDescription,
          level,
          status,
          is_premium: isPremium,
          thumbnail_url: thumbnailUrl || null,
          banner_url: bannerUrl || null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.error || 'Error al guardar el curso')
        setSaving(false)
        return
      }

      // éxito → volver a la lista de cursos
      router.push('/admin/cursos')
    } catch (error) {
      console.error('[EditCourseForm] Error inesperado:', error)
      alert('Error inesperado al guardar el curso')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium mb-1">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium mb-1">Slug (URL amigable) *</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          required
        />
        <p className="mt-1 text-xs text-neutral-400">URL: /cursos/{slug || 'mi-curso'}</p>
      </div>

      {/* Descripción corta */}
      <div>
        <label className="block text-sm font-medium mb-1">Descripción corta</label>
        <input
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
        />
      </div>

      {/* Descripción larga */}
      <div>
        <label className="block text-sm font-medium mb-1">Descripción larga</label>
        <textarea
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm resize-none"
        />
      </div>

      {/* Nivel + Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nivel *</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          >
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Estado *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
      </div>

      {/* Gratis / Premium */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!isPremium}
            onChange={(e) => setIsPremium(!e.target.checked)}
          />
          <span>Curso gratuito</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
          />
          <span>Premium</span>
        </label>
      </div>

      {/* URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">URL Thumbnail</label>
          <input
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL Banner</label>
          <input
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push('/admin/cursos')}
          className="px-4 py-2 rounded-md border border-neutral-700 text-sm"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-md bg-orange-500 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar curso'}
        </button>
      </div>
    </form>
  )
}
