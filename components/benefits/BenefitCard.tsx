'use client'

import { LucideIcon } from 'lucide-react'

interface BenefitCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function BenefitCard({ icon: Icon, title, description }: BenefitCardProps) {
  return (
    <div className="
      group
      bg-dark-surface
      border border-white/10
      rounded-xl
      p-8
      transition-all duration-300
      hover:scale-105
      hover:shadow-2xl
      hover:shadow-brand-light/20
      hover:border-brand-light/50
    ">
      {/* Icon container with gradient */}
      <div className="
        w-14 h-14
        bg-gradient-to-br from-brand-light to-brand
        rounded-xl
        flex items-center justify-center
        mb-4
        transition-transform duration-300
        group-hover:scale-110
      ">
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-base text-white/60 leading-relaxed">
        {description}
      </p>
    </div>
  )
}


