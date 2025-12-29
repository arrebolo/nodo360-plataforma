'use client'

import { useMemo } from 'react'

type LessonContentProps = {
  title: string
  description?: string | null
  videoUrl?: string | null
  slidesUrl?: string | null
  pdfUrl?: string | null
  fallbackImageUrl?: string
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url)
}

function isVimeo(url: string) {
  return /vimeo\.com/i.test(url)
}

function getYouTubeEmbed(url: string) {
  // soporta youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.pathname.includes('/embed/')) {
      return `https://www.youtube.com${u.pathname}`
    }
    return null
  } catch {
    return null
  }
}

function getVimeoEmbed(url: string) {
  // vimeo.com/<id>
  const match = url.match(/vimeo\.com\/(\d+)/i)
  if (!match?.[1]) return null
  return `https://player.vimeo.com/video/${match[1]}`
}

function isHtml5Video(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
}

export default function LessonContent({
  title,
  description,
  videoUrl,
  slidesUrl,
  pdfUrl,
  fallbackImageUrl = '/images/lesson-fallback.jpg',
}: LessonContentProps) {
  const videoEmbed = useMemo(() => {
    if (!videoUrl) return null
    if (isYouTube(videoUrl)) return getYouTubeEmbed(videoUrl)
    if (isVimeo(videoUrl)) return getVimeoEmbed(videoUrl)
    return null
  }, [videoUrl])

  const hasVideo = Boolean(videoUrl)
  const hasSlides = Boolean(slidesUrl)
  const hasPdf = Boolean(pdfUrl)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* Header interno del bloque de contenido */}
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wide opacity-70">Contenido</div>
        <h2 className="text-lg font-semibold mt-1">{title}</h2>
        {description ? <p className="text-sm opacity-80 mt-2">{description}</p> : null}
      </div>

      {/* Video */}
      {hasVideo ? (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
          {videoEmbed ? (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={videoEmbed}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video de la lección"
              />
            </div>
          ) : isHtml5Video(videoUrl!) ? (
            <video controls className="w-full">
              <source src={videoUrl!} />
              Tu navegador no soporta vídeo HTML5.
            </video>
          ) : (
            <div className="p-4">
              <p className="text-sm opacity-80">
                No pude embeber este vídeo automáticamente. Abre el enlace:
              </p>
              <a
                href={videoUrl!}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline underline-offset-4 opacity-90 hover:opacity-100"
              >
                Ver vídeo
              </a>
            </div>
          )}
        </div>
      ) : null}

      {/* Slides (si no hay video) */}
      {!hasVideo && hasSlides ? (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-sm font-medium">Slides</div>
            <a
              href={slidesUrl!}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline underline-offset-4 opacity-80 hover:opacity-100"
            >
              Abrir en otra pestaña
            </a>
          </div>

          <div className="relative w-full" style={{ height: 520 }}>
            <iframe
              src={slidesUrl!}
              className="absolute inset-0 w-full h-full"
              title="Slides de la lección"
            />
          </div>
        </div>
      ) : null}

      {/* Fallback (si no hay video ni slides) */}
      {!hasVideo && !hasSlides ? (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
          <div className="p-4">
            <p className="text-sm opacity-80">
              Esta lección todavía no tiene vídeo ni slides. Mientras tanto, aquí tienes una portada y el resumen.
            </p>
          </div>

          <div className="px-4 pb-4">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
              {/* Si no tienes esa imagen aún, crea un placeholder en /public/images/lesson-fallback.jpg */}
              <img
                src={fallbackImageUrl}
                alt="Portada de lección"
                className="w-full h-[260px] object-cover"
                loading="lazy"
              />
            </div>

            {hasPdf ? (
              <div className="mt-3">
                <a
                  href={pdfUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline underline-offset-4 opacity-90 hover:opacity-100"
                >
                  Abrir PDF de la lección
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
