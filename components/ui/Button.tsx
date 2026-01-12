'use client'

import * as React from 'react'
import Link from 'next/link'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'soft'
  | 'ghost'
  | 'outline'
  | 'danger'

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  loading?: boolean
  /** @deprecated Use `loading` instead */
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
  'transition-colors select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ' +
  'disabled:opacity-50 disabled:pointer-events-none'

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-10 w-10 p-0',
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-gradient-to-r from-brand-light to-brand ' +
    'hover:opacity-95 hover:shadow-lg hover:shadow-brand/20',

  secondary:
    'text-white bg-white/10 border border-dark-border ' +
    'hover:bg-white/15',

  soft:
    'text-white bg-white/5 border border-dark-border ' +
    'hover:bg-white/10 hover:border-brand/30',

  ghost:
    'text-muted hover:text-white hover:bg-white/5',

  outline:
    'text-white bg-transparent border border-dark-border ' +
    'hover:border-brand/40 hover:bg-white/5',

  danger:
    'text-white bg-error/80 hover:bg-error',
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      href,
      loading: loadingProp,
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const loading = loadingProp || isLoading

    const classes = [
      base,
      sizes[size],
      variants[variant],
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ')

    const content = (
      <>
        {loading && <Spinner />}
        {!loading && leftIcon}
        <span className={size === 'icon' ? 'sr-only' : ''}>{children}</span>
        {!loading && rightIcon}
      </>
    )

    // Link mode
    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          aria-disabled={disabled || loading ? true : undefined}
          tabIndex={disabled || loading ? -1 : undefined}
          onClick={(e) => {
            if (disabled || loading) e.preventDefault()
          }}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading ? true : undefined}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
