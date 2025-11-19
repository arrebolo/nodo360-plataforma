'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface LessonNavigationProps {
  previousLesson?: {
    slug: string
    title: string
  } | null
  nextLesson?: {
    slug: string
    title: string
  } | null
  courseSlug: string
  className?: string
}

export default function LessonNavigation({
  previousLesson,
  nextLesson,
  courseSlug,
  className = '',
}: LessonNavigationProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Previous Lesson Button */}
      {previousLesson ? (
        <Link
          href={`/cursos/${courseSlug}/${previousLesson.slug}`}
          className="flex-1 group"
        >
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ff6b35]/50 rounded-xl p-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ff6b35]/20 transition-colors">
                <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-[#ff6b35]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 mb-1">Lección anterior</p>
                <p className="text-sm text-white font-medium truncate group-hover:text-[#ff6b35] transition-colors">
                  {previousLesson.title}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {/* Next Lesson Button */}
      {nextLesson ? (
        <Link
          href={`/cursos/${courseSlug}/${nextLesson.slug}`}
          className="flex-1 group"
        >
          <div className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:shadow-lg hover:shadow-[#ff6b35]/20 rounded-xl p-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs text-white/80 mb-1">Siguiente lección</p>
                <p className="text-sm text-white font-medium truncate">
                  {nextLesson.title}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
