'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface CourseFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: any
}

export function CourseForm({ action, initialData }: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [isFree, setIsFree] = useState(initialData?.is_free ?? true)

  // Auto-generar slug desde título
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    // Solo auto-generar slug si no hay datos iniciales (modo creación)
    if (!initialData) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await action(formData)
    } catch (error: any) {
      // redirect() lanza NEXT_REDIRECT - no es un error real
      if (error?.digest?.includes('NEXT_REDIRECT')) {
        return // Redirect exitoso, no mostrar error
      }
      console.error('Error al guardar:', error)
      alert('Error al guardar el curso')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Card del formulario */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        {/* Título */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Título del Curso *
          </label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={handleTitleChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
            placeholder="ej. Bitcoin para Principiantes"
          />
        </div>

        {/* Slug */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Slug (URL amigable) *
          </label>
          <input
            type="text"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
            placeholder="bitcoin-para-principiantes"
          />
          <p className="mt-2 text-sm text-white/70">
            URL: /cursos/{slug || 'slug-del-curso'}
          </p>
        </div>

        {/* Descripción Corta */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Descripción Corta *
          </label>
          <input
            type="text"
            name="description"
            defaultValue={initialData?.description}
            required
            maxLength={160}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
            placeholder="Descripción breve para cards y SEO (máx. 160 caracteres)"
          />
        </div>

        {/* Descripción Larga */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Descripción Larga
          </label>
          <textarea
            name="long_description"
            defaultValue={initialData?.long_description}
            rows={5}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition resize-none"
            placeholder="Descripción detallada del curso, qué aprenderán los estudiantes, requisitos, etc."
          />
        </div>

        {/* Nivel y Estado */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nivel *
            </label>
            <select
              name="level"
              required
              defaultValue={initialData?.level || 'beginner'}
              className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="beginner" className="bg-[#0d1117] text-white">Principiante</option>
              <option value="intermediate" className="bg-[#0d1117] text-white">Intermedio</option>
              <option value="advanced" className="bg-[#0d1117] text-white">Avanzado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Estado *
            </label>
            <select
              name="status"
              required
              defaultValue={initialData?.status || 'draft'}
              className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="draft" className="bg-[#0d1117] text-white">Borrador</option>
              <option value="published" className="bg-[#0d1117] text-white">Publicado</option>
              <option value="archived" className="bg-[#0d1117] text-white">Archivado</option>
            </select>
          </div>
        </div>

        {/* Precio y Tipo */}
        <div className="mb-6">
          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_free"
                value="true"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand-light focus:ring-2 focus:ring-brand-light/20"
              />
              <span className="text-white font-medium">Curso Gratuito</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_premium"
                value="true"
                defaultChecked={initialData?.is_premium}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand focus:ring-2 focus:ring-brand/20"
              />
              <span className="text-white font-medium">Premium</span>
            </label>
          </div>

          {!isFree && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Precio (USD)
              </label>
              <input
                type="number"
                name="price"
                defaultValue={initialData?.price}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
                placeholder="49.99"
              />
            </div>
          )}
        </div>

        {/* URLs de Imágenes */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              URL Thumbnail
            </label>
            <input
              type="url"
              name="thumbnail_url"
              defaultValue={initialData?.thumbnail_url}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              URL Banner
            </label>
            <input
              type="url"
              name="banner_url"
              defaultValue={initialData?.banner_url}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/cursos"
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          {initialData ? 'Volver' : 'Cancelar'}
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-brand-light/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Curso')}
        </button>
      </div>
    </form>
  )
}

