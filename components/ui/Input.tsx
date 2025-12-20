import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2.5
              bg-[var(--color-bg-elevated)]
              border rounded-[var(--radius-lg)]
              text-[var(--color-text-primary)] text-sm
              placeholder:text-[var(--color-text-muted)]
              transition-all duration-150
              hover:border-[var(--color-border-strong)]
              focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error
                ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_var(--color-danger-muted)]'
                : 'border-[var(--color-border-default)]'
              }
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>
        )}

        {hint && !error && (
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5
            bg-[var(--color-bg-elevated)]
            border rounded-[var(--radius-lg)]
            text-[var(--color-text-primary)] text-sm
            placeholder:text-[var(--color-text-muted)]
            transition-all duration-150
            hover:border-[var(--color-border-strong)]
            focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${error
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_var(--color-danger-muted)]'
              : 'border-[var(--color-border-default)]'
            }
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>
        )}

        {hint && !error && (
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
