'use client'

import { useEffect, useState } from 'react'
import type { TableOfContentsItem } from '@/types/lesson-content'

interface TableOfContentsProps {
  items: TableOfContentsItem[]
  resources?: {
    id: string
    title: string
    url: string
    type: 'pdf' | 'slides' | 'code' | 'link'
  }[]
}

const resourceIcons = {
  pdf: '📄',
  slides: '📊',
  code: '💻',
  link: '🔗',
}

export function TableOfContents({ items, resources }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -80% 0px' }
    )

    items.forEach((item) => {
      const element = document.getElementById(item.anchor)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [items])

  const toggleCompleted = (id: string) => {
    setCompleted((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const scrollToSection = (anchor: string) => {
    const element = document.getElementById(anchor)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <aside className="sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="space-y-6">
        {/* Table of Contents */}
        <div className="bg-dark-secondary/50 rounded-lg p-4 border border-dark-border">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            En esta lección
          </h3>
          <nav className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.anchor)}
                className={`w-full text-left py-2 px-3 rounded text-sm transition-colors flex items-center gap-2 group ${
                  activeId === item.anchor
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-white/60 hover:text-white/80 hover:bg-dark-tertiary/50'
                }`}
                style={{ paddingLeft: `${item.level * 0.75}rem` }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCompleted(item.id)
                  }}
                  className="flex-shrink-0 w-4 h-4 rounded border-2 border-dark-border group-hover:border-orange-500 transition-colors flex items-center justify-center"
                >
                  {completed[item.id] && (
                    <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <span className={completed[item.id] ? 'line-through' : ''}>{item.text}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Resources */}
        {resources && resources.length > 0 && (
          <div className="bg-dark-secondary/50 rounded-lg p-4 border border-dark-border">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recursos
            </h3>
            <div className="space-y-2">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded hover:bg-dark-tertiary/50 transition-colors text-sm text-white/80 hover:text-white"
                >
                  <span className="text-lg">{resourceIcons[resource.type]}</span>
                  <span className="flex-1">{resource.title}</span>
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}


