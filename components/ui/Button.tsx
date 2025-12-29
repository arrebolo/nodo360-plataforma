import { ButtonHTMLAttributes, forwardRef } from 'react'
import Link from 'next/link'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  children: React.ReactNode
}

const baseStyles = 'font-semibold rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary: 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white hover:opacity-90',
  secondary: 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
  ghost: 'text-white/70 hover:text-white hover:bg-white/5',
  outline: 'border border-[#f7931a] text-[#f7931a] hover:bg-[#f7931a]/10',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', href, children, ...props }, ref) => {
    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

    if (href) {
      return (
        <Link href={href} className={combinedClassName}>
          {children}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
