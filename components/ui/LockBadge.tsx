import { Lock } from 'lucide-react'
import type { LockBadgeProps } from '@/types/course-system'

export function LockBadge({ locked, reason }: LockBadgeProps) {
  if (!locked) return null

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg"
      role="status"
      aria-label="Contenido bloqueado"
    >
      <Lock className="w-4 h-4 text-gray-400" aria-hidden="true" />
      <span className="text-sm text-gray-400">
        {reason || 'Completa las lecciones anteriores primero'}
      </span>
    </div>
  )
}
