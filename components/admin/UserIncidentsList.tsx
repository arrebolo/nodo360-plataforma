'use client'

import { useState, useEffect } from 'react'
import {
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shield,
  Flag,
  AlertTriangle,
  Link2,
  Share2,
  TrendingUp,
  Repeat,
  Mail,
} from 'lucide-react'
import type { UserIncidentSummary, UserIncidentDetail, RiskLevel } from '@/lib/moderation/types'

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  alto: { label: 'Alto', className: 'bg-red-500/20 text-red-400' },
  medio: { label: 'Medio', className: 'bg-orange-500/20 text-orange-400' },
  bajo: { label: 'Bajo', className: 'bg-yellow-500/20 text-yellow-400' },
  limpio: { label: 'Limpio', className: 'bg-green-500/20 text-green-400' },
}

const FLAG_TYPE_ICONS: Record<string, typeof Link2> = {
  external_link: Link2,
  invite_link: Share2,
  spam_pattern: AlertTriangle,
  trading_promo: TrendingUp,
  repeat_message: Repeat,
  mass_dm: Mail,
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  external_link: 'Enlace externo',
  invite_link: 'Enlace invitación',
  spam_pattern: 'Patrón spam',
  trading_promo: 'Promo trading',
  repeat_message: 'Mensaje repetido',
  mass_dm: 'DM masivo',
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  external_promo: 'Promo externa',
  trading_promo: 'Promo trading',
  harassment: 'Acoso',
  scam: 'Estafa',
  inappropriate: 'Inapropiado',
  other: 'Otro',
}

export default function UserIncidentsList() {
  const [users, setUsers] = useState<UserIncidentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<UserIncidentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/moderation/users')
      if (!res.ok) throw new Error('Error al cargar usuarios')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching incident users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleExpand(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      setUserDetail(null)
      return
    }

    setExpandedUserId(userId)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/moderation/users/${userId}`)
      if (!res.ok) throw new Error('Error al cargar detalle')
      const data = await res.json()
      setUserDetail(data)
    } catch (err) {
      console.error('Error fetching user detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
        <Shield className="w-12 h-12 mx-auto text-green-400/60 mb-3" />
        <p className="text-white/60">No hay usuarios con incidencias registradas</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Cabecera */}
      <div className="grid grid-cols-[1fr_100px_80px_80px_100px_120px] gap-4 px-4 py-2 text-xs text-white/40 font-medium">
        <span>Usuario</span>
        <span className="text-center">Total</span>
        <span className="text-center">Flags</span>
        <span className="text-center">Reportes</span>
        <span className="text-center">Riesgo</span>
        <span className="text-right">Última incidencia</span>
      </div>

      {users.map(u => {
        const riskConfig = RISK_CONFIG[u.risk_level]
        const totalIncidents = u.total_flags + u.total_reports_received
        const isExpanded = expandedUserId === u.user_id
        const lastIncident = u.last_flag_at || u.last_report_at

        return (
          <div key={u.user_id}>
            {/* Fila del usuario */}
            <button
              onClick={() => toggleExpand(u.user_id)}
              className="w-full grid grid-cols-[1fr_100px_80px_80px_100px_120px] gap-4 items-center bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all text-left"
            >
              {/* Usuario */}
              <div className="flex items-center gap-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-sm text-white block truncate">{u.full_name || 'Sin nombre'}</span>
                  <span className="text-xs text-white/40">{u.role}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-white/40 ml-auto flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40 ml-auto flex-shrink-0" />
                )}
              </div>

              {/* Total */}
              <span className="text-center text-sm font-semibold text-white">{totalIncidents}</span>

              {/* Flags */}
              <span className="text-center text-sm text-white/60">
                {u.total_flags}
                {u.high_severity_flags > 0 && (
                  <span className="text-red-400 text-xs ml-1">({u.high_severity_flags})</span>
                )}
              </span>

              {/* Reportes */}
              <span className="text-center text-sm text-white/60">{u.total_reports_received}</span>

              {/* Riesgo */}
              <div className="flex justify-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskConfig.className}`}>
                  {riskConfig.label}
                </span>
              </div>

              {/* Última incidencia */}
              <span className="text-right text-xs text-white/40">
                {lastIncident
                  ? new Date(lastIncident).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : '—'}
              </span>
            </button>

            {/* Detalle expandido */}
            {isExpanded && (
              <div className="ml-4 mt-1 mb-2 bg-white/[0.02] rounded-xl border border-white/5 p-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-white/40" />
                  </div>
                ) : userDetail ? (
                  <div className="space-y-4">
                    {/* Flags */}
                    {userDetail.flags.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          Flags automáticos ({userDetail.flags.length})
                        </h4>
                        <div className="space-y-1">
                          {userDetail.flags.map(flag => {
                            const FlagIcon = FLAG_TYPE_ICONS[flag.flag_type] || AlertTriangle
                            return (
                              <div key={flag.id} className="flex items-center gap-3 text-xs py-1.5 px-2 bg-white/[0.02] rounded-lg">
                                <FlagIcon className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-white/60">{FLAG_TYPE_LABELS[flag.flag_type] || flag.flag_type}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  flag.severity >= 4 ? 'bg-red-500/20 text-red-400' :
                                  flag.severity >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  Sev {flag.severity}
                                </span>
                                <span className="text-white/30 ml-auto">
                                  {new Date(flag.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </span>
                                {flag.review_action && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    flag.review_action === 'user_banned' ? 'bg-red-500/20 text-red-400' :
                                    flag.review_action === 'warning_sent' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-white/5 text-white/30'
                                  }`}>
                                    {flag.review_action === 'dismissed' ? 'Descartado' :
                                     flag.review_action === 'warning_sent' ? 'Advertencia' :
                                     flag.review_action === 'user_banned' ? 'Baneado' : flag.review_action}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reportes */}
                    {userDetail.reports.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Reportes recibidos ({userDetail.reports.length})
                        </h4>
                        <div className="space-y-1">
                          {userDetail.reports.map(report => (
                            <div key={report.id} className="flex items-center gap-3 text-xs py-1.5 px-2 bg-white/[0.02] rounded-lg">
                              <span className="text-white/60">{REASON_LABELS[report.reason] || report.reason}</span>
                              {report.details && (
                                <span className="text-white/30 truncate max-w-[200px]" title={report.details}>
                                  {report.details}
                                </span>
                              )}
                              <span className="text-white/30 ml-auto">
                                {new Date(report.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                report.status === 'actioned' ? 'bg-green-500/20 text-green-400' :
                                report.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                                report.status === 'triaged' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-white/5 text-white/30'
                              }`}>
                                {report.status === 'open' ? 'Abierto' :
                                 report.status === 'triaged' ? 'Triaje' :
                                 report.status === 'actioned' ? 'Accionado' :
                                 'Cerrado'}
                              </span>
                              <span className="text-white/30 text-[10px]">
                                por {report.reporter?.full_name || 'Usuario'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-white/40 text-center py-4">Error al cargar detalle</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
