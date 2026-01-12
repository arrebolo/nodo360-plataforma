'use client'

import { useEffect, useMemo, useState } from 'react'
import { cx } from '@/lib/design/tokens'
import { FileText, Download, StickyNote, ExternalLink } from 'lucide-react'
import { LessonNotes } from './LessonNotes'

type LessonLike = {
  id: string
  title?: string | null
  description?: string | null
  slides_url?: string | null
  slides_type?: 'google_slides' | 'canva' | 'pdf' | 'other' | null
  pdf_url?: string | null
  resources_url?: string | null
}

type Props = {
  lesson: LessonLike
  userId: string | null
  courseSlug: string
}

type TabKey = 'description' | 'resources' | 'notes'

export function LessonContent({ lesson, userId, courseSlug }: Props) {
  // Detectar si hay recursos
  const hasResources = useMemo(() => {
    return !!lesson.slides_url || !!lesson.pdf_url || !!lesson.resources_url
  }, [lesson.slides_url, lesson.pdf_url, lesson.resources_url])

  // Construir tabs dinamicamente
  const tabs = useMemo(() => {
    const base: Array<{ key: TabKey; label: string; icon: typeof FileText }> = [
      { key: 'description', label: 'Descripcion', icon: FileText },
    ]
    if (hasResources) {
      base.push({ key: 'resources', label: 'Recursos', icon: Download })
    }
    base.push({ key: 'notes', label: 'Mis notas', icon: StickyNote })
    return base
  }, [hasResources])

  const [activeTab, setActiveTab] = useState<TabKey>('description')

  // Robustez: si cambias de leccion y ya no existe el tab "resources", vuelve a description
  useEffect(() => {
    if (activeTab === 'resources' && !hasResources) {
      setActiveTab('description')
    }
  }, [lesson.id, hasResources, activeTab])

  return (
    <div id="lesson-content" className="bg-dark-secondary border border-dark-border rounded-2xl overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-dark-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cx(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                isActive
                  ? "text-brand border-b-2 border-brand bg-brand/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-5">
        {/* DESCRIPCION */}
        {activeTab === 'description' && (
          <div className="prose prose-sm prose-invert max-w-none">
            {lesson.description ? (
              <p className="whitespace-pre-wrap leading-relaxed text-white/80">{lesson.description}</p>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">Esta leccion no tiene descripcion adicional.</p>
                <p className="text-sm text-white/30 mt-1">
                  Revisa el contenido o toma notas mientras estudias.
                </p>
              </div>
            )}
          </div>
        )}

        {/* RECURSOS */}
        {activeTab === 'resources' && hasResources && (
          <div className="space-y-3">
            {lesson.slides_url && (
              <a
                href={lesson.slides_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-dark-border bg-dark-tertiary hover:bg-white/10 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Slides</p>
                  <p className="text-xs text-white/50 truncate">{lesson.slides_url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </a>
            )}

            {lesson.pdf_url && (
              <a
                href={lesson.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-dark-border bg-dark-tertiary hover:bg-white/10 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Download className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">PDF</p>
                  <p className="text-xs text-white/50 truncate">{lesson.pdf_url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </a>
            )}

            {lesson.resources_url && (
              <a
                href={lesson.resources_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-dark-border bg-dark-tertiary hover:bg-white/10 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Download className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Recursos externos</p>
                  <p className="text-xs text-white/50 truncate">{lesson.resources_url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </a>
            )}
          </div>
        )}

        {/* NOTAS */}
        {activeTab === 'notes' && (
          <LessonNotes lessonId={lesson.id} userId={userId} />
        )}
      </div>
    </div>
  )
}

export default LessonContent


