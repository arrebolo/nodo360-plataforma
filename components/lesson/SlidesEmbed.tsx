'use client'

import { useState } from 'react'
import { Maximize2, Minimize2, ExternalLink, FileText } from 'lucide-react'

interface SlidesEmbedProps {
  url: string
  type?: 'google_slides' | 'canva' | 'pdf' | 'other'
  title?: string
}

export function SlidesEmbed({ url, type = 'google_slides', title = 'Presentación' }: SlidesEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Convertir URL de compartir a URL de embed
  const getEmbedUrl = (originalUrl: string, slideType: string): string => {
    // Google Slides
    if (slideType === 'google_slides' || originalUrl.includes('docs.google.com/presentation')) {
      // Formato: https://docs.google.com/presentation/d/PRESENTATION_ID/edit
      // Convertir a: https://docs.google.com/presentation/d/PRESENTATION_ID/embed
      const match = originalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (match) {
        return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`
      }
    }

    // Canva
    if (slideType === 'canva' || originalUrl.includes('canva.com')) {
      // Canva ya proporciona URL de embed
      if (originalUrl.includes('/embed')) {
        return originalUrl
      }
      // Intentar convertir URL de vista a embed
      return originalUrl.replace('/view', '/embed')
    }

    // PDF (usar Google Docs Viewer)
    if (slideType === 'pdf' || originalUrl.endsWith('.pdf')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(originalUrl)}&embedded=true`
    }

    // Otros - asumir que ya es URL de embed
    return originalUrl
  }

  const embedUrl = getEmbedUrl(url, type)

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-light" />
          {title}
        </h3>

        <div className="flex items-center gap-2">
          {/* Botón fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>

          {/* Link para abrir en nueva pestaña */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Container del iframe */}
      <div
        className={`
          relative bg-dark-surface border border-white/10 rounded-xl overflow-hidden
          ${isFullscreen ? 'fixed inset-4 z-50' : 'aspect-[16/9]'}
        `}
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-surface">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
              <span className="text-white/60 text-sm">Cargando presentación...</span>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          title={title}
        />

        {/* Botón para cerrar fullscreen */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition z-10"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/90 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  )
}
