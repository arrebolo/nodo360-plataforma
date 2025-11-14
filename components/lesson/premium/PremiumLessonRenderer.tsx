'use client'

import { useState, useEffect } from 'react'
import type { LessonContent, ContentBlock, TableOfContentsItem } from '@/types/lesson-content'
import { VideoPlayer } from '../VideoPlayer'
import { LessonCallout } from '../LessonCallout'
import { CodeBlock } from '../CodeBlock'
import { InteractiveList } from '../InteractiveList'
import { QuizBlock } from '../QuizBlock'
import { ProgressBar } from '../ProgressBar'
import { CommunityButton } from '../CommunityButton'
import { UserNotes } from './UserNotes'
import { Bookmarks } from './Bookmarks'
import { CertificateProgress } from './CertificateProgress'
import { DiscussionSection } from './DiscussionSection'
import { AdvancedResources } from './AdvancedResources'

interface PremiumLessonRendererProps {
  content: LessonContent
  lessonId: string
  lessonTitle: string
  courseTitle?: string
  completedLessons?: number
  totalLessons?: number
  initialProgress?: number
}

type SidebarTab = 'toc' | 'notes' | 'bookmarks' | 'progress' | 'discussion' | 'resources' | 'community'

export function PremiumLessonRenderer({
  content,
  lessonId,
  lessonTitle,
  courseTitle = 'Curso Blockchain',
  completedLessons = 12,
  totalLessons = 24,
  initialProgress = 0,
}: PremiumLessonRendererProps) {
  const [progress, setProgress] = useState(initialProgress)
  const [activeTab, setActiveTab] = useState<SidebarTab>('toc')
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([])

  // Generate table of contents from headings
  useEffect(() => {
    const toc: TableOfContentsItem[] = []
    content.blocks.forEach((block) => {
      if (block.type === 'heading' && block.level <= 3) {
        toc.push({
          id: block.id,
          text: block.text,
          level: block.level,
          anchor: block.anchor || block.id,
        })
      }
    })
    setTableOfContents(toc)
  }, [content])

  // Simulate progress updates
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100
      setProgress(Math.min(Math.round(scrollPercentage), 100))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'video':
        return <VideoPlayer key={block.id} block={block} />

      case 'heading': {
        const HeadingTag = `h${block.level}` as any
        const headingStyles = {
          1: 'text-4xl font-bold text-white mb-6 mt-8',
          2: 'text-3xl font-bold text-white mb-4 mt-8',
          3: 'text-2xl font-semibold text-white mb-3 mt-6',
          4: 'text-xl font-semibold text-white mb-2 mt-4',
          5: 'text-lg font-semibold text-white mb-2 mt-4',
          6: 'text-base font-semibold text-white mb-2 mt-4',
        }
        return (
          <HeadingTag
            key={block.id}
            id={block.anchor || block.id}
            className={headingStyles[block.level]}
          >
            {block.text}
          </HeadingTag>
        )
      }

      case 'paragraph':
        return (
          <p key={block.id} className="text-gray-300 leading-relaxed mb-4">
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
          <div key={block.id} className="my-6">
            <img
              src={block.url}
              alt={block.alt}
              className="w-full rounded-lg"
              width={block.width}
              height={block.height}
            />
            {block.caption && (
              <p className="text-sm text-gray-400 text-center mt-2">{block.caption}</p>
            )}
          </div>
        )

      case 'divider':
        return <hr key={block.id} className="border-gray-700 my-8" />

      default:
        return null
    }
  }

  const tabs = [
    { id: 'toc', label: 'Índice', icon: '📋' },
    { id: 'notes', label: 'Notas', icon: '📝' },
    { id: 'bookmarks', label: 'Marcadores', icon: '🔖' },
    { id: 'progress', label: 'Progreso', icon: '🎓' },
    { id: 'discussion', label: 'Discusión', icon: '💬' },
    { id: 'resources', label: 'Recursos', icon: '📦' },
    { id: 'community', label: 'Comunidad', icon: '👥' },
  ]

  const scrollToHeading = (anchor: string) => {
    const element = document.getElementById(anchor)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Progress Bar */}
      <ProgressBar
        progress={progress}
        estimatedTime={content.estimatedReadingTime}
      />

      {/* Premium Badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-full">
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium text-yellow-400">Lección Premium</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              {content.blocks.map((block) => renderBlock(block))}
            </div>
          </main>

          {/* Sidebar with Tabs */}
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Tab Navigation */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-2">
                <div className="grid grid-cols-2 gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SidebarTab)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="block mb-0.5">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {activeTab === 'toc' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      Tabla de Contenido
                    </h3>
                    <nav className="space-y-1">
                      {tableOfContents.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToHeading(item.anchor)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-yellow-400 hover:bg-gray-700/50 rounded-lg transition-colors"
                          style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                        >
                          {item.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}

                {activeTab === 'notes' && <UserNotes lessonId={lessonId} />}

                {activeTab === 'bookmarks' && <Bookmarks lessonId={lessonId} />}

                {activeTab === 'progress' && (
                  <CertificateProgress
                    completedLessons={completedLessons}
                    totalLessons={totalLessons}
                    courseTitle={courseTitle}
                  />
                )}

                {activeTab === 'discussion' && <DiscussionSection lessonId={lessonId} />}

                {/* {activeTab === 'resources' && <AdvancedResources resources={content.resources} />} */}

                {activeTab === 'community' && (
                  <CommunityButton
                    platform="discord"
                    memberCount="2.3k"
                    isRegistered={true}
                    isPremium={true}
                    isCompact={true}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
