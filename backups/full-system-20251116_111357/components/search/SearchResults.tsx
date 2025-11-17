'use client'

import Link from 'next/link'
import { BookOpen, FileText, Loader2, AlertCircle } from 'lucide-react'
import type { Course, Lesson } from '@/types/database'
import { truncateText, POPULAR_SEARCHES } from '@/lib/search-utils'

interface SearchResultsProps {
  courses: Course[]
  lessons: Lesson[]
  isLoading: boolean
  error: string | null
  query: string
  onResultClick: (type: 'course' | 'lesson', id: string) => void
  onClose: () => void
}

export function SearchResults({
  courses,
  lessons,
  isLoading,
  error,
  query,
  onResultClick,
  onClose
}: SearchResultsProps) {
  const hasResults = courses.length > 0 || lessons.length > 0
  const isEmpty = !query.trim()

  return (
    <div className="absolute top-full mt-2 w-full md:w-96 max-h-[32rem] overflow-y-auto bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl backdrop-blur-sm z-50">
      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-[#ff6b35] mx-auto animate-spin mb-2" />
          <p className="text-sm text-white/60">Buscando...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-8 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Empty Query - Show Popular Searches */}
      {isEmpty && !isLoading && !error && (
        <div className="p-4">
          <p className="text-xs text-white/50 px-3 py-2 uppercase tracking-wider">
            Búsquedas Populares
          </p>
          <div className="flex flex-wrap gap-2 px-3">
            {POPULAR_SEARCHES.map((searchTerm) => (
              <button
                key={searchTerm}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 hover:text-white transition-colors"
                onClick={() => {
                  // This will be handled by parent component
                  onClose()
                }}
              >
                {searchTerm}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isEmpty && !hasResults && !isLoading && !error && (
        <div className="p-8 text-center">
          <AlertCircle className="w-6 h-6 text-white/40 mx-auto mb-2" />
          <p className="text-sm text-white/60 mb-1">
            No encontramos cursos para &quot;{query}&quot;
          </p>
          <p className="text-xs text-white/40">
            Prueba con otros términos de búsqueda
          </p>
        </div>
      )}

      {/* Results */}
      {hasResults && !isLoading && (
        <>
          {/* Courses Section */}
          {courses.length > 0 && (
            <div className="p-2 border-b border-white/10">
              <p className="text-xs text-white/50 px-3 py-2 uppercase tracking-wider">
                Cursos ({courses.length})
              </p>
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/cursos/${course.slug}`}
                  onClick={() => {
                    onResultClick('course', course.id)
                    onClose()
                  }}
                  className="block p-3 hover:bg-white/5 rounded-lg transition-colors group"
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 rounded-lg flex items-center justify-center group-hover:from-[#ff6b35]/30 group-hover:to-[#f7931a]/30 transition-all">
                      <BookOpen className="w-6 h-6 text-[#ff6b35]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white group-hover:text-[#ff6b35] transition-colors truncate">
                        {course.title}
                      </p>
                      {course.description && (
                        <p className="text-sm text-white/60 line-clamp-2 mt-0.5">
                          {truncateText(course.description, 80)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {course.is_premium ? (
                          <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 text-[#FFD700] rounded-full">
                            Premium
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-[#ff6b35]/20 to-[#f7931a]/20 text-[#ff6b35] rounded-full">
                            Gratis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Lessons Section */}
          {lessons.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-white/50 px-3 py-2 uppercase tracking-wider">
                Lecciones ({lessons.length})
              </p>
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lecciones/${lesson.slug}`}
                  onClick={() => {
                    onResultClick('lesson', lesson.id)
                    onClose()
                  }}
                  className="block p-3 hover:bg-white/5 rounded-lg transition-colors group"
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#3b82f6]/20 to-[#9333ea]/20 rounded-lg flex items-center justify-center group-hover:from-[#3b82f6]/30 group-hover:to-[#9333ea]/30 transition-all">
                      <FileText className="w-5 h-5 text-[#3b82f6]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm group-hover:text-[#3b82f6] transition-colors truncate">
                        {lesson.title}
                      </p>
                      {lesson.description && (
                        <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
                          {truncateText(lesson.description, 60)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* View All Link */}
          {(courses.length >= 5 || lessons.length >= 5) && (
            <div className="p-3 border-t border-white/10">
              <Link
                href={`/buscar?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="block text-center text-sm text-[#ff6b35] hover:text-[#f7931a] font-semibold transition-colors"
              >
                Ver todos los resultados →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
