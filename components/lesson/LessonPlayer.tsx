'use client'

import { useEffect, useState } from 'react'
import { FileText, Video } from 'lucide-react'
import type { Lesson } from '@/types/database'
import { markLessonStarted } from '@/lib/utils/progress'

interface LessonPlayerProps {
  lesson: Lesson
  courseId: string
  onStart?: () => void
  onComplete?: () => void
}

export function LessonPlayer({
  lesson,
  courseId,
  onStart,
  onComplete,
}: LessonPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    // Marcar lección como iniciada cuando se monta el componente
    if (!hasStarted) {
      setHasStarted(true)
      markLessonStarted(lesson.id, courseId)
      onStart?.()
    }
  }, [lesson.id, courseId, hasStarted, onStart])

  const hasVideo = lesson.video_url && lesson.video_url.length > 0

  return (
    <div className="space-y-6">
      {/* Video Player (for premium courses with video) */}
      {hasVideo && lesson.video_url && (
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
          <iframe
            src={lesson.video_url}
            title={lesson.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="eager"
          />
        </div>
      )}

      {/* Content Header */}
      <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#F7931A]/10 flex items-center justify-center flex-shrink-0">
            {hasVideo ? (
              <Video className="w-6 h-6 text-[#F7931A]" />
            ) : (
              <FileText className="w-6 h-6 text-[#F7931A]" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-gray-400 leading-relaxed">{lesson.description}</p>
            )}
            {lesson.video_duration_minutes && lesson.video_duration_minutes > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Video className="w-4 h-4" />
                <span>{lesson.video_duration_minutes} minutos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Content (for free courses or additional content) */}
      {lesson.content && (
        <div className="bg-nodo-card border border-nodo-icon rounded-xl p-8">
          <div
            className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-[#F7931A] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-[#F7931A] prose-code:bg-[#0f172a] prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>
      )}

      {/* Recursos adicionales: slides y resources URLs */}
      {(lesson.slides_url || lesson.resources_url) && (
        <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">📎 Recursos</h3>
          <div className="space-y-2">
            {lesson.slides_url && (
              <a
                href={lesson.slides_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-nodo-icon hover:border-[#F7931A] hover:bg-nodo-bg transition-all group"
              >
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-[#F7931A]" />
                <span className="font-medium text-white group-hover:text-[#F7931A]">
                  📊 Ver Slides
                </span>
              </a>
            )}
            {lesson.resources_url && (
              <a
                href={lesson.resources_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-nodo-icon hover:border-[#F7931A] hover:bg-nodo-bg transition-all group"
              >
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-[#F7931A]" />
                <span className="font-medium text-white group-hover:text-[#F7931A]">
                  📚 Descargar Guía
                </span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
