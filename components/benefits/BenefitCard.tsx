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
      bg-nodo-card
      border border-nodo-icon
      rounded-xl
      p-8
      transition-all duration-300
      hover:scale-105
      hover:shadow-2xl
      hover:shadow-bitcoin-orange/20
      hover:border-bitcoin-orange/50
    ">
      {/* Icon container with gradient */}
      <div className="
        w-14 h-14
        bg-gradient-to-br from-bitcoin-orange to-bitcoin-gold
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
      <p className="text-base text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  )
}
