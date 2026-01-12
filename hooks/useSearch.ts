import { useState, useEffect, useCallback, useRef } from 'react'
import type { Course, Lesson } from '@/types/database'

export interface SearchResults {
  courses: Course[]
  lessons: Lesson[]
  isLoading: boolean
  error: string | null
}

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  searchMode?: 'client' | 'server'
}

export function useSearch(
  allCourses: Course[] = [],
  allLessons: Lesson[] = [],
  options: UseSearchOptions = {}
) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    searchMode = 'client'
  } = options

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({
    courses: [],
    lessons: [],
    isLoading: false,
    error: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Client-side search
  const searchClient = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setResults({
        courses: [],
        lessons: [],
        isLoading: false,
        error: null
      })
      return
    }

    const lowerQuery = searchQuery.toLowerCase()

    const filteredCourses = allCourses.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.description?.toLowerCase().includes(lowerQuery) ||
      course.slug.toLowerCase().includes(lowerQuery)
    ).slice(0, 5)

    const filteredLessons = allLessons.filter(lesson =>
      lesson.title.toLowerCase().includes(lowerQuery) ||
      lesson.description?.toLowerCase().includes(lowerQuery)
    ).slice(0, 5)

    setResults({
      courses: filteredCourses,
      lessons: filteredLessons,
      isLoading: false,
      error: null
    })
  }, [allCourses, allLessons, minQueryLength])

  // Server-side search
  const searchServer = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setResults({
        courses: [],
        lessons: [],
        isLoading: false,
        error: null
      })
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    setResults(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        throw new Error('Error en la búsqueda')
      }

      const data = await response.json()

      setResults({
        courses: data.courses || [],
        lessons: data.lessons || [],
        isLoading: false,
        error: null
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }

      console.error('Search error:', error)
      setResults({
        courses: [],
        lessons: [],
        isLoading: false,
        error: 'Error al buscar. Intenta de nuevo.'
      })
    }
  }, [minQueryLength])

  // Execute search when debounced query changes
  useEffect(() => {
    if (searchMode === 'client') {
      searchClient(debouncedQuery)
    } else {
      searchServer(debouncedQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, searchMode])

  // Clear results
  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setResults({
      courses: [],
      lessons: [],
      isLoading: false,
      error: null
    })
  }, [])

  return {
    query,
    setQuery,
    results,
    clearSearch,
    hasResults: results.courses.length > 0 || results.lessons.length > 0
  }
}


