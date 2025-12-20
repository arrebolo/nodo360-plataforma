import { forwardRef } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantClasses = {
  default: 'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]',
  elevated: 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-[var(--shadow-md)]',
  interactive: 'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer',
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[var(--radius-xl)] ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card subcomponents
export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`mb-4 ${className}`} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3 ref={ref} className={`text-lg font-semibold text-[var(--color-text-primary)] ${className}`} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p ref={ref} className={`text-sm text-[var(--color-text-secondary)] mt-1 ${className}`} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`mt-4 pt-4 border-t border-[var(--color-border-default)] ${className}`} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'
