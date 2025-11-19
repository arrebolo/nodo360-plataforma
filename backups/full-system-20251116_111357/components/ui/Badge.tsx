interface BadgeProps {
  variant: 'premium' | 'free' | 'completed' | 'in-progress' | 'new'
  className?: string
}

export function Badge({ variant, className = '' }: BadgeProps) {
  const variants = {
    premium: {
      icon: '🔒',
      text: 'Premium',
      className: 'bg-gradient-to-r from-[#F7931A] to-[#FDB931] text-black',
    },
    free: {
      icon: '🆓',
      text: 'Gratis',
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    completed: {
      icon: '✓',
      text: 'Completado',
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    'in-progress': {
      icon: '⏳',
      text: 'En progreso',
      className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    new: {
      icon: '✨',
      text: 'Nuevo',
      className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    },
  }

  const config = variants[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </span>
  )
}
