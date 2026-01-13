'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

// Dynamic import for heavy RichTextEditor component
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  {
    loading: () => (
      <div className="h-64 bg-white/5 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    ),
    ssr: false,
  }
)

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
  const [content, setContent] = useState(initialData?.content || '')

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
      // Add content from RichTextEditor state
      formData.set('content', content)
      await action(formData)
    } catch (error: any) {
      // Ignorar errores de redirect de Next.js (es comportamiento esperado)
      // El redirect() lanza una excepción especial con digest que contiene NEXT_REDIRECT
      if (error?.digest?.includes('NEXT_REDIRECT') || error?.message?.includes('NEXT_REDIRECT')) {
        return
      }
      console.error('Error al guardar:', error)
      const errorMessage = error?.message || 'Error desconocido'
      alert('Error al guardar la lección: ' + errorMessage)
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition resize-none"
            placeholder="Descripción breve de la lección"
          />
        </div>

        {/* Contenido (editor WYSIWYG) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Contenido de la leccion
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Escribe el contenido de la leccion. Usa la barra de herramientas para dar formato..."
          />
          <p className="mt-2 text-xs text-white/50">
            Puedes usar titulos, listas, bloques de codigo, imagenes y videos de YouTube
          </p>
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
            placeholder="ej. 15"
          />
        </div>

        {/* Separador */}
        <div className="border-t border-white/10 my-6 pt-6">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Presentación / Slides (opcional)
          </h3>
        </div>

        {/* URL de Slides */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            URL de Presentación
          </label>
          <input
            type="url"
            name="slides_url"
            defaultValue={initialData?.slides_url}
            className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition"
            placeholder="https://docs.google.com/presentation/d/..."
          />
          <p className="mt-2 text-xs text-white/50">
            Pega la URL de Google Slides, Canva o cualquier presentación embebible
          </p>
        </div>

        {/* Tipo de Slides */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Tipo de presentación
          </label>
          <select
            name="slides_type"
            defaultValue={initialData?.slides_type || 'google_slides'}
            className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-white focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="google_slides" className="bg-[#0d1117] text-white">Google Slides</option>
            <option value="canva" className="bg-[#0d1117] text-white">Canva</option>
            <option value="pdf" className="bg-[#0d1117] text-white">PDF</option>
            <option value="other" className="bg-[#0d1117] text-white">Otro</option>
          </select>
        </div>

        {/* Vista previa gratuita */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_free_preview"
            id="is_free_preview"
            defaultChecked={initialData?.is_free_preview}
            className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand-light focus:ring-2 focus:ring-brand-light/20"
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
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-brand-light/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Lección')}
        </button>
      </div>
    </form>
  )
}

