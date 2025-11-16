'use client'

interface ProgressBarProps {
  progress: number // 0-100
  estimatedTime?: number // in minutes
}

export function ProgressBar({ progress, estimatedTime }: ProgressBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progreso de la lección</span>
          <div className="flex items-center gap-4">
            {estimatedTime && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {Math.ceil((estimatedTime * (100 - progress)) / 100)} min restantes
              </span>
            )}
            <span className="text-sm font-semibold text-white">{progress}%</span>
          </div>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
