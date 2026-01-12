'use client'

import { ExternalLink, FileText, Link2, PlayCircle, Presentation, Download } from 'lucide-react'
import type { Attachment } from '@/types/database'

interface LessonResourcesPanelProps {
  lesson: {
    slides_url?: string | null
    pdf_url?: string | null
    resources_url?: string | null
    video_url?: string | null
    attachments?: Attachment[] | null
  }
}

export function LessonResourcesPanel({ lesson }: LessonResourcesPanelProps) {
  const attachmentList = Array.isArray(lesson.attachments) ? lesson.attachments : []

  const quickLinks = [
    lesson.slides_url && { label: 'Presentación', url: lesson.slides_url, icon: Presentation, description: 'Diapositivas de la lección' },
    lesson.pdf_url && { label: 'PDF', url: lesson.pdf_url, icon: FileText, description: 'Material en formato PDF' },
    lesson.resources_url && { label: 'Recursos externos', url: lesson.resources_url, icon: Link2, description: 'Enlaces y materiales extra' },
    lesson.video_url && { label: 'Video', url: lesson.video_url, icon: PlayCircle, description: 'Ver video en nueva pestaña' },
  ].filter(Boolean) as Array<{ label: string; url: string; icon: typeof ExternalLink; description: string }>

  const renderAttachmentIcon = (type?: Attachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'doc':
        return <FileText className="w-4 h-4" />
      case 'link':
        return <Link2 className="w-4 h-4" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  if (quickLinks.length === 0 && attachmentList.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Recursos</h3>
        <p className="text-white/50 text-sm">
          Esta lección no tiene recursos adicionales disponibles.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recursos de la lección</h3>

      {/* Quick Links */}
      {quickLinks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          {quickLinks.map((link) => {
            const Icon = link.icon

            return (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-light/30 rounded-lg transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-light/20 flex items-center justify-center group-hover:bg-brand-light/30 transition">
                  <Icon className="w-5 h-5 text-brand-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{link.label}</div>
                  <div className="text-xs text-white/50 truncate">{link.description}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition flex-shrink-0" />
              </a>
            )
          })}
        </div>
      )}

      {/* Attachments */}
      {attachmentList.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase text-white/50 tracking-wide font-semibold">
            Archivos adjuntos ({attachmentList.length})
          </p>
          <div className="space-y-2">
            {attachmentList.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-brand-light/40 hover:bg-white/10 transition group"
              >
                <span className="w-9 h-9 rounded-md bg-white/10 text-white flex items-center justify-center group-hover:bg-white/15 transition">
                  {renderAttachmentIcon(attachment.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{attachment.name}</p>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="capitalize">{attachment.type || 'Archivo'}</span>
                    {attachment.size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(attachment.size)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Download className="w-4 h-4 text-white/30 group-hover:text-white/60 transition flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}


