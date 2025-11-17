'use client'

import { useRef, useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { Course, Lesson } from '@/types/database'
import { useSearch } from '@/hooks/useSearch'
import { SearchResults } from './SearchResults'
import { saveToSearchHistory, logSearch } from '@/lib/search-utils'

interface SearchBarProps {
  courses?: Course[]
  lessons?: Lesson[]
  className?: string
  variant?: 'navbar' | 'hero'
}

export function SearchBar({
  courses = [],
  lessons = [],
  className = '',
  variant = 'navbar'
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const { query, setQuery, results, clearSearch, hasResults } = useSearch(
    courses,
    lessons,
    { searchMode: 'client' }
  )

  // Handle click outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }

      // Close on Escape
      if (e.key === 'Escape') {
        setShowResults(false)
        setIsFocused(false)
        inputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Show results when there's a query or when focused
  useEffect(() => {
    if (isFocused && (query || hasResults)) {
      setShowResults(true)
    }
  }, [isFocused, query, hasResults])

  const handleFocus = () => {
    setIsFocused(true)
    setShowResults(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleClear = () => {
    clearSearch()
    inputRef.current?.focus()
  }

  const handleResultClick = (type: 'course' | 'lesson', id: string) => {
    // Save to search history
    if (query) {
      saveToSearchHistory(query)
    }

    // Log analytics
    const resultsCount = results.courses.length + results.lessons.length
    logSearch(query, resultsCount, `${type}:${id}`)

    // Close results
    setShowResults(false)
    setIsFocused(false)
  }

  const handleClose = () => {
    setShowResults(false)
    setIsFocused(false)
  }

  const isHero = variant === 'hero'

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Search Input */}
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-white/50 ${
            isHero ? 'w-5 h-5' : 'w-4 h-4'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={`Buscar cursos, lecciones... ${!isHero ? '⌘K' : ''}`}
          className={`
            ${isHero
              ? 'w-full pl-12 pr-12 py-4 text-base'
              : 'w-64 pl-10 pr-10 py-2 text-sm focus:w-80'
            }
            bg-white/5 border border-white/10 rounded-xl
            focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]/50
            text-white placeholder:text-white/50
            transition-all duration-300
            backdrop-blur-sm
          `}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className={isHero ? 'w-5 h-5' : 'w-4 h-4'} />
          </button>
        )}

        {/* Keyboard Shortcut Hint (only for navbar) */}
        {!isHero && !isFocused && !query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/30 text-xs pointer-events-none">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10">K</kbd>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <SearchResults
          courses={results.courses}
          lessons={results.lessons}
          isLoading={results.isLoading}
          error={results.error}
          query={query}
          onResultClick={handleResultClick}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
