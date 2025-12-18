// components/layout/PageHeader.tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        'mb-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-6 sm:px-7 sm:py-7 backdrop-blur-md',
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[#f8a94a]">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  )
}
