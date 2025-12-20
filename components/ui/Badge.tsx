import { forwardRef } from 'react'

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'premium'
type BadgeSize = 'sm' | 'md'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]',
  accent: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-muted)] text-[var(--color-danger)]',
  premium: 'bg-[var(--color-premium-muted)] text-[var(--color-premium)]',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', icon, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1 font-semibold rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {icon}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Preset badges
export const FreeBadge = () => (
  <Badge variant="success" size="sm">Gratis</Badge>
)

export const PremiumBadge = () => (
  <Badge variant="premium" size="sm">Premium</Badge>
)

export const NewBadge = () => (
  <Badge variant="accent" size="sm">Nuevo</Badge>
)

export const LevelBadge = ({ level }: { level: 'principiante' | 'intermedio' | 'avanzado' }) => {
  const labels = {
    principiante: 'Principiante',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
  }
  const variants: Record<string, BadgeVariant> = {
    principiante: 'success',
    intermedio: 'warning',
    avanzado: 'danger',
  }
  return <Badge variant={variants[level]} size="sm">{labels[level]}</Badge>
}
