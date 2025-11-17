import Image from 'next/image'
import Link from 'next/link'
import { brandConfig, type LogoSize } from '@/lib/brand-config'

interface LogoProps {
  size?: LogoSize
  showText?: boolean
  href?: string
  className?: string
  priority?: boolean
  imageClassName?: string
}

export function Logo({
  size = 'md',
  showText = false,
  href,
  className = '',
  imageClassName = '',
  priority = false
}: LogoProps) {
  const dimensions = brandConfig.logo.sizes[size]

  const logoImage = (
    <Image
      src={brandConfig.logo.url}
      alt={brandConfig.logo.alt}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={`object-contain ${imageClassName}`}
    />
  )

  const content = showText ? (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoImage}
      <div className="flex items-center gap-2">
        <span className="bg-gradient-to-r from-[#ff6b35] via-[#f7931a] to-[#FFD700] bg-clip-text text-transparent font-bold text-xl">
          NODO
        </span>
        <span className="font-bold text-xl text-white">360</span>
      </div>
    </div>
  ) : (
    <div className={className}>
      {logoImage}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    )
  }

  return <div className="inline-flex items-center">{content}</div>
}
