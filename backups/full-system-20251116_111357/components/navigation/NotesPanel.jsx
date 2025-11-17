'use client'

import { useState, useEffect } from 'react'

export default function NotesPanel({ 
  lessonId,
  initialNotes = '',
  onSave = null,
  autoSave = true,
  autoSaveDelay = 2000,
  className = ''
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Auto-guardar
  useEffect(() => {
    if (!autoSave || notes === initialNotes) return

    const timer = setTimeout(() => {
      handleSave()
    }, autoSaveDelay)

    return () => clearTimeout(timer)
  }, [notes])

  const handleSave = async () => {
    setIsSaving(true)

    // Simular guardado (en producción, llamar a tu API)
    await new Promise(resolve => setTimeout(resolve, 500))

    if (onSave) {
      onSave(lessonId, notes)
    }

    setLastSaved(new Date())
    setIsSaving(false)
  }

  const formatLastSaved = () => {
    if (!lastSaved) return null

    const now = new Date()
    const diff = Math.floor((now - lastSaved) / 1000) // segundos

    if (diff < 60) return 'Guardado hace unos segundos'
    if (diff < 3600) return `Guardado hace ${Math.floor(diff / 60)} minutos`
    return `Guardado hace ${Math.floor(diff / 3600)} horas`
  }

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:-translate-y-1 ${
          isOpen
            ? 'border-red-600 bg-red-600/20 text-red-600'
            : 'border-nodo-border bg-nodo-dark text-gray-400 hover:border-red-600 hover:text-red-600'
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="text-sm font-medium hidden sm:inline">
          {isOpen ? 'Cerrar Notas' : 'Mis Notas'}
        </span>
        {notes && notes.trim().length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full">
            ✓
          </span>
        )}
      </button>

      {/* Notes Panel */}
      {isOpen && (
        <div className="fixed inset-0 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 bg-nodo-dark border border-nodo-border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-nodo-border">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="text-white font-semibold">Mis Notas</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors sm:hidden"
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe tus notas aquí...

Consejos:
• Anota conceptos clave
• Escribe dudas para investigar
• Resume lo aprendido
• Agrega recordatorios personales"
              className="w-full h-full min-h-[300px] sm:min-h-[400px] bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-relaxed"
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-nodo-border bg-nodo-black">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{formatLastSaved()}</span>
                  </>
                ) : (
                  <span>Escribe para guardar automáticamente</span>
                )}
              </div>
              <span className="text-xs text-gray-600">
                {notes.length} caracteres
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || notes === initialNotes}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isSaving ? 'Guardando...' : 'Guardar Ahora'}
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres borrar todas tus notas?')) {
                    setNotes('')
                  }
                }}
                className="px-4 py-2 border border-nodo-border hover:border-red-600 hover:bg-red-600/10 text-gray-400 hover:text-red-600 rounded-lg text-sm font-medium transition-all"
              >
                Borrar
              </button>
            </div>

            {/* Tips */}
            <div className="mt-3 p-3 bg-nodo-dark rounded-lg border border-nodo-border">
              <p className="text-xs text-gray-500 flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Tus notas se guardan automáticamente cada {autoSaveDelay / 1000} segundos
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay (móvil) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
