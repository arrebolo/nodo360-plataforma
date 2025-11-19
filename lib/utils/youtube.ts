/**
 * Extrae el ID de video de una URL de YouTube
 * Soporta múltiples formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null

  // Patrón para diferentes formatos de URLs de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // ID directo
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Genera URL de embed de YouTube a partir de una URL o ID
 */
export function getYouTubeEmbedUrl(urlOrId: string, autoplay: boolean = false): string | null {
  const videoId = extractYouTubeId(urlOrId)
  if (!videoId) return null

  const params = new URLSearchParams()
  if (autoplay) params.set('autoplay', '1')
  params.set('rel', '0') // No mostrar videos relacionados
  params.set('modestbranding', '1') // Minimizar branding de YouTube

  const queryString = params.toString()
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`
}

/**
 * Genera URL de thumbnail de YouTube
 */
export function getYouTubeThumbnail(urlOrId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string | null {
  const videoId = extractYouTubeId(urlOrId)
  if (!videoId) return null

  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}
