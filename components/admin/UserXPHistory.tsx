'use client'

import { useEffect, useMemo, useState } from 'react'

type XPEvent = {
  id: string
  user_id: string
  event_type: string
  xp_earned: number
  description: string | null
  created_at: string
}

type Cursor = { cursorCreatedAt: string; cursorId: string } | null

const EVENT_TYPES = [
  { value: 'lesson_completed', label: 'Leccion completada' },
  { value: 'quiz_passed', label: 'Quiz aprobado' },
  { value: 'perfect_score', label: 'Puntuacion perfecta' },
  { value: 'course_completed', label: 'Curso completado' },
  { value: 'daily_login', label: 'Login diario' },
  { value: 'streak_bonus', label: 'Bonus de racha' },
  { value: 'admin_adjustment', label: 'Ajuste manual' }
] as const

// Helpers para fechas por defecto
function getLastMonthDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Formato de fecha legible
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function toMs(iso: string) {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : 0
}

function formatXP(x: number) {
  if (!Number.isFinite(x)) return '0'
  return x > 0 ? `+${x}` : `${x}`
}

function badgeForType(type: string) {
  // estilos neutros y claros (sin “arcoíris”)
  // admin_adjustment destacado para auditoría
  switch (type) {
    case 'admin_adjustment':
      return {
        label: 'ADMIN',
        className:
          'bg-amber-500/15 text-amber-200 border border-amber-500/30'
      }
    case 'course_completed':
      return {
        label: 'CURSO',
        className:
          'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
      }
    case 'perfect_score':
      return {
        label: '100%',
        className:
          'bg-violet-500/15 text-violet-200 border border-violet-500/30'
      }
    case 'quiz_passed':
      return {
        label: 'QUIZ',
        className:
          'bg-sky-500/15 text-sky-200 border border-sky-500/30'
      }
    case 'lesson_completed':
      return {
        label: 'LECCIÓN',
        className:
          'bg-white/10 text-white/90 border border-white/15'
      }
    case 'daily_login':
      return {
        label: 'LOGIN',
        className:
          'bg-white/10 text-white/90 border border-white/15'
      }
    case 'streak_bonus':
      return {
        label: 'RACHA',
        className:
          'bg-white/10 text-white/90 border border-white/15'
      }
    default:
      return {
        label: type,
        className:
          'bg-white/10 text-white/90 border border-white/15'
      }
  }
}

export default function UserXPHistory({ userId }: { userId: string }) {
  const [events, setEvents] = useState<XPEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [cursor, setCursor] = useState<Cursor>(null)

  const [type, setType] = useState<string>('')
  const [from, setFrom] = useState<string>(() => `${getLastMonthDate()}T00:00:00Z`)
  const [to, setTo] = useState<string>(() => `${getTodayDate()}T23:59:59Z`)

  const nowMs = useMemo(() => Date.now(), [])
  const dayMs = 24 * 60 * 60 * 1000

  const totals = useMemo(() => {
    const sumAll = events.reduce((acc, e) => acc + (Number.isFinite(e.xp_earned) ? e.xp_earned : 0), 0)

    const sumInWindow = (windowMs: number) => {
      const cutoff = nowMs - windowMs
      return events.reduce((acc, e) => {
        const t = toMs(e.created_at)
        if (t >= cutoff) {
          return acc + (Number.isFinite(e.xp_earned) ? e.xp_earned : 0)
        }
        return acc
      }, 0)
    }

    return {
      count: events.length,
      sumAll,
      sumToday: sumInWindow(dayMs),
      sum7d: sumInWindow(7 * dayMs),
      sum30d: sumInWindow(30 * dayMs)
    }
  }, [events, nowMs])

  const fetchPage = async (reset: boolean) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (type) params.set('type', type)
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      if (!reset && cursor) {
        params.set('cursorCreatedAt', cursor.cursorCreatedAt)
        params.set('cursorId', cursor.cursorId)
      }

      const res = await fetch(`/api/admin/users/${userId}/xp-events?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) throw new Error(json?.error || 'Error cargando eventos')

      const nextCursor = json?.nextCursor ?? null
      const pageEvents: XPEvent[] = json?.events ?? []

      setCursor(nextCursor)
      setEvents((prev) => (reset ? pageEvents : [...prev, ...pageEvents]))
    } catch (e: any) {
      setError(e?.message || 'Error cargando eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCursor(null)
    fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, from, to, userId])

  return (
    <div className="space-y-4">
      {/* Cabecera + resumen */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4 justify-between">
          <div>
            <div className="text-white font-semibold">Auditoría de XP</div>
            <div className="text-sm text-white/80">
              Eventos cargados: <span className="text-white">{totals.count}</span> · Suma (cargados):{' '}
              <span className="text-white">{totals.sumAll}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Hoy" value={totals.sumToday} />
            <MiniStat label="7 días" value={totals.sum7d} />
            <MiniStat label="30 días" value={totals.sum30d} />
            <MiniStat label="Admin" value={events.filter(e => e.event_type === 'admin_adjustment').length} suffix=" ev." />
          </div>
        </div>

        {/* filtros */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-white cursor-pointer"
              style={{ colorScheme: 'dark', backgroundColor: '#1a1f2e' }}
            >
              <option value="" className="bg-[#1a1f2e] text-white">Todos los eventos</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-[#1a1f2e] text-white">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1">Desde</label>
            <input
              type="date"
              value={from ? from.split('T')[0] : ''}
              onChange={(e) => setFrom(e.target.value ? `${e.target.value}T00:00:00Z` : '')}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1">Hasta</label>
            <input
              type="date"
              value={to ? to.split('T')[0] : ''}
              onChange={(e) => setTo(e.target.value ? `${e.target.value}T23:59:59Z` : '')}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/20 text-white/80">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">XP</th>
                <th className="text-left px-4 py-3">Descripción</th>
              </tr>
            </thead>

            <tbody>
              {events.map((e) => {
                const badge = badgeForType(e.event_type)
                const isAdmin = e.event_type === 'admin_adjustment'
                const xpClass =
                  e.xp_earned > 0
                    ? 'text-white'
                    : e.xp_earned < 0
                      ? 'text-red-200'
                      : 'text-white/90'

                return (
                  <tr
                    key={e.id}
                    className={`border-t border-white/10 ${isAdmin ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap text-sm">
                      {formatDate(e.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className={`px-4 py-3 text-right font-semibold ${xpClass}`}>
                      {formatXP(e.xp_earned)}
                    </td>

                    <td className="px-4 py-3 text-white/60 text-sm max-w-[250px] truncate">
                      {e.description || EVENT_TYPES.find(t => t.value === e.event_type)?.label || '-'}
                    </td>
                  </tr>
                )
              })}

              {!loading && events.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={4}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-white/60 font-medium">Sin eventos de XP</p>
                      <p className="text-white/40 text-sm">
                        {type || from || to
                          ? 'No hay eventos que coincidan con los filtros seleccionados'
                          : 'Este usuario aun no ha generado eventos de XP'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <div className="text-xs text-white/60">{cursor ? 'Hay más eventos.' : 'Fin de la lista.'}</div>

          <button
            onClick={() => fetchPage(false)}
            disabled={loading || !cursor}
            className="px-4 py-2 rounded-lg bg-brand-light text-white disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  suffix
}: {
  label: string
  value: number
  suffix?: string
}) {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-white font-semibold">
        {Number.isFinite(value) ? value : 0}
        {suffix ? <span className="text-white/80 font-normal"> {suffix}</span> : null}
      </div>
    </div>
  )
}


