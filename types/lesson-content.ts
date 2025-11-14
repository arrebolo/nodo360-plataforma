/**
 * Lesson Content Schema
 *
 * Defines the structure for modern, block-based lesson content
 */

export type BlockType =
  | 'video'
  | 'heading'
  | 'paragraph'
  | 'callout'
  | 'list'
  | 'code'
  | 'quiz'
  | 'image'
  | 'divider'

export type CalloutStyle = 'tip' | 'warning' | 'info' | 'success' | 'danger'

export interface BaseBlock {
  id: string
  type: BlockType
}

export interface VideoBlock extends BaseBlock {
  type: 'video'
  url: string
  duration?: number
  thumbnail?: string
  provider?: 'youtube' | 'vimeo' | 'custom'
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
  anchor?: string
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph'
  text: string
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout'
  style: CalloutStyle
  title?: string
  content: string
}

export interface ListBlock extends BaseBlock {
  type: 'list'
  ordered: boolean
  items: string[]
}

export interface CodeBlock extends BaseBlock {
  type: 'code'
  language: string
  code: string
  filename?: string
  showLineNumbers?: boolean
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz'
  question: string
  options: {
    id: string
    text: string
    correct: boolean
  }[]
  explanation?: string
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
}

export type ContentBlock =
  | VideoBlock
  | HeadingBlock
  | ParagraphBlock
  | CalloutBlock
  | ListBlock
  | CodeBlock
  | QuizBlock
  | ImageBlock
  | DividerBlock

export interface LessonContent {
  version: '1.0'
  is_premium?: boolean
  blocks: ContentBlock[]
  estimatedReadingTime?: number
  resources?: {
    id: string
    title: string
    url: string
    type: 'pdf' | 'slides' | 'code' | 'link'
  }[]
}

export interface UserNote {
  id: string
  blockId: string
  content: string
  timestamp: number
  sectionTitle?: string
}

export interface Bookmark {
  id: string
  blockId: string
  title: string
  timestamp: number
}

export interface TableOfContentsItem {
  id: string
  text: string
  level: number
  anchor: string
}
