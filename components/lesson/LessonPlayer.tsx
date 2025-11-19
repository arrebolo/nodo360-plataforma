'use client'

import React, { useEffect, useState } from 'react'
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
            {lesson.video_duration_minutes > 0 && (
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

      {/* JSON Content (if structured content exists) */}
      {lesson.content_json && (
        <div className="bg-nodo-card border border-nodo-icon rounded-xl p-8">
          <LessonContentRenderer content={lesson.content_json} />
        </div>
      )}

      {/* Attachments */}
      {lesson.attachments && lesson.attachments.length > 0 && (
        <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">📎 Archivos adjuntos</h3>
          <div className="space-y-2">
            {lesson.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-nodo-icon hover:border-[#F7931A] hover:bg-nodo-bg transition-all group"
              >
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-[#F7931A]" />
                <div className="flex-1">
                  <div className="font-medium text-white group-hover:text-[#F7931A]">
                    {attachment.name}
                  </div>
                  {attachment.size && (
                    <div className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </div>
                  )}
                </div>
                <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded uppercase">
                  {attachment.type}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: Render structured JSON content
function LessonContentRenderer({ content }: { content: any }) {
  if (!content || !content.blocks) {
    return null
  }

  return (
    <div className="space-y-6">
      {content.blocks.map((block: any, index: number) => {
        switch (block.type) {
          case 'heading':
            const level = block.level || 2
            return React.createElement(
              `h${level}`,
              { key: index, className: 'text-white font-bold' },
              block.text
            )

          case 'paragraph':
            return (
              <p key={index} className="text-gray-300 leading-relaxed">
                {block.text}
              </p>
            )

          case 'list':
            const ListTag = block.ordered ? 'ol' : 'ul'
            return (
              <ListTag key={index} className="text-gray-300 space-y-2 list-inside">
                {block.items?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ListTag>
            )

          case 'code':
            return (
              <pre key={index} className="bg-[#0f172a] p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-[#F7931A]">{block.code}</code>
              </pre>
            )

          case 'quote':
            return (
              <blockquote
                key={index}
                className="border-l-4 border-[#F7931A] pl-4 italic text-gray-400"
              >
                {block.text}
              </blockquote>
            )

          default:
            return null
        }
      })}
    </div>
  )
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
