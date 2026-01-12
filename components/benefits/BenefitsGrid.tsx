'use client'

import {
  Target,
  Video,
  Code2,
  Briefcase,
  Users,
  MessageCircle,
  MessageSquare,
  Calendar,
  Trophy,
  Lightbulb,
  Users2,
  Zap,
  LucideIcon
} from 'lucide-react'
import { BenefitCard } from './BenefitCard'

// Icon mapping - maps string keys to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  target: Target,
  video: Video,
  code2: Code2,
  briefcase: Briefcase,
  users: Users,
  messageCircle: MessageCircle,
  messageSquare: MessageSquare,
  calendar: Calendar,
  trophy: Trophy,
  lightbulb: Lightbulb,
  users2: Users2,
  zap: Zap,
} as const

interface Benefit {
  iconKey: string
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
    <div className="bg-dark min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-xl text-white/60">
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
          {benefits.map((benefit, index) => {
            const IconComponent = ICON_MAP[benefit.iconKey]

            if (!IconComponent) {
              console.warn(`Icon not found for key: ${benefit.iconKey}`)
              return null
            }

            return (
              <BenefitCard
                key={index}
                icon={IconComponent}
                title={benefit.title}
                description={benefit.description}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}


