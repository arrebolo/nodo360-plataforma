'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Play, BookOpen } from 'lucide-react'

type ContinueData = {
  courseSlug: string
  courseTitle: string
  lessonSlug: string
  lessonTitle: string
  lastPositionSeconds: number | null
  progressPercentage: number
}

export function ContinueLearningCard() {
  const [data, setData] = useState<ContinueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchContinue = async () => {
      try {
        const res = await fetch('/api/continue', { method: 'GET' })
        const json = await res.json()

        if (cancelled) return

        if (json.ok && json.data) {
          setData(json.data)
        } else {
          setData(null)
        }
      } catch (err) {
        console.error('Error fetching continue data:', err)
        if (!cancelled) {
          setError(true)
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchContinue()

    return () => {
      cancelled = true
    }
  }, [])

  // Skeleton mientras carga
  if (loading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 w-20 bg-neutral-200 rounded mb-3" />
        <div className="h-6 w-48 bg-neutral-200 rounded mb-2" />
        <div className="h-4 w-32 bg-neutral-200 rounded" />
      </Card>
    )
  }

  // No mostrar nada si hay error o no hay datos
  if (error || !data) return null

  const href = `/cursos/${data.courseSlug}/${data.lessonSlug}`

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${mm}:${String(ss).padStart(2, '0')}`
  }

  return (
    <Card className="p-5 border-l-4 border-l-orange-500">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-neutral-500 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Continuar aprendiendo
          </p>

          <h3 className="mt-2 text-lg font-semibold text-neutral-900 truncate">
            {data.courseTitle}
          </h3>

          <p className="mt-1 text-sm text-neutral-600 truncate">{data.lessonTitle}</p>

          {/* Barra de progreso */}
          {data.progressPercentage > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min(data.progressPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500 tabular-nums">
                {data.progressPercentage}%
              </span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <Link href={href}>
            <Button variant="primary" className="gap-2">
              <Play className="h-4 w-4" />
              Continuar
            </Button>
          </Link>
        </div>
      </div>

      {typeof data.lastPositionSeconds === 'number' && data.lastPositionSeconds > 0 && (
        <p className="mt-3 text-xs text-neutral-400">
          Reanudar en {formatTime(data.lastPositionSeconds)}
        </p>
      )}
    </Card>
  )
}

export default ContinueLearningCard


