import Image from 'next/image'
import { brandConfig, type LogoSize } from '@/lib/brand-config'

interface LogoProps {
  size?: LogoSize
  showText?: boolean
  className?: string
  priority?: boolean
  imageClassName?: string
}

/**
 * Logo component - Pure visual content only
 * Does NOT render <Link> internally to avoid nested anchor tags
 * Wrap this component with <Link> in parent if clickable behavior is needed
 */
export function Logo({
  size = 'md',
  showText = false,
  className = '',
  imageClassName = '',
  priority = false,
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

  if (showText) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        {logoImage}
        <div className="flex items-center gap-2">
          <span
            className="
              bg-gradient-to-r
              from-brand-light
              via-brand
              to-brand-gold
              bg-clip-text
              text-transparent
              font-bold
              text-xl
            "
          >
            NODO
          </span>
          <span className="font-bold text-xl text-white">360</span>
        </div>
      </div>
    )
  }

  return <div className={`inline-flex items-center ${className}`}>{logoImage}</div>
}
