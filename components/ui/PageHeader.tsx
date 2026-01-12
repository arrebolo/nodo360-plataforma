import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { tokens, cx } from '@/lib/design/tokens'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cx(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-brand" />
          </div>
        )}

        <div className="space-y-1">
          <h1 className={tokens.typography.h2}>{title}</h1>
          {subtitle && (
            <p className={cx(tokens.typography.p, tokens.color.textMuted)}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export default PageHeader
