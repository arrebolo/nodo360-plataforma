'use client'

import { LucideIcon } from 'lucide-react'
import { BenefitCard } from './BenefitCard'

interface Benefit {
  icon: LucideIcon
  title: string
  description: string
}

interface BenefitsGridProps {
  benefits: Benefit[]
  title: string
  subtitle: string
}

export function BenefitsGrid({ benefits, title, subtitle }: BenefitsGridProps) {
  return (
    <div className="bg-nodo-bg min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-xl text-slate-400">
            {subtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-6
        ">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={index}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
