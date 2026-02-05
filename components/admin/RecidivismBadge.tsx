'use client'

import { useState, useEffect, useRef } from 'react'
import type { UserIncidentSummary } from '@/lib/moderation/types'

// Cache global de incidentes para evitar re-fetches en la misma sesión
const incidentCache = new Map<string, UserIncidentSummary | null>()

interface RecidivismBadgeProps {
  userId: string
}

export default function RecidivismBadge({ userId }: RecidivismBadgeProps) {
  const [summary, setSummary] = useState<UserIncidentSummary | null>(
    incidentCache.get(userId) ?? null
  )
  const [loaded, setLoaded] = useState(incidentCache.has(userId))
  const [showTooltip, setShowTooltip] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (incidentCache.has(userId)) {
      setSummary(incidentCache.get(userId) ?? null)
      setLoaded(true)
      return
    }
    if (fetchedRef.current) return
    fetchedRef.current = true

    fetch(`/api/admin/moderation/users/${userId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const s = data?.summary || null
        incidentCache.set(userId, s)
        setSummary(s)
        setLoaded(true)
      })
      .catch(() => {
        incidentCache.set(userId, null)
        setLoaded(true)
      })
  }, [userId])

  if (!loaded || !summary) return null

  const totalIncidents = summary.total_flags + summary.total_reports_received
  if (totalIncidents < 1) return null

  const isRecidivist = totalIncidents >= 3
  const badgeClass = isRecidivist
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  const label = isRecidivist ? 'Reincidente' : 'Incidencia previa'

  return (
    <span
      className={`relative px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-help ${badgeClass}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {label}
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-dark-secondary border border-white/10 rounded-lg text-xs text-white whitespace-nowrap z-50 shadow-lg">
          {summary.total_flags} flag{summary.total_flags !== 1 ? 's' : ''} + {summary.total_reports_received} reporte{summary.total_reports_received !== 1 ? 's' : ''}
          {summary.risk_level === 'alto' && ' — Riesgo alto'}
          {summary.risk_level === 'medio' && ' — Riesgo medio'}
        </span>
      )}
    </span>
  )
}
