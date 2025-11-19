'use client'

import { useState, useEffect } from 'react'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/utils/youtube'

interface VideoPlayerProps {
  videoUrl: string
  title: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  className?: string
}

export default function VideoPlayer({
  videoUrl,
  title,
  onTimeUpdate,
  onEnded,
  className = '',
}: VideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    console.log('🎥 [VideoPlayer] Procesando URL del video:', videoUrl)

    const url = getYouTubeEmbedUrl(videoUrl)
    if (url) {
      setEmbedUrl(url)
      setError(false)
      console.log('✅ [VideoPlayer] URL de embed generada:', url)
    } else {
      console.error('❌ [VideoPlayer] No se pudo extraer ID del video:', videoUrl)
      setError(true)
    }
  }, [videoUrl])

  if (error) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-white/60">Error al cargar el video</p>
          <p className="text-sm text-white/40 mt-2">URL inválida: {videoUrl}</p>
        </div>
      </div>
    )
  }

  if (!embedUrl) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-12">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Cargando video...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="w-full aspect-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
