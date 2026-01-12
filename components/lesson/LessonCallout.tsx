import type { CalloutBlock } from '@/types/lesson-content'

interface LessonCalloutProps {
  block: CalloutBlock
}

const calloutStyles = {
  tip: {
    container: 'bg-blue-500/10 border-blue-500/50',
    icon: '💡',
    iconBg: 'bg-blue-500/20',
    title: 'text-blue-400',
  },
  warning: {
    container: 'bg-yellow-500/10 border-yellow-500/50',
    icon: '⚠️',
    iconBg: 'bg-yellow-500/20',
    title: 'text-yellow-400',
  },
  info: {
    container: 'bg-cyan-500/10 border-cyan-500/50',
    icon: 'ℹ️',
    iconBg: 'bg-cyan-500/20',
    title: 'text-cyan-400',
  },
  success: {
    container: 'bg-green-500/10 border-green-500/50',
    icon: '✓',
    iconBg: 'bg-green-500/20',
    title: 'text-green-400',
  },
  danger: {
    container: 'bg-red-500/10 border-red-500/50',
    icon: '🚨',
    iconBg: 'bg-red-500/20',
    title: 'text-red-400',
  },
}

export function LessonCallout({ block }: LessonCalloutProps) {
  const style = calloutStyles[block.style]

  return (
    <div className={`my-6 rounded-lg border-2 ${style.container} overflow-hidden`}>
      <div className="p-4 flex gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center text-lg`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          {block.title && (
            <h4 className={`font-semibold mb-2 ${style.title}`}>
              {block.title}
            </h4>
          )}
          <div className="text-white/80 prose prose-invert max-w-none">
            {block.content}
          </div>
        </div>
      </div>
    </div>
  )
}


