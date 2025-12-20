import { forwardRef } from 'react'
import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

interface ButtonAsButton extends ButtonBaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
  href?: never
}

interface ButtonAsLink extends ButtonBaseProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> {
  href: string
}

type ButtonProps = ButtonAsButton | ButtonAsLink

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-accent)] text-white shadow-[var(--shadow-accent)] hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-accent-lg)]',
  secondary: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
  danger: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-md)] gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-[var(--radius-lg)] gap-2',
  lg: 'px-7 py-3.5 text-base rounded-[var(--radius-xl)] gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className = '', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0'
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

    const content = (
      <>
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </>
    )

    if ('href' in props && props.href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          {...(props as ButtonAsLink)}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={isLoading || (props as ButtonAsButton).disabled}
        {...(props as ButtonAsButton)}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'
