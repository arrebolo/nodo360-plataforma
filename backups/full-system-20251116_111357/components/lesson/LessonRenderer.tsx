'use client'

import React, { useMemo } from 'react'
import type { ContentBlock, LessonContent, TableOfContentsItem } from '@/types/lesson-content'
import { VideoPlayer } from './VideoPlayer'
import { LessonCallout } from './LessonCallout'
import { CodeBlock } from './CodeBlock'
import { InteractiveList } from './InteractiveList'
import { QuizBlock } from './QuizBlock'
import { ProgressBar } from './ProgressBar'
import { TableOfContents } from './TableOfContents'
import { CommunityButton } from './CommunityButton'

interface LessonRendererProps {
  content: LessonContent
  progress?: number
}

export function LessonRenderer({ content, progress = 0 }: LessonRendererProps) {
  // Generate table of contents from headings
  const tableOfContents = useMemo<TableOfContentsItem[]>(() => {
    return content.blocks
      .filter((block) => block.type === 'heading')
      .map((block) => {
        const headingBlock = block as any
        return {
          id: block.id,
          text: headingBlock.text,
          level: headingBlock.level,
          anchor: headingBlock.anchor || block.id,
        }
      })
  }, [content.blocks])

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'video':
        return <VideoPlayer key={block.id} block={block} />

      case 'heading': {
        const HeadingTag = `h${block.level}` as any
        const sizeClasses = {
          1: 'text-4xl font-bold',
          2: 'text-3xl font-bold',
          3: 'text-2xl font-semibold',
          4: 'text-xl font-semibold',
          5: 'text-lg font-semibold',
          6: 'text-base font-semibold',
        }

        return (
          <HeadingTag
            key={block.id}
            id={block.anchor || block.id}
            className={`${sizeClasses[block.level]} text-white mt-8 mb-4 scroll-mt-24`}
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
          <figure key={block.id} className="my-6">
            <img
              src={block.url}
              alt={block.alt}
              className="w-full rounded-lg shadow-xl"
              width={block.width}
              height={block.height}
            />
            {block.caption && (
              <figcaption className="text-sm text-gray-500 text-center mt-2">
                {block.caption}
              </figcaption>
            )}
          </figure>
        )

      case 'divider':
        return <hr key={block.id} className="my-8 border-gray-800" />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <ProgressBar progress={progress} estimatedTime={content.estimatedReadingTime} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <main className="min-w-0">
            <article className="prose prose-invert max-w-none">
              {content.blocks.map(renderBlock)}

              {/* Community Button */}
              <div className="not-prose mt-12 mb-8">
                <CommunityButton
                  platform="discord"
                  memberCount="2.3k"
                  isRegistered={true}
                  isPremium={false}
                />
              </div>
            </article>
          </main>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <TableOfContents items={tableOfContents} resources={content.resources} />
          </div>
        </div>
      </div>
    </div>
  )
}
