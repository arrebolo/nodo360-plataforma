// components/ui/ProgressBar.tsx
import * as React from 'react'
import { cx } from '@/lib/design/tokens'

export function ProgressBar({
  value,
  className,
}: {
  value: number // 0..100
  className?: string
}) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 w-full rounded-full bg-neutral-200', className)}>
      <div
        className="h-2 rounded-full bg-neutral-900 transition-all"
        style={{ width: `${safe}%` }}
        aria-label={`Progreso ${safe}%`}
      />
    </div>
  )
}

export default ProgressBar
