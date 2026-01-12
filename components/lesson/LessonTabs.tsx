'use client'

import * as React from 'react'
import { Card } from '@/components/ui/Card'
import { cx } from '@/lib/design/tokens'
import { FileText, Download, StickyNote } from 'lucide-react'

type Tab = 'descripcion' | 'recursos' | 'notas'

type Resource = {
  id: string
  title: string
  url: string
  type?: string
}

type LessonTabsProps = {
  description?: string | null
  resources?: Resource[]
  notesCount?: number
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  children?: React.ReactNode // Para contenido de notas
}

export function LessonTabs({
  description,
  resources = [],
  notesCount = 0,
  activeTab,
  onTabChange,
  children,
}: LessonTabsProps) {
  const tabs = [
    { id: 'descripcion' as Tab, label: 'Descripcion', icon: FileText },
    { id: 'recursos' as Tab, label: `Recursos (${resources.length})`, icon: Download },
    { id: 'notas' as Tab, label: `Notas${notesCount > 0 ? ` (${notesCount})` : ''}`, icon: StickyNote },
  ]

  return (
    <Card className="overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-black/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cx(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === tab.id
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-5">
        {activeTab === 'descripcion' && (
          <div className="prose prose-sm max-w-none text-neutral-700">
            {description ? (
              <p className="whitespace-pre-wrap">{description}</p>
            ) : (
              <p className="text-neutral-400">Sin descripcion disponible.</p>
            )}
          </div>
        )}

        {activeTab === 'recursos' && (
          <div className="space-y-2">
            {resources.length === 0 ? (
              <p className="text-neutral-400 text-sm">No hay recursos para esta leccion.</p>
            ) : (
              resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <Download className="h-5 w-5 text-neutral-400" />
                  <span className="text-sm text-neutral-900">{resource.title}</span>
                </a>
              ))
            )}
          </div>
        )}

        {activeTab === 'notas' && <div>{children}</div>}
      </div>
    </Card>
  )
}


