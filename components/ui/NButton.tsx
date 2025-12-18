// components/ui/NButton.tsx
'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface NButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
}

const baseStyles =
  'inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8a94a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c12] disabled:opacity-60 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'bg-[#f8a94a] text-black hover:brightness-110',
  ghost:
    'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  outline:
    'border border-white/15 bg-transparent text-white hover:bg-white/5',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export function NButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: NButtonProps) {
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
