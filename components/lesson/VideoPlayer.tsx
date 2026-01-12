'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { PlayCircle } from 'lucide-react'

type VideoPlayerProps = {
  videoUrl?: string | null
  thumbnailUrl?: string | null
  title: string
  onTimeUpdate?: (seconds: number) => void
  onActivity?: () => void
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  onTimeUpdate,
  onActivity,
}: VideoPlayerProps) {
  const watchSecondsRef = useRef(0)

  // Ping de actividad (cada 30s si el usuario está en la lección)
  useEffect(() => {
    if (!onActivity) return
    onActivity()
    const id = setInterval(() => onActivity(), 30_000)
    return () => clearInterval(id)
  }, [onActivity])

  // Tracking para HTML5 video
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget
    const current = Math.floor(v.currentTime)
    if (current > watchSecondsRef.current) {
      watchSecondsRef.current = current
      onTimeUpdate?.(current)
    }
  }

  // Si no hay video, mostrar placeholder
  if (!videoUrl) {
    return (
      <Card className="aspect-video flex items-center justify-center bg-neutral-100 p-0">
        <div className="text-center space-y-2">
          <PlayCircle className="h-12 w-12 text-neutral-300 mx-auto" />
          <p className="text-sm text-neutral-500">Video no disponible</p>
        </div>
      </Card>
    )
  }

  // Detectar tipo de video
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
  const isVimeo = videoUrl.includes('vimeo.com')
  const isHtml5 =
    videoUrl.endsWith('.mp4') ||
    videoUrl.endsWith('.webm') ||
    videoUrl.endsWith('.ogg')

  // YouTube embed
  if (isYouTube) {
    let videoId: string | null = null
    if (videoUrl.includes('youtu.be')) {
      videoId = videoUrl.split('/').pop() || null
    } else {
      try {
        videoId = new URL(videoUrl).searchParams.get('v')
      } catch {
        videoId = null
      }
    }

    return (
      <Card className="aspect-video overflow-hidden p-0">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Card>
    )
  }

  // Vimeo embed
  if (isVimeo) {
    const vimeoId = videoUrl.split('/').pop()
    return (
      <Card className="aspect-video overflow-hidden p-0">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title={title}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </Card>
    )
  }

  // HTML5 Video
  if (isHtml5) {
    return (
      <Card className="aspect-video overflow-hidden p-0 bg-black">
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full"
          poster={thumbnailUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => onActivity?.()}
          onPause={() => onActivity?.()}
        >
          Tu navegador no soporta video HTML5.
        </video>
      </Card>
    )
  }

  // Fallback: iframe genérico para URLs externas
  return (
    <Card className="aspect-video overflow-hidden p-0 bg-black">
      <iframe
        src={videoUrl}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Card>
  )
}

// Export default for backward compatibility
export default VideoPlayer


