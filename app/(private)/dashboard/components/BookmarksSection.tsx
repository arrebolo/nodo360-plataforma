'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Bookmark {
  id: string
  lesson: {
    title: string
    slug: string
    module: {
      course: {
        title: string
        slug: string
      }
    }
  }
  note?: string
}

interface BookmarksSectionProps {
  bookmarks: Bookmark[]
}

export default function BookmarksSection({ bookmarks }: BookmarksSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
    >
      <h3 className="text-xl font-bold mb-4">🔖 Enlaces Guardados ({bookmarks.length})</h3>

      {bookmarks.length > 0 ? (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <Link
              key={bookmark.id}
              href={`/cursos/${bookmark.lesson.module.course.slug}/${bookmark.lesson.slug}`}
              className="block p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all hover:scale-[1.02]"
            >
              <p className="font-medium mb-1">📌 {bookmark.lesson.title}</p>
              <p className="text-sm text-white/60">{bookmark.lesson.module.course.title}</p>
              {bookmark.note && (
                <p className="text-sm text-white/40 mt-2 italic">💭 "{bookmark.note}"</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-white/60 text-center py-8">No tienes enlaces guardados aún</p>
      )}
    </motion.div>
  )
}
