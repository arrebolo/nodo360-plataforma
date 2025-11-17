'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function SearchBar({ placeholder = 'Buscar cursos, lecciones...', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atajo de teclado Ctrl+K o Cmd+K
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Simular búsqueda (en producción, llamar a tu API/BD)
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)

    // Simular delay de API
    const timer = setTimeout(() => {
      // Datos de ejemplo - reemplazar con tu API real
      const mockResults = [
        {
          type: 'curso',
          title: 'Fundamentos de Blockchain',
          slug: 'fundamentos-blockchain',
          category: 'Blockchain',
          description: 'Aprende los conceptos básicos de blockchain',
        },
        {
          type: 'curso',
          title: 'Bitcoin desde Cero',
          slug: 'bitcoin-desde-cero',
          category: 'Bitcoin',
          description: 'Introducción completa a Bitcoin',
        },
        {
          type: 'leccion',
          title: '¿Qué es Blockchain?',
          slug: 'fundamentos-blockchain/modulo-1/que-es-blockchain',
          course: 'Fundamentos de Blockchain',
          duration: '15 min',
        },
        {
          type: 'curso',
          title: 'Tu Primera Wallet',
          slug: 'primera-wallet',
          category: 'Seguridad',
          description: 'Crea y protege tu wallet de Bitcoin',
        },
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      )

      setResults(mockResults)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = () => {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <>
      {/* Search Button/Input */}
      <div className={`relative ${className}`} ref={searchRef}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2 bg-nodo-dark border border-nodo-border rounded-lg text-left hover:border-red-600 transition-colors group"
        >
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="flex-1 text-gray-400 text-sm">
            {placeholder}
          </span>
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-nodo-black border border-nodo-border rounded">
            ⌘K
          </kbd>
        </button>

        {/* Search Modal */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-nodo-dark border border-nodo-border rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-nodo-border">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <Link
                      key={index}
                      href={`/cursos/${result.slug}`}
                      onClick={handleSelect}
                      className="block px-4 py-3 hover:bg-nodo-black transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          result.type === 'curso' 
                            ? 'bg-red-600/20 text-red-600' 
                            : 'bg-blue-600/20 text-blue-600'
                        }`}>
                          {result.type === 'curso' ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold uppercase ${
                              result.type === 'curso' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {result.type}
                            </span>
                            {result.category && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="text-xs text-gray-500">{result.category}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white group-hover:text-red-600 transition-colors truncate">
                            {result.title}
                          </p>
                          {result.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {result.description}
                            </p>
                          )}
                          {result.course && (
                            <p className="text-xs text-gray-500 mt-1">
                              {result.course} {result.duration && `• ${result.duration}`}
                            </p>
                          )}
                        </div>

                        {/* Arrow */}
                        <svg
                          className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors flex-shrink-0"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400 text-sm">
                    No se encontraron resultados para "{query}"
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-400 text-sm">
                    Escribe al menos 2 caracteres para buscar
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-nodo-black border-t border-nodo-border flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>↑↓ Navegar</span>
                <span>↵ Seleccionar</span>
                <span>Esc Cerrar</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay (móvil) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
