'use client'

import { useState } from 'react'
import ReferralLinkCard from '@/components/instructor/ReferralLinkCard'

interface ReferralLink {
  link_id: string
  code: string
  custom_slug: string | null
  course_id: string | null
  course_title: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  is_active: boolean
  created_at: string
  total_clicks: number
  clicks_7d: number
  clicks_30d: number
  total_conversions: number
  conversions_30d: number
  total_revenue_cents: number
  total_commission_cents: number
  conversion_rate: number
}

interface ReferralLinksClientProps {
  initialLinks: ReferralLink[]
}

export default function ReferralLinksClient({ initialLinks }: ReferralLinksClientProps) {
  const [links, setLinks] = useState<ReferralLink[]>(initialLinks)

  const handleDelete = (id: string) => {
    setLinks(links.filter(l => l.link_id !== id))
  }

  const handleToggle = (id: string, active: boolean) => {
    setLinks(links.map(l =>
      l.link_id === id ? { ...l, is_active: active } : l
    ))
  }

  return (
    <div className="grid gap-4">
      {links.map((link) => (
        <ReferralLinkCard
          key={link.link_id}
          link={link}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
