'use client'

import { useState } from 'react'
import {
  Plus,
  Copy,
  Check,
  X,
  Trash2,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react'

interface Invite {
  id: string
  code: string
  expires_at: string | null
  max_uses: number
  used_count: number
  is_active: boolean
  role: string
  notes: string | null
  created_at: string
}

interface Props {
  initialInvites: Invite[]
}

export default function InvitacionesPanel({ initialInvites }: Props) {
  const [invites, setInvites] = useState<Invite[]>(initialInvites)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [newCode, setNewCode] = useState('')
  const [expiresInHours, setExpiresInHours] = useState(72)
  const [maxUses, setMaxUses] = useState(50)
  const [notes, setNotes] = useState('')

  // Generar código aleatorio
  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const random = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    setNewCode(`N360-${random}`)
  }

  // Copiar enlace
  async function copyInviteLink(code: string) {
    const url = `${window.location.origin}/login?invite=${code}`
    await navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Crear invitación
  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          expiresInHours,
          maxUses,
          notes,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setInvites([data.invite, ...invites])
        setShowCreateModal(false)
        setNewCode('')
        setNotes('')
      } else {
        alert(data.error || 'Error al crear invitación')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear invitación')
    } finally {
      setIsLoading(false)
    }
  }

  // Desactivar invitación
  async function toggleInvite(id: string, currentStatus: boolean) {
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      })

      const data = await res.json()

      if (data.success) {
        setInvites(invites.map(inv =>
          inv.id === id ? { ...inv, is_active: !currentStatus } : inv
        ))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Eliminar invitación
  async function deleteInvite(id: string) {
    if (!confirm('¿Eliminar este código de invitación?')) return

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()

      if (data.success) {
        setInvites(invites.filter(inv => inv.id !== id))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Verificar si expiró
  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  // Calcular tiempo restante
  function timeRemaining(expiresAt: string | null) {
    if (!expiresAt) return 'Sin expiración'
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expirado'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h restantes`
    return `${hours}h restantes`
  }

  // Stats
  const activeCount = invites.filter(i => i.is_active && !isExpired(i.expires_at)).length
  const totalUses = invites.reduce((sum, i) => sum + i.used_count, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-secondary rounded-xl p-4 border border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/20 rounded-lg">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-sm text-white/60">Códigos activos</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-secondary rounded-xl p-4 border border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/20 rounded-lg">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalUses}</p>
              <p className="text-sm text-white/60">Total registros</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-secondary rounded-xl p-4 border border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/20 rounded-lg">
              <Clock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{invites.length}</p>
              <p className="text-sm text-white/60">Total códigos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón crear */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            generateCode()
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-light transition"
        >
          <Plus size={18} />
          Nuevo código
        </button>
      </div>

      {/* Lista de invitaciones */}
      <div className="bg-dark-secondary rounded-xl border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left p-4 text-sm font-medium text-white/60">Código</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Estado</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Usos</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Expira</th>
                <th className="text-left p-4 text-sm font-medium text-white/60">Notas</th>
                <th className="text-right p-4 text-sm font-medium text-white/60">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const expired = isExpired(invite.expires_at)
                const usedUp = invite.used_count >= invite.max_uses
                const inactive = !invite.is_active || expired || usedUp

                return (
                  <tr
                    key={invite.id}
                    className={`border-b border-dark-border/50 ${inactive ? 'opacity-50' : ''}`}
                  >
                    <td className="p-4">
                      <code className="px-2 py-1 bg-white/10 rounded text-sm font-mono text-white">
                        {invite.code}
                      </code>
                    </td>
                    <td className="p-4">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-error/20 text-error rounded-full text-xs">
                          <AlertCircle size={12} /> Expirado
                        </span>
                      ) : usedUp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning/20 text-warning rounded-full text-xs">
                          <AlertCircle size={12} /> Agotado
                        </span>
                      ) : invite.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/20 text-success rounded-full text-xs">
                          <Check size={12} /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/60 rounded-full text-xs">
                          <X size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-white">{invite.used_count}</span>
                      <span className="text-white/50">/{invite.max_uses}</span>
                    </td>
                    <td className="p-4 text-sm text-white/60">
                      {timeRemaining(invite.expires_at)}
                    </td>
                    <td className="p-4 text-sm text-white/60 max-w-[200px] truncate">
                      {invite.notes || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyInviteLink(invite.code)}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
                          title="Copiar enlace"
                        >
                          {copiedCode === invite.code ? (
                            <Check size={16} className="text-success" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => toggleInvite(invite.id, invite.is_active)}
                          className={`p-2 rounded-lg transition ${
                            invite.is_active
                              ? 'text-warning hover:bg-warning/20'
                              : 'text-success hover:bg-success/20'
                          }`}
                          title={invite.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {invite.is_active ? <X size={16} /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => deleteInvite(invite.id)}
                          className="p-2 text-error hover:bg-error/20 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {invites.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/50">
                    No hay códigos de invitación. Crea el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-secondary rounded-xl p-6 w-full max-w-md mx-4 border border-dark-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nuevo código de invitación</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createInvite} className="space-y-4">
              {/* Código */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Código</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="N360-XXXXXX"
                    className="flex-1 px-4 py-2 bg-white/5 border border-dark-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition"
                  >
                    Generar
                  </button>
                </div>
              </div>

              {/* Expiración */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Expira en (horas)</label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value={24}>24 horas (1 día)</option>
                  <option value={48}>48 horas (2 días)</option>
                  <option value={72}>72 horas (3 días)</option>
                  <option value={168}>168 horas (7 días)</option>
                  <option value={720}>720 horas (30 días)</option>
                  <option value={0}>Sin expiración</option>
                </select>
              </div>

              {/* Máximo de usos */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Máximo de usos</label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  min={1}
                  max={10000}
                  className="w-full px-4 py-2 bg-white/5 border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Campaña Instagram enero"
                  className="w-full px-4 py-2 bg-white/5 border border-dark-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Preview del enlace */}
              {newCode && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-white/60 mb-1">Enlace de invitación:</p>
                  <code className="text-sm text-brand break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/login?invite={newCode}
                  </code>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newCode}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-light transition disabled:opacity-50"
                >
                  {isLoading ? 'Creando...' : 'Crear código'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
