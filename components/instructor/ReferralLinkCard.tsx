'use client'

import { useState } from 'react'
import {
  Link2,
  Copy,
  Check,
  MousePointer,
  Users,
  TrendingUp,
  Trash2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

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

interface ReferralLinkCardProps {
  link: ReferralLink
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

export default function ReferralLinkCard({ link, onDelete, onToggle }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nodo360.com'
  const referralUrl = `${baseUrl}/r/${link.code}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copiando:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este enlace? Se perderán todas las estadísticas.')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/instructor/referral/${link.link_id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onDelete(link.link_id)
      }
    } catch (err) {
      console.error('Error eliminando:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      const res = await fetch(`/api/instructor/referral/${link.link_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !link.is_active }),
      })
      if (res.ok) {
        onToggle(link.link_id, !link.is_active)
      }
    } catch (err) {
      console.error('Error actualizando:', err)
    } finally {
      setIsToggling(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  return (
    <div className={`bg-white/5 border rounded-2xl p-5 transition-all ${
      link.is_active ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-[#f7931a] flex-shrink-0" />
            <code className="text-sm font-mono text-white truncate">
              /r/{link.code}
            </code>
            {!link.is_active && (
              <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/50">
                Inactivo
              </span>
            )}
          </div>

          {link.course_title ? (
            <p className="text-sm text-white/60 truncate">
              Curso: {link.course_title}
            </p>
          ) : (
            <p className="text-sm text-green-400/70">
              Aplica a todos tus cursos
            </p>
          )}

          {(link.utm_medium || link.utm_campaign) && (
            <div className="flex gap-2 mt-1 flex-wrap">
              {link.utm_medium && (
                <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">
                  {link.utm_medium}
                </span>
              )}
              {link.utm_campaign && (
                <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">
                  {link.utm_campaign}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white"
            title={link.is_active ? 'Desactivar' : 'Activar'}
          >
            {link.is_active ? (
              <ToggleRight className="w-5 h-5 text-green-400" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition text-white/60 hover:text-red-400"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URL con botón copiar */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-black/20 border border-white/5">
        <input
          type="text"
          value={referralUrl}
          readOnly
          className="flex-1 bg-transparent text-sm text-white/80 font-mono outline-none truncate"
        />
        <button
          onClick={handleCopy}
          className={`p-2 rounded-lg transition ${
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <a
          href={referralUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <MousePointer className="w-3 h-3" />
          </div>
          <div className="text-lg font-bold text-white">{link.total_clicks}</div>
          <div className="text-xs text-white/40">Clics</div>
        </div>

        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <Users className="w-3 h-3" />
          </div>
          <div className="text-lg font-bold text-white">{link.total_conversions}</div>
          <div className="text-xs text-white/40">Conversiones</div>
        </div>

        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <TrendingUp className="w-3 h-3" />
          </div>
          <div className="text-lg font-bold text-white">{link.conversion_rate}%</div>
          <div className="text-xs text-white/40">Conv. Rate</div>
        </div>

        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(link.total_commission_cents)}
          </div>
          <div className="text-xs text-green-400/60">Comisión</div>
        </div>
      </div>

      {/* Footer con fecha */}
      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-white/40">
        <span>
          Creado: {new Date(link.created_at).toLocaleDateString('es-ES')}
        </span>
        <span>
          Últimos 7d: {link.clicks_7d} clics
        </span>
      </div>
    </div>
  )
}
