'use client'

import { useState } from 'react'
import {
  Link2,
  Share2,
  AlertTriangle,
  TrendingUp,
  Repeat,
  Mail,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import type { MessageFlagRow, PaginationInfo } from '@/lib/moderation/types'

const FLAG_TYPE_CONFIG: Record<string, { label: string; icon: typeof Link2 }> = {
  external_link: { label: 'Enlace externo', icon: Link2 },
  invite_link: { label: 'Enlace invitación', icon: Share2 },
  spam_pattern: { label: 'Patrón spam', icon: AlertTriangle },
  trading_promo: { label: 'Promo trading', icon: TrendingUp },
  repeat_message: { label: 'Mensaje repetido', icon: Repeat },
  mass_dm: { label: 'DM masivo', icon: Mail },
}

function SeverityBadge({ severity }: { severity: number }) {
  const config: Record<number, string> = {
    1: 'bg-green-500/20 text-green-400',
    2: 'bg-green-500/20 text-green-400',
    3: 'bg-yellow-500/20 text-yellow-400',
    4: 'bg-orange-500/20 text-orange-400',
    5: 'bg-red-500/20 text-red-400',
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config[severity] || config[1]}`}>
      Severidad {severity}
    </span>
  )
}

interface FlagsListProps {
  initialFlags: MessageFlagRow[]
  initialPagination: PaginationInfo
}

export default function FlagsList({ initialFlags, initialPagination }: FlagsListProps) {
  const [flags, setFlags] = useState(initialFlags)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filtros
  const [filterType, setFilterType] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterUnreviewed, setFilterUnreviewed] = useState(false)

  async function fetchFlags(page: number = 1) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (filterSeverity) params.set('severity', filterSeverity)
      if (filterUnreviewed) params.set('unreviewed', 'true')
      params.set('page', page.toString())

      const res = await fetch(`/api/admin/moderation/flags?${params}`)
      if (!res.ok) throw new Error('Error al cargar flags')

      const data = await res.json()
      setFlags(data.flags)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Error fetching flags:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(flagId: string, reviewAction: string) {
    setActionLoading(flagId)
    try {
      const res = await fetch(`/api/admin/moderation/flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_action: reviewAction }),
      })

      if (!res.ok) throw new Error('Error al actualizar flag')

      // Actualizar localmente
      setFlags(prev =>
        prev.map(f =>
          f.id === flagId
            ? { ...f, reviewed_at: new Date().toISOString(), review_action: reviewAction }
            : f
        )
      )
    } catch (err) {
      console.error('Error reviewing flag:', err)
    } finally {
      setActionLoading(null)
    }
  }

  function handleFilterChange() {
    fetchFlags(1)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(FLAG_TYPE_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <select
          value={filterSeverity}
          onChange={e => { setFilterSeverity(e.target.value); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="">Toda severidad</option>
          <option value="5">5 - Crítico</option>
          <option value="4">4 - Alto</option>
          <option value="3">3 - Medio</option>
          <option value="2">2 - Bajo</option>
          <option value="1">1 - Mínimo</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={filterUnreviewed}
            onChange={e => { setFilterUnreviewed(e.target.checked); }}
            className="rounded border-white/20 bg-white/5 text-brand focus:ring-brand/30"
          />
          Solo sin revisar
        </label>

        <button
          onClick={handleFilterChange}
          disabled={loading}
          className="px-4 py-2 bg-brand hover:bg-brand/90 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          Filtrar
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : flags.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400/60 mb-3" />
          <p className="text-white/60">No hay flags que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {flags.map(flag => {
            const typeConfig = FLAG_TYPE_CONFIG[flag.flag_type] || {
              label: flag.flag_type,
              icon: AlertTriangle,
            }
            const Icon = typeConfig.icon
            const isReviewed = !!flag.reviewed_at

            return (
              <div
                key={flag.id}
                className={`bg-white/5 rounded-xl p-4 border transition-all ${
                  isReviewed ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Tipo */}
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <Icon className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white">{typeConfig.label}</span>
                  </div>

                  {/* Severidad */}
                  <SeverityBadge severity={flag.severity} />

                  {/* Conversación */}
                  <span className="text-xs text-white/40 font-mono truncate max-w-[120px]">
                    {flag.conversation_id.substring(0, 8)}...
                  </span>

                  {/* Fecha */}
                  <span className="text-xs text-white/40 ml-auto">
                    {new Date(flag.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* Estado / Acción */}
                  {isReviewed ? (
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/40">
                      {flag.review_action === 'dismissed' && 'Descartado'}
                      {flag.review_action === 'warning_sent' && 'Advertencia'}
                      {flag.review_action === 'user_banned' && 'Baneado'}
                    </span>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReview(flag.id, 'dismissed')}
                        disabled={actionLoading === flag.id}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors disabled:opacity-50"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={() => handleReview(flag.id, 'warning_sent')}
                        disabled={actionLoading === flag.id}
                        className="px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg text-xs text-yellow-400 transition-colors disabled:opacity-50"
                      >
                        Advertir
                      </button>
                      <button
                        onClick={() => handleReview(flag.id, 'user_banned')}
                        disabled={actionLoading === flag.id}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition-colors disabled:opacity-50"
                      >
                        Banear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => fetchFlags(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-white/40">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchFlags(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="flex items-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
