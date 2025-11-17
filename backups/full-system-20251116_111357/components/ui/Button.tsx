import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2'

    const variants = {
      primary: 'bg-[#F7931A] hover:bg-[#FDB931] text-black shadow-lg hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]',
      secondary: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]',
      ghost: 'hover:bg-[#1a1a1a] text-gray-400 hover:text-white',
      outline: 'border border-[#F7931A] text-[#F7931A] hover:bg-[#F7931A]/10',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
