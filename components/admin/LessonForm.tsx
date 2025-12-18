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
    } catch (error: any) {
      // El redirect() de Next.js lanza un error especial NEXT_REDIRECT
      // No debemos tratarlo como error real
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        // Es un redirect, no un error real - dejar que Next.js lo maneje
        throw error
      }
      // Solo mostrar error si es un error real (no un redirect)
      console.error('❌ [LessonForm] Error real al guardar:', error?.message || error)
      alert('Error al guardar la lección: ' + (error?.message || 'Error desconocido'))
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

        {/* ===== SECCIÓN MULTIMEDIA ===== */}
        <div className="border-t border-white/10 pt-6 mt-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span>📎</span> Contenido Multimedia
          </h3>

          <div className="space-y-5">
            {/* Video URL */}
            <div className="space-y-2">
              <label htmlFor="video_url" className="block text-sm font-medium text-[#C5C7D3]">
                🎬 URL del Video
              </label>
              <input
                type="url"
                id="video_url"
                name="video_url"
                defaultValue={initialData?.video_url || ''}
                placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3]/50 focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
              />
              <p className="text-xs text-[#C5C7D3]/60">
                Enlace de YouTube, Vimeo u otra plataforma de video
              </p>
            </div>

            {/* Duración del video */}
            <div className="space-y-2">
              <label htmlFor="video_duration_minutes" className="block text-sm font-medium text-[#C5C7D3]">
                ⏱️ Duración del video (minutos)
              </label>
              <input
                type="number"
                id="video_duration_minutes"
                name="video_duration_minutes"
                defaultValue={initialData?.video_duration_minutes || ''}
                placeholder="15"
                min="0"
                className="w-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3]/50 focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
              />
            </div>

            {/* Slides URL */}
            <div className="space-y-2">
              <label htmlFor="slides_url" className="block text-sm font-medium text-[#C5C7D3]">
                📊 URL de Slides/Presentación
              </label>
              <input
                type="url"
                id="slides_url"
                name="slides_url"
                defaultValue={initialData?.slides_url || ''}
                placeholder="https://docs.google.com/presentation/d/... o https://canva.com/..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3]/50 focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
              />
              <p className="text-xs text-[#C5C7D3]/60">
                Google Slides, Canva, PowerPoint Online, etc.
              </p>
            </div>

            {/* PDF URL */}
            <div className="space-y-2">
              <label htmlFor="pdf_url" className="block text-sm font-medium text-[#C5C7D3]">
                📄 URL de PDF/Documento
              </label>
              <input
                type="url"
                id="pdf_url"
                name="pdf_url"
                defaultValue={initialData?.pdf_url || ''}
                placeholder="https://drive.google.com/file/d/... o https://dropbox.com/..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3]/50 focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
              />
              <p className="text-xs text-[#C5C7D3]/60">
                PDF en Google Drive, Dropbox, o enlace directo
              </p>
            </div>

            {/* Resources URL */}
            <div className="space-y-2">
              <label htmlFor="resources_url" className="block text-sm font-medium text-[#C5C7D3]">
                📁 URL de Recursos Adicionales
              </label>
              <input
                type="url"
                id="resources_url"
                name="resources_url"
                defaultValue={initialData?.resources_url || ''}
                placeholder="https://drive.google.com/drive/folders/... o https://notion.so/..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#C5C7D3]/50 focus:border-[#24D4FF] focus:ring-2 focus:ring-[#24D4FF]/20 transition"
              />
              <p className="text-xs text-[#C5C7D3]/60">
                Carpeta con materiales extra, código, plantillas, etc.
              </p>
            </div>
          </div>
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
