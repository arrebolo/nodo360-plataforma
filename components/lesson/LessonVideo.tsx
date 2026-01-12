'use client'

import { VideoPlayer } from '@/components/lesson/VideoPlayer'
import type { LessonVideoProps } from '@/types/lesson-player'

/**
 * LessonVideo - Wrapper component for video display in lessons
 * Uses VideoPlayer internally for YouTube/Vimeo/HTML5 support
 */
export function LessonVideo({ videoUrl, title, thumbnailUrl }: LessonVideoProps) {
  return (
    <VideoPlayer
      videoUrl={videoUrl}
      thumbnailUrl={thumbnailUrl}
      title={title}
    />
  )
}

export default LessonVideo


