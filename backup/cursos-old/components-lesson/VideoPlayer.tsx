'use client'

import { useState } from 'react'
import type { VideoBlock } from '@/types/lesson-content'

interface VideoPlayerProps {
  block: VideoBlock
}

export function VideoPlayer({ block }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  const getEmbedUrl = (url: string, provider?: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return `https://player.vimeo.com/video/${videoId}`
    }

    // Direct URL
    return url
  }

  const embedUrl = getEmbedUrl(block.url, block.provider)
  const isDirectVideo = !embedUrl.includes('youtube.com') && !embedUrl.includes('vimeo.com')

  return (
    <div className="w-full mb-8">
      <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 shadow-xl">
        <div className="relative pb-[56.25%]">
          {!isLoaded && block.thumbnail && (
            <div className="absolute inset-0">
              <img
                src={block.thumbnail}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  onClick={() => setIsLoaded(true)}
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {(isLoaded || !block.thumbnail) && (
            <>
              {isDirectVideo ? (
                <video
                  src={embedUrl}
                  controls
                  className="absolute inset-0 w-full h-full"
                  onLoadedData={() => setIsLoaded(true)}
                />
              ) : (
                <iframe
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  onLoad={() => setIsLoaded(true)}
                />
              )}
            </>
          )}
        </div>

        {block.duration && (
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/80 text-white text-sm rounded-md">
            {Math.floor(block.duration / 60)}:{String(block.duration % 60).padStart(2, '0')}
          </div>
        )}
      </div>
    </div>
  )
}
