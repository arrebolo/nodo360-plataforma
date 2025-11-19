'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface LessonFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: any
  courseId: string
  moduleId: string
}

export function LessonForm({ action, initialData, courseId, moduleId }: LessonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')

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
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar la lección')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        {/* Título */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Título de la Lección *
          </label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={handleTitleChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
            placeholder="ej. ¿Qué es Bitcoin?"
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
            placeholder="que-es-bitcoin"
          />
        </div>

        {/* Descripción */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            defaultValue={initialData?.description}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition resize-none"
            placeholder="Descripción breve de la lección"
          />
        </div>

        {/* Contenido (texto largo) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Contenido
          </label>
          <textarea
            name="content"
            defaultValue={initialData?.content}
            rows={8}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition resize-none"
            placeholder="Contenido detallado de la lección (Markdown soportado)"
          />
        </div>

        {/* Video URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            URL del Video (YouTube)
          </label>
          <input
            type="url"
            name="video_url"
            defaultValue={initialData?.video_url}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        {/* Duración del video */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Duración del Video (minutos)
          </label>
          <input
            type="number"
            name="video_duration_minutes"
            defaultValue={initialData?.video_duration_minutes}
            min="0"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3] focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
            placeholder="ej. 15"
          />
        </div>

        {/* Vista previa gratuita */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_free_preview"
            id="is_free_preview"
            defaultChecked={initialData?.is_free_preview}
            className="w-5 h-5 rounded border-white/10 bg-white/5 text-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
          />
          <label htmlFor="is_free_preview" className="text-white font-medium">
            Lección de Vista Previa Gratuita
          </label>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones`}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          {initialData ? 'Volver' : 'Cancelar'}
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-[#ff6b35]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Lección')}
        </button>
      </div>
    </form>
  )
}
