'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Course, CourseLevel, CourseCategory, CourseStatus } from '@/types/database'

interface CourseFormProps {
  course?: Partial<Course>
  mode: 'create' | 'edit'
}

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]

const CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'defi', label: 'DeFi' },
  { value: 'nfts', label: 'NFTs' },
  { value: 'development', label: 'Desarrollo' },
  { value: 'trading', label: 'Trading' },
  { value: 'other', label: 'Otro' },
]

const STATUSES: { value: CourseStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Archivado' },
]

export function CourseForm({ course, mode }: CourseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(Boolean(course?.slug))

  const [formData, setFormData] = useState({
    title: course?.title || '',
    slug: course?.slug || '',
    description: course?.description || '',
    long_description: course?.long_description || '',
    level: course?.level || 'beginner' as CourseLevel,
    category: course?.category || 'bitcoin' as CourseCategory,
    status: course?.status || 'draft' as CourseStatus,
    price: course?.price || 0,
    is_free: course?.is_free ?? true,
    is_premium: course?.is_premium ?? false,
    duration_hours: course?.duration_hours || 0,
    tags: course?.tags?.join(', ') || '',
    thumbnail_url: course?.thumbnail_url || '',
    banner_url: course?.banner_url || '',
    meta_title: course?.meta_title || '',
    meta_description: course?.meta_description || '',
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: mode === 'create' && !slugTouched ? generateSlug(title) : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Client-side validation
    if (!formData.title.trim()) {
      setError('El titulo es obligatorio')
      setLoading(false)
      return
    }
    if (!formData.slug.trim()) {
      setError('El slug es obligatorio')
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: Number(formData.price),
        duration_hours: Number(formData.duration_hours),
      }

      const url = mode === 'create'
        ? '/api/admin/courses'
        : `/api/admin/courses/${course?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el curso')
      }

      router.push('/admin/cursos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Informacion basica */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Informacion Basica
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Titulo *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
              placeholder="Ej: Bitcoin desde Cero"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setFormData(prev => ({ ...prev, slug: e.target.value }))
              }}
              onBlur={() => setSlugTouched(true)}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
              placeholder="bitcoin-desde-cero"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Descripcion corta
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
            placeholder="Breve descripcion del curso..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Descripcion larga
          </label>
          <textarea
            value={formData.long_description}
            onChange={(e) => setFormData(prev => ({ ...prev, long_description: e.target.value }))}
            rows={5}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
            placeholder="Descripcion detallada del curso..."
          />
        </div>
      </section>

      {/* Clasificacion */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Clasificacion
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Nivel
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as CourseLevel }))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50"
            >
              {LEVELS.map(l => (
                <option key={l.value} value={l.value} className="bg-[#1a1a2e]">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CourseCategory }))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value} className="bg-[#1a1a2e]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CourseStatus }))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50"
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value} className="bg-[#1a1a2e]">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Tags (separados por coma)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
            placeholder="bitcoin, blockchain, principiantes"
          />
        </div>
      </section>

      {/* Precio y duracion */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Precio y Duracion
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Precio (USD)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Duracion (horas)
            </label>
            <input
              type="number"
              value={formData.duration_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: Number(e.target.value) }))}
              min="0"
              step="0.5"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
            />
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_free: e.target.checked,
                  is_premium: e.target.checked ? false : prev.is_premium
                }))}
                className="w-4 h-4 rounded accent-[#ff6b35]"
              />
              <span className="text-white/70">Gratis</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_premium}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_premium: e.target.checked,
                  is_free: e.target.checked ? false : prev.is_free
                }))}
                className="w-4 h-4 rounded accent-[#ff6b35]"
              />
              <span className="text-white/70">Premium</span>
            </label>
          </div>
        </div>
      </section>

      {/* Imagenes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Imagenes
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              URL Thumbnail
            </label>
            <input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              URL Banner
            </label>
            <input
              type="url"
              value={formData.banner_url}
              onChange={(e) => setFormData(prev => ({ ...prev, banner_url: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          SEO
        </h2>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Meta Title
          </label>
          <input
            type="text"
            value={formData.meta_title}
            onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50"
            placeholder="Titulo para motores de busqueda"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Meta Description
          </label>
          <textarea
            value={formData.meta_description}
            onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
            placeholder="Descripcion para motores de busqueda"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/10">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : mode === 'create' ? 'Crear Curso' : 'Guardar Cambios'}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
