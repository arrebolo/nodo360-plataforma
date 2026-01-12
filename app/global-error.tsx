'use client'

import { useEffect } from 'react'

// Helper para reportar errores (Sentry cuando esté instalado)
function captureException(error: Error) {
  // En producción, Sentry capturará esto automáticamente
  // Por ahora, solo logueamos a consola
  console.error('[Global Error]', error.message, error.stack)
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Algo salió mal
          </h1>

          <p className="text-white/60 mb-8">
            Hemos registrado el error automáticamente y trabajaremos para solucionarlo pronto.
          </p>

          <div className="space-y-4">
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              Intentar de nuevo
            </button>

            <a
              href="/"
              className="block w-full px-6 py-3 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all"
            >
              Volver al inicio
            </a>
          </div>

          {error.digest && (
            <p className="mt-6 text-xs text-white/40">
              Código de error: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
