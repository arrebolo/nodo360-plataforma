import * as React from 'react'
import { tokens, cx } from '@/lib/design/tokens'

type PageSize = 'default' | 'wide' | 'narrow'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  size?: PageSize
  noPadding?: boolean
}

const sizeMap: Record<PageSize, string> = {
  default: tokens.layout.container,
  wide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  narrow: 'max-w-4xl mx-auto px-4 sm:px-6',
}

function PageContainer({
  children,
  className,
  size = 'default',
  noPadding = false,
}: PageContainerProps) {
  return (
    <div
      className={cx(
        sizeMap[size],
        !noPadding && tokens.layout.sectionGap,
        className
      )}
    >
      {children}
    </div>
  )
}

export default PageContainer
