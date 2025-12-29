'use client'

import { useEffect, useMemo, useState } from 'react'

type XPEvent = {
  id: string
  user_id: string
  event_type: string
  xp_amount: number
  description: string | null
  created_at: string
}

type Cursor = { cursorCreatedAt: string; cursorId: string } | null

const EVENT_TYPES = [
  'lesson_completed',
  'quiz_passed',
  'perfect_score',
  'course_completed',
  'daily_login',
  'streak_bonus',
  'admin_adjustment'
] as const

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
          'bg-white/10 text-gray-200 border border-white/15'
      }
    case 'daily_login':
      return {
        label: 'LOGIN',
        className:
          'bg-white/10 text-gray-200 border border-white/15'
      }
    case 'streak_bonus':
      return {
        label: 'RACHA',
        className:
          'bg-white/10 text-gray-200 border border-white/15'
      }
    default:
      return {
        label: type,
        className:
          'bg-white/10 text-gray-200 border border-white/15'
      }
  }
}

export default function UserXPHistory({ userId }: { userId: string }) {
  const [events, setEvents] = useState<XPEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [cursor, setCursor] = useState<Cursor>(null)

  const [type, setType] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const nowMs = useMemo(() => Date.now(), [])
  const dayMs = 24 * 60 * 60 * 1000

  const totals = useMemo(() => {
    const sumAll = events.reduce((acc, e) => acc + (Number.isFinite(e.xp_amount) ? e.xp_amount : 0), 0)

    const sumInWindow = (windowMs: number) => {
      const cutoff = nowMs - windowMs
      return events.reduce((acc, e) => {
        const t = toMs(e.created_at)
        if (t >= cutoff) {
          return acc + (Number.isFinite(e.xp_amount) ? e.xp_amount : 0)
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
            <div className="text-sm text-gray-300">
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
            <label className="block text-xs text-gray-400 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Todos</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Desde (ISO)</label>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="2025-12-01T00:00:00Z"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Hasta (ISO)</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="2025-12-31T23:59:59Z"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
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
            <thead className="bg-black/20 text-gray-300">
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
                  e.xp_amount > 0
                    ? 'text-white'
                    : e.xp_amount < 0
                      ? 'text-red-200'
                      : 'text-gray-200'

                return (
                  <tr
                    key={e.id}
                    className={`border-t border-white/10 ${isAdmin ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="ml-2 text-gray-300">{e.event_type}</span>
                    </td>

                    <td className={`px-4 py-3 text-right font-semibold ${xpClass}`}>
                      {formatXP(e.xp_amount)}
                    </td>

                    <td className="px-4 py-3 text-gray-200">{e.description || '-'}</td>
                  </tr>
                )
              })}

              {!loading && events.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-300" colSpan={4}>
                    No hay eventos para estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <div className="text-xs text-gray-400">{cursor ? 'Hay más eventos.' : 'Fin de la lista.'}</div>

          <button
            onClick={() => fetchPage(false)}
            disabled={loading || !cursor}
            className="px-4 py-2 rounded-lg bg-[#ff6b35] text-white disabled:opacity-50"
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
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-white font-semibold">
        {Number.isFinite(value) ? value : 0}
        {suffix ? <span className="text-gray-300 font-normal"> {suffix}</span> : null}
      </div>
    </div>
  )
}
