'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublishCheckResult } from '@/lib/admin/publish-rules'

interface PublishCourseButtonProps {
  courseId: string
  currentStatus: string
  className?: string
}

export function PublishCourseButton({
  courseId,
  currentStatus,
  className = ''
}: PublishCourseButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [checkResult, setCheckResult] = useState<PublishCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isPublished = currentStatus === 'published'

  // Verificar estado de publicabilidad
  const handleCheckPublish = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/publish`)
      const data = await res.json()

      setCheckResult(data)
      setShowModal(true)
    } catch (err) {
      setError('Error al verificar el curso')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Publicar curso
  const handlePublish = async (force: boolean = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      })

      const data = await res.json()

      if (data.success) {
        setShowModal(false)
        router.refresh()
      } else if (data.error === 'WARNINGS_REQUIRE_CONFIRMATION') {
        // Mostrar warnings y pedir confirmación
        setCheckResult(data.check)
      } else {
        setError(data.error || 'Error al publicar')
      }
    } catch (err) {
      setError('Error al publicar el curso')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Despublicar curso
  const handleUnpublish = async () => {
    if (!confirm('¿Estás seguro de despublicar este curso? Ya no será visible en el catálogo.')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/publish`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        router.refresh()
      } else {
        setError(data.error || 'Error al despublicar')
      }
    } catch (err) {
      setError('Error al despublicar el curso')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Botón principal */}
      {isPublished ? (
        <button
          onClick={handleUnpublish}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition disabled:opacity-50 ${className}`}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
          Despublicar
        </button>
      ) : (
        <button
          onClick={handleCheckPublish}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition disabled:opacity-50 ${className}`}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Publicar curso
        </button>
      )}

      {/* Error inline */}
      {error && !showModal && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}

      {/* Modal de confirmación */}
      {showModal && checkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {checkResult.canPublish ? 'Publicar curso' : 'No se puede publicar'}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{checkResult.summary.totalModules}</p>
                  <p className="text-sm text-white/60">Módulos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{checkResult.summary.totalLessons}</p>
                  <p className="text-sm text-white/60">Lecciones</p>
                </div>
              </div>

              {/* Hard Errors */}
              {checkResult.hardErrors.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Errores que debes corregir
                  </h3>
                  <ul className="space-y-1">
                    {checkResult.hardErrors.map((err, i) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {checkResult.warnings.length > 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Advertencias (opcional corregir)
                  </h3>
                  <ul className="space-y-1">
                    {checkResult.warnings.map((warn, i) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        {warn.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success state */}
              {checkResult.canPublish && checkResult.warnings.length === 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-emerald-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    El curso está listo para publicarse
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-white/60 hover:text-white transition"
              >
                Cancelar
              </button>

              {checkResult.canPublish && (
                <button
                  onClick={() => handlePublish(checkResult.warnings.length > 0)}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Publicando...' : (
                    checkResult.warnings.length > 0
                      ? 'Publicar de todas formas'
                      : 'Publicar ahora'
                  )}
                </button>
              )}

              {!checkResult.canPublish && (
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
                >
                  Ir a corregir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
