'use client'

import { useEffect, useMemo, useState } from 'react'
import { cx } from '@/lib/design/tokens'
import { FileText, Download, StickyNote, ExternalLink, BookOpen, ArrowRight } from 'lucide-react'
import { LessonNotes } from './LessonNotes'
import { LessonCallout } from './LessonCallout'
import { CodeBlock } from './CodeBlock'
import { InteractiveList } from './InteractiveList'
import { QuizBlock } from './QuizBlock'
import type { LessonContent as LessonContentType, ContentBlock } from '@/types/lesson-content'

type LessonLike = {
  id: string
  title?: string | null
  description?: string | null
  slides_url?: string | null
  slides_type?: 'google_slides' | 'canva' | 'pdf' | 'other' | null
  pdf_url?: string | null
  resources_url?: string | null
  content?: string | null  // HTML content from TipTap editor
  content_json?: LessonContentType | null  // Block-based content (legacy)
}

export type TabKey = 'content' | 'resources' | 'notes'

type Props = {
  lesson: LessonLike
  userId: string | null
  courseSlug: string
  onTabChange?: (tab: TabKey) => void
  requestedTab?: TabKey | null
}

// Render a single content block
function renderBlock(block: ContentBlock) {
  switch (block.type) {
    case 'heading': {
      const sizeClasses: Record<number, string> = {
        1: 'text-3xl font-bold',
        2: 'text-2xl font-bold',
        3: 'text-xl font-semibold',
        4: 'text-lg font-semibold',
        5: 'text-base font-semibold',
        6: 'text-sm font-semibold',
      }
      const className = `${sizeClasses[block.level] || sizeClasses[3]} text-white mt-6 mb-3 scroll-mt-24`
      const props = { key: block.id, id: block.anchor || block.id, className }

      // Render heading by level
      switch (block.level) {
        case 1: return <h1 {...props}>{block.text}</h1>
        case 2: return <h2 {...props}>{block.text}</h2>
        case 3: return <h3 {...props}>{block.text}</h3>
        case 4: return <h4 {...props}>{block.text}</h4>
        case 5: return <h5 {...props}>{block.text}</h5>
        case 6: return <h6 {...props}>{block.text}</h6>
        default: return <h3 {...props}>{block.text}</h3>
      }
    }

    case 'paragraph':
      return (
        <p key={block.id} className="text-white/80 leading-relaxed mb-4">
          {block.text}
        </p>
      )

    case 'callout':
      return <LessonCallout key={block.id} block={block} />

    case 'list':
      return <InteractiveList key={block.id} block={block} />

    case 'code':
      return <CodeBlock key={block.id} block={block} />

    case 'quiz':
      return <QuizBlock key={block.id} block={block} />

    case 'image':
      return (
        <figure key={block.id} className="my-6">
          <img
            src={block.url}
            alt={block.alt}
            className="w-full rounded-lg shadow-xl"
            width={block.width}
            height={block.height}
          />
          {block.caption && (
            <figcaption className="text-sm text-white/50 text-center mt-2">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )

    case 'divider':
      return <hr key={block.id} className="my-8 border-white/10" />

    default:
      return null
  }
}

export function LessonContent({ lesson, userId, courseSlug, onTabChange, requestedTab }: Props) {
  // Detectar si hay recursos
  const hasResources = useMemo(() => {
    return !!lesson.slides_url || !!lesson.pdf_url || !!lesson.resources_url
  }, [lesson.slides_url, lesson.pdf_url, lesson.resources_url])

  // Detectar si hay contenido HTML (del editor TipTap)
  const hasHtmlContent = useMemo(() => {
    return !!lesson.content && lesson.content.trim().length > 0
  }, [lesson.content])

  // Detectar si hay contenido estructurado (bloques JSON - legacy)
  const hasContentJson = useMemo(() => {
    return lesson.content_json && lesson.content_json.blocks && lesson.content_json.blocks.length > 0
  }, [lesson.content_json])

  // Detectar si hay cualquier tipo de contenido principal
  const hasContent = hasHtmlContent || hasContentJson

  // Construir tabs dinamicamente
  const tabs = useMemo(() => {
    const base: Array<{ key: TabKey; label: string; icon: typeof FileText }> = []

    // Contenido siempre primero (incluye descripcion como intro)
    base.push({ key: 'content', label: 'Contenido', icon: BookOpen })

    if (hasResources) {
      base.push({ key: 'resources', label: 'Recursos', icon: Download })
    }
    base.push({ key: 'notes', label: 'Mis notas', icon: StickyNote })
    return base
  }, [hasResources])

  // Tab inicial: siempre contenido
  const [activeTab, setActiveTabState] = useState<TabKey>('content')

  // Wrapper para notificar cambios de tab
  const setActiveTab = (tab: TabKey) => {
    setActiveTabState(tab)
    onTabChange?.(tab)
  }

  // Notificar tab inicial
  useEffect(() => {
    onTabChange?.('content')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Robustez: si cambias de leccion y ya no existe el tab activo, elegir el correcto
  useEffect(() => {
    if (activeTab === 'resources' && !hasResources) {
      setActiveTab('content')
    }
  }, [lesson.id, hasResources, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar de leccion, resetear al tab contenido
  useEffect(() => {
    setActiveTab('content')
  }, [lesson.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Responder a cambios de tab solicitados desde el exterior
  useEffect(() => {
    if (requestedTab && requestedTab !== activeTab) {
      setActiveTab(requestedTab)
    }
  }, [requestedTab]) // eslint-disable-line react-hooks/exhaustive-deps

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
        {/* CONTENIDO PRINCIPAL (incluye descripcion como intro) */}
        {activeTab === 'content' && (
          <article className="lesson-prose prose prose-sm prose-invert max-w-none">
            {/* Descripcion como parrafo introductorio */}
            {lesson.description && (
              <p className="text-white/70 leading-relaxed mb-6 pb-6 border-b border-white/10">
                {lesson.description}
              </p>
            )}

            {/* Contenido HTML del editor TipTap */}
            {hasHtmlContent && lesson.content && (
              <div
                className="tiptap-content"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            )}

            {/* Contenido bloques JSON (legacy/fallback) */}
            {!hasHtmlContent && hasContentJson && lesson.content_json && (
              <>
                {lesson.content_json.blocks.map(renderBlock)}
              </>
            )}

            {/* Mensaje cuando no hay contenido adicional */}
            {!hasContent && !lesson.description && (
              <div className="text-center py-8">
                <BookOpen className="h-8 w-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">Esta leccion no tiene contenido adicional.</p>
                <p className="text-sm text-white/30 mt-1">
                  Revisa el video o toma notas mientras estudias.
                </p>
              </div>
            )}
          </article>
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


