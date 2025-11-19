'use client'

import { useState, useEffect } from 'react'
import type { Bookmark } from '@/types/lesson-content'

interface BookmarksProps {
  lessonId: string
}

export function Bookmarks({ lessonId }: BookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(`bookmarks-${lessonId}`)
    if (stored) {
      setBookmarks(JSON.parse(stored))
    }
  }, [lessonId])

  const saveBookmarks = (updated: Bookmark[]) => {
    setBookmarks(updated)
    localStorage.setItem(`bookmarks-${lessonId}`, JSON.stringify(updated))
  }

  const removeBookmark = (id: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== id))
  }

  const scrollToBlock = (blockId: string) => {
    const element = document.getElementById(blockId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('highlight-flash')
      setTimeout(() => element.classList.remove('highlight-flash'), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
        Marcadores
      </h3>

      <div className="space-y-2">
        {bookmarks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No tienes marcadores guardados
          </p>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-yellow-500/50 transition-colors group cursor-pointer"
              onClick={() => scrollToBlock(bookmark.blockId)}
            >
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 font-medium line-clamp-2">
                    {bookmark.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(bookmark.timestamp).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeBookmark(bookmark.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes highlight {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(234, 179, 8, 0.2); }
        }
        :global(.highlight-flash) {
          animation: highlight 1s ease-in-out;
        }
      `}</style>
    </div>
  )
}
