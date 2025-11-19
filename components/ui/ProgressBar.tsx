interface ProgressBarProps {
  percentage: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProgressBar({
  percentage,
  showLabel = true,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage))

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white/70">Progreso</span>
          <span className="text-sm font-medium text-white">
            {Math.round(clampedPercentage)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-[#2a2a2a] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className="h-full bg-gradient-to-r from-[#dc2626] to-[#ef4444] transition-all duration-500 ease-out"
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
