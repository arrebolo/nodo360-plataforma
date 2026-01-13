'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'

interface BookmarkButtonProps {
  lessonId: string
  isBookmarked: boolean
  onToggle: (lessonId: string) => Promise<boolean>
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function BookmarkButton({
  lessonId,
  isBookmarked,
  onToggle,
  size = 'md',
  showLabel = false
}: BookmarkButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    await onToggle(lessonId)
    setIsLoading(false)
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-lg transition-all duration-200
        ${isBookmarked
          ? 'bg-brand-light/20 text-brand-light hover:bg-brand-light/30'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
      `}
      title={isBookmarked ? 'Quitar de guardados' : 'Guardar para después'}
    >
      {isLoading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck size={iconSizes[size]} />
      ) : (
        <Bookmark size={iconSizes[size]} />
      )}
      {showLabel && (
        <span className="text-sm">
          {isBookmarked ? 'Guardado' : 'Guardar'}
        </span>
      )}
    </button>
  )
}

export default BookmarkButton
