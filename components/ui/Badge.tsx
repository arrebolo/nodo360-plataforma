import * as React from 'react'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'premium'

type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

const base =
  'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ' +
  'border transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/5 text-muted border-dark-border',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-error/15 text-error border-error/30',
  info: 'bg-info/15 text-info border-info/30',
  premium: 'bg-brand/15 text-brand border-brand/30',
}

function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        base,
        sizeStyles[size],
        variantStyles[variant],
        className,
      ].join(' ')}
      {...props}
    />
  )
}

export default Badge
