'use client'

import Link from 'next/link'

export default function LessonNavigation({ 
  prevLesson = null, 
  nextLesson = null,
  onComplete = null,
  isCompleted = false 
}) {
  return (
    <div className="border-t border-nodo-border pt-8 mt-12">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Botón Anterior */}
        <div className="flex-1">
          {prevLesson ? (
            <Link
              href={prevLesson.href}
              className="group flex items-center gap-3 p-4 rounded-lg border-2 border-nodo-border hover:border-red-600 transition-all hover:-translate-y-1"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-nodo-dark border border-nodo-border group-hover:border-red-600 group-hover:bg-red-600/20 flex items-center justify-center transition-all">
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Anterior
                </p>
                <p className="text-sm font-medium text-white group-hover:text-red-600 transition-colors truncate">
                  {prevLesson.title}
                </p>
                {prevLesson.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    {prevLesson.duration}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <div className="p-4 rounded-lg border-2 border-dashed border-gray-800 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">
                    Primera lección
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón Marcar como Completada (centro en móvil) */}
        {onComplete && (
          <div className="sm:px-4">
            <button
              onClick={onComplete}
              disabled={isCompleted}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                isCompleted
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 hover:-translate-y-1'
              }`}
            >
              {isCompleted ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Completada
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Marcar como Completada
                </span>
              )}
            </button>
          </div>
        )}

        {/* Botón Siguiente */}
        <div className="flex-1">
          {nextLesson ? (
            <Link
              href={nextLesson.href}
              className="group flex items-center gap-3 p-4 rounded-lg border-2 border-red-600 bg-red-600/10 hover:bg-red-600 transition-all hover:-translate-y-1"
            >
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs text-red-600 group-hover:text-white uppercase font-semibold mb-1 transition-colors">
                  Siguiente
                </p>
                <p className="text-sm font-medium text-white truncate">
                  {nextLesson.title}
                </p>
                {nextLesson.duration && (
                  <p className="text-xs text-gray-400 group-hover:text-red-100 mt-1 transition-colors">
                    {nextLesson.duration}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-600 group-hover:bg-white flex items-center justify-center transition-all">
                  <svg
                    className="w-5 h-5 text-white group-hover:text-red-600 transition-colors"
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
              </div>
            </Link>
          ) : (
            <div className="p-4 rounded-lg border-2 border-dashed border-gray-800 opacity-50">
              <div className="flex items-center justify-end gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-600 uppercase font-semibold">
                    Última lección
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-700"
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
