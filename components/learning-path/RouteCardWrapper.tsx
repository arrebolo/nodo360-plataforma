'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RouteCard } from './RouteCard'

type PathData = {
  id: string
  name: string
  slug: string
  emoji: string | null
  subtitle: string | null
  short_description: string | null
  courseCount: number
  totalLessons: number
  isActive: boolean
}

export function RouteCardWrapper({
  path,
  educationalHint,
  isLoggedIn,
  isRecommended = false,
  continueUrl,
}: {
  path: PathData
  educationalHint: string
  isLoggedIn: boolean
  isRecommended?: boolean
  continueUrl?: string
}) {
  const router = useRouter()
  const [isSelecting, setIsSelecting] = useState(false)

  const handleSelect = async () => {
    if (path.isActive) {
      router.push(continueUrl || '/dashboard')
      return
    }

    if (isSelecting) return

    setIsSelecting(true)
    try {
      const res = await fetch('/api/user/select-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: path.slug }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push('/dashboard/rutas')
        router.refresh()
      } else {
        console.error('Error selecting path:', data.error)
      }
    } catch (error) {
      console.error('Error selecting path:', error)
    } finally {
      setIsSelecting(false)
    }
  }

  return (
    <RouteCard
      id={path.id}
      name={path.name}
      slug={path.slug}
      emoji={path.emoji ?? undefined}
      subtitle={path.subtitle ?? undefined}
      shortDescription={path.short_description ?? undefined}
      educationalHint={educationalHint}
      courseCount={path.courseCount}
      totalLessons={path.totalLessons}
      isActive={path.isActive}
      isLoggedIn={isLoggedIn}
      isRecommended={isRecommended}
      onDetails={() => {
        router.push(`/dashboard/rutas/${path.slug}`)
      }}
      onSelect={handleSelect}
    />
  )
}


