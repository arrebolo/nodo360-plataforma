'use client'

import { useState } from 'react'

export default function BookmarkButton({ 
  lessonId,
  initialBookmarked = false,
  onToggle = null,
  size = 'md',
  showLabel = true,
  className = ''
}) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = () => {
    setIsBookmarked(!isBookmarked)
    setIsAnimating(true)
    
    // Callback opcional (para guardar en BD)
    if (onToggle) {
      onToggle(lessonId, !isBookmarked)
    }

    // Reset animación
    setTimeout(() => setIsAnimating(false), 600)
  }

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={handleToggle}
      className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:-translate-y-1 ${
        isBookmarked
          ? 'border-red-600 bg-red-600/20 text-red-600'
          : 'border-nodo-border bg-nodo-dark text-gray-400 hover:border-red-600 hover:text-red-600'
      } ${className}`}
      aria-label={isBookmarked ? 'Quitar marcador' : 'Agregar marcador'}
    >
      {/* Icon */}
      <div className={`relative ${sizes[size]}`}>
        <svg
          className={`${iconSizes[size]} transition-all ${
            isAnimating ? 'scale-125' : 'scale-100'
          }`}
          fill={isBookmarked ? 'currentColor' : 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>

        {/* Animación de partículas al guardar */}
        {isAnimating && isBookmarked && (
          <>
            <span className="absolute top-0 left-0 w-2 h-2 bg-red-600 rounded-full animate-ping" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-ping animation-delay-100" />
            <span className="absolute bottom-0 left-0 w-2 h-2 bg-red-600 rounded-full animate-ping animation-delay-200" />
          </>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span className="text-sm font-medium hidden sm:inline">
          {isBookmarked ? 'Guardado' : 'Guardar'}
        </span>
      )}

      {/* Tooltip en hover (móvil) */}
      {!showLabel && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-nodo-dark border border-nodo-border rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {isBookmarked ? 'Quitar marcador' : 'Guardar lección'}
        </span>
      )}
    </button>
  )
}
