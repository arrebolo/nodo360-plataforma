// components/ui/Card.tsx
import * as React from 'react'
import { tokens, cx } from '@/lib/design/tokens'

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        tokens.color.surface,
        tokens.radius.card,
        tokens.border.subtle,
        tokens.shadow.card,
        'p-6 sm:p-7',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('mb-4', className)} {...props} />
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx(tokens.typography.h3, className)} {...props} />
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx(tokens.typography.small, tokens.color.textMuted, className)} {...props} />
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('space-y-4', className)} {...props} />
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('mt-6 flex items-center justify-between gap-3', className)} {...props} />
}


