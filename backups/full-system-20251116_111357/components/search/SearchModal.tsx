'use client'

import { useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'
import type { Course, Lesson } from '@/types/database'
import { useSearch } from '@/hooks/useSearch'
import { SearchResults } from './SearchResults'
import { saveToSearchHistory, logSearch } from '@/lib/search-utils'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  courses?: Course[]
  lessons?: Lesson[]
}

export function SearchModal({
  isOpen,
  onClose,
  courses = [],
  lessons = []
}: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, results, clearSearch } = useSearch(
    courses,
    lessons,
    { searchMode: 'client' }
  )

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      clearSearch()
    }
  }, [isOpen, clearSearch])

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleResultClick = (type: 'course' | 'lesson', id: string) => {
    // Save to search history
    if (query) {
      saveToSearchHistory(query)
    }

    // Log analytics
    const resultsCount = results.courses.length + results.lessons.length
    logSearch(query, resultsCount, `${type}:${id}`)

    // Close modal
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative h-full flex flex-col bg-[#1a1f2e]">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cursos, lecciones..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                          focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]/50
                          text-white placeholder:text-white/50 text-base"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Cerrar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            <SearchResults
              courses={results.courses}
              lessons={results.lessons}
              isLoading={results.isLoading}
              error={results.error}
              query={query}
              onResultClick={handleResultClick}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
