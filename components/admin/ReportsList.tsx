'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  User,
} from 'lucide-react'
import type {
  MessageReportWithUsers,
  PaginationInfo,
  ReportReason,
  ReportStatus,
} from '@/lib/moderation/types'
import RecidivismBadge from './RecidivismBadge'

const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  external_promo: 'Promo externa',
  trading_promo: 'Promo trading',
  harassment: 'Acoso',
  scam: 'Estafa',
  inappropriate: 'Inapropiado',
  other: 'Otro',
}

const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  open: { label: 'Abierto', className: 'bg-yellow-500/20 text-yellow-400' },
  triaged: { label: 'Triaje', className: 'bg-blue-500/20 text-blue-400' },
  closed: { label: 'Cerrado', className: 'bg-white/10 text-white/40' },
  actioned: { label: 'Accionado', className: 'bg-green-500/20 text-green-400' },
}

interface ReportsListProps {
  initialReports: MessageReportWithUsers[]
  initialPagination: PaginationInfo
}

export default function ReportsList({ initialReports, initialPagination }: ReportsListProps) {
  const [reports, setReports] = useState(initialReports)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)

  // Tab: abiertos vs cerrados
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')

  // Filtros
  const [filterReason, setFilterReason] = useState('')

  // Modal
  const [selectedReport, setSelectedReport] = useState<MessageReportWithUsers | null>(null)
  const [modalStatus, setModalStatus] = useState<ReportStatus>('open')
  const [modalNotes, setModalNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Cargar al cambiar de tab
  useEffect(() => {
    fetchReports(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function fetchReports(page: number = 1) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status_group', activeTab)
      if (filterReason) params.set('reason', filterReason)
      params.set('page', page.toString())

      const res = await fetch(`/api/admin/moderation/reports?${params}`)
      if (!res.ok) throw new Error('Error al cargar reportes')

      const data = await res.json()
      setReports(data.reports)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  function openModal(report: MessageReportWithUsers) {
    setSelectedReport(report)
    setModalStatus(report.status)
    setModalNotes(report.admin_notes || '')
  }

  function closeModal() {
    setSelectedReport(null)
    setModalStatus('open')
    setModalNotes('')
  }

  async function handleSave() {
    if (!selectedReport) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/moderation/reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: modalStatus, admin_notes: modalNotes }),
      })

      if (!res.ok) throw new Error('Error al actualizar reporte')

      // Refrescar la lista para reflejar cambios de estado
      await fetchReports(pagination.page)
      closeModal()
    } catch (err) {
      console.error('Error saving report:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleFilterChange() {
    fetchReports(1)
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs: Abiertos / Cerrados */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'open'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Abiertos
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'closed'
                ? 'bg-green-500/20 text-green-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Cerrados
          </button>
        </div>

        {/* Filtros */}
        <select
          value={filterReason}
          onChange={e => { setFilterReason(e.target.value); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="">Todas las razones</option>
          {Object.entries(REASON_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val}</option>
          ))}
        </select>

        <button
          onClick={handleFilterChange}
          disabled={loading}
          className="px-4 py-2 bg-brand hover:bg-brand/90 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          Filtrar
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400/60 mb-3" />
          <p className="text-white/60">
            {activeTab === 'open'
              ? 'No hay reportes abiertos'
              : 'No hay reportes cerrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map(report => {
            const statusConfig = STATUS_CONFIG[report.status]
            const reasonLabel = REASON_LABELS[report.reason] || report.reason

            return (
              <div
                key={report.id}
                className={`bg-white/5 rounded-xl p-4 border transition-all ${
                  activeTab === 'closed'
                    ? 'border-white/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Reporter */}
                  <div className="flex items-center gap-2 min-w-[130px]">
                    {report.reporter?.avatar_url ? (
                      <img src={report.reporter.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <User className="w-4 h-4 text-white/40" />
                    )}
                    <span className="text-sm text-white truncate">
                      {report.reporter?.full_name || 'Usuario'}
                    </span>
                  </div>

                  {/* Arrow */}
                  <span className="text-white/20">&rarr;</span>

                  {/* Reported */}
                  <div className="flex items-center gap-2 min-w-[130px]">
                    {report.reported_user?.avatar_url ? (
                      <img src={report.reported_user.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <User className="w-4 h-4 text-white/40" />
                    )}
                    <span className="text-sm text-white truncate">
                      {report.reported_user?.full_name || 'Usuario'}
                    </span>
                    <RecidivismBadge userId={report.reported_user_id} />
                  </div>

                  {/* Razón */}
                  <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/60">
                    {reasonLabel}
                  </span>

                  {/* Detalles o notas admin (según tab) */}
                  {activeTab === 'open' && report.details && (
                    <span className="text-xs text-white/40 truncate max-w-[150px]" title={report.details}>
                      {report.details}
                    </span>
                  )}
                  {activeTab === 'closed' && report.admin_notes && (
                    <span className="text-xs text-white/40 truncate max-w-[150px]" title={report.admin_notes}>
                      {report.admin_notes}
                    </span>
                  )}

                  {/* Estado */}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-auto ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>

                  {/* Fecha */}
                  <span className="text-xs text-white/40">
                    {new Date(activeTab === 'closed' && report.resolved_at ? report.resolved_at : report.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>

                  {/* Acción */}
                  <button
                    onClick={() => openModal(report)}
                    className="px-3 py-1 bg-brand/10 hover:bg-brand/20 rounded-lg text-xs text-brand-light transition-colors"
                  >
                    {activeTab === 'open' ? 'Gestionar' : 'Ver'}
                  </button>
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
            onClick={() => fetchReports(pagination.page - 1)}
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
            onClick={() => fetchReports(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="flex items-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de gestión */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-secondary border border-white/10 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Gestionar Reporte</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Detalles del reporte */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-white/40 block mb-1">Reporter</label>
                <p className="text-sm text-white">{selectedReport.reporter?.full_name || 'Usuario'}</p>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Reportado</label>
                <p className="text-sm text-white">{selectedReport.reported_user?.full_name || 'Usuario'}</p>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Razón</label>
                <p className="text-sm text-white">{REASON_LABELS[selectedReport.reason]}</p>
              </div>
              {selectedReport.details && (
                <div>
                  <label className="text-xs text-white/40 block mb-1">Detalles del reporter</label>
                  <p className="text-sm text-white/80 bg-white/5 rounded-lg p-3">{selectedReport.details}</p>
                </div>
              )}
              {selectedReport.resolved_at && (
                <div>
                  <label className="text-xs text-white/40 block mb-1">Resuelto</label>
                  <p className="text-sm text-white/60">
                    {new Date(selectedReport.resolved_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Cambiar estado */}
            <div className="mb-4">
              <label className="text-xs text-white/40 block mb-2">Estado</label>
              <select
                value={modalStatus}
                onChange={e => setModalStatus(e.target.value as ReportStatus)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            {/* Notas admin */}
            <div className="mb-6">
              <label className="text-xs text-white/40 block mb-2">Notas del admin</label>
              <textarea
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
                rows={3}
                placeholder="Notas internas sobre este reporte..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
              />
            </div>

            {/* Acciones */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-brand hover:bg-brand/90 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
