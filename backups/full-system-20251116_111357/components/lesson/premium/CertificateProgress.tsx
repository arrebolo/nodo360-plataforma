'use client'

interface CertificateProgressProps {
  completedLessons: number
  totalLessons: number
  courseTitle: string
}

export function CertificateProgress({
  completedLessons,
  totalLessons,
  courseTitle,
}: CertificateProgressProps) {
  const progress = Math.round((completedLessons / totalLessons) * 100)
  const isComplete = progress === 100

  return (
    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg p-6 border border-yellow-500/30">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Progreso hacia Certificado</h3>
          <p className="text-sm text-gray-400 mb-3">{courseTitle}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Lecciones completadas</span>
              <span className="font-semibold text-yellow-500">
                {completedLessons} / {totalLessons}
              </span>
            </div>

            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-yellow-500">{progress}%</span>
              {isComplete && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Completado
                </span>
              )}
            </div>
          </div>

          {isComplete ? (
            <button className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold rounded-lg transition-all shadow-lg shadow-yellow-500/20">
              🎓 Obtener Certificado
            </button>
          ) : (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400">
                Completa todas las lecciones para obtener tu certificado verificado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
