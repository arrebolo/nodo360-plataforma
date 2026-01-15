'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Ban,
  CheckCircle,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  is_suspended?: boolean
  suspended_reason?: string | null
}

interface Props {
  user: User
}

export function UserManagementActions({ user }: Props) {
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSuspend() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend',
          reason: suspendReason
        }),
      })

      const data = await res.json()

      if (data.success) {
        setShowSuspendModal(false)
        setSuspendReason('')
        router.refresh()
      } else {
        alert(data.error || 'Error al suspender usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al suspender usuario')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReactivate() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      })

      const data = await res.json()

      if (data.success) {
        router.refresh()
      } else {
        alert(data.error || 'Error al reactivar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al reactivar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        setShowDeleteModal(false)
        router.push('/admin/usuarios')
        router.refresh()
      } else {
        alert(data.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  // No mostrar acciones para admins
  if (user.role === 'admin') {
    return (
      <span className="text-xs text-gray-500 italic">
        Administrador
      </span>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {user.is_suspended ? (
          <button
            onClick={handleReactivate}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
            title="Reactivar cuenta"
          >
            <CheckCircle size={14} />
            Reactivar
          </button>
        ) : (
          <button
            onClick={() => setShowSuspendModal(true)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition disabled:opacity-50"
            title="Suspender cuenta"
          >
            <Ban size={14} />
            Suspender
          </button>
        )}

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50"
          title="Eliminar cuenta"
        >
          <Trash2 size={14} />
          Eliminar
        </button>
      </div>

      {/* Modal Suspender */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-dark-surface rounded-xl p-6 w-full max-w-md mx-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ban className="text-yellow-500" size={20} />
                Suspender Usuario
              </h3>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-400 mb-4">
              ¿Suspender la cuenta de <strong className="text-white">{user.email}</strong>?
            </p>

            <p className="text-sm text-gray-500 mb-4">
              El usuario no podrá acceder a la plataforma hasta que reactives su cuenta.
            </p>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Ej: Violación de términos de servicio"
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSuspend}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Suspendiendo...' : 'Suspender'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-dark-surface rounded-xl p-6 w-full max-w-md mx-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                Eliminar Usuario
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
              <p className="text-red-400 text-sm">
                <strong>Esta acción es irreversible.</strong>
              </p>
              <p className="text-red-400/80 text-sm mt-1">
                Se eliminarán permanentemente:
              </p>
              <ul className="text-red-400/80 text-sm mt-2 list-disc list-inside">
                <li>La cuenta del usuario</li>
                <li>Todo su progreso en cursos</li>
                <li>Sus certificados</li>
                <li>Sus notas y bookmarks</li>
              </ul>
            </div>

            <p className="text-gray-400 mb-4">
              ¿Eliminar permanentemente a <strong className="text-white">{user.email}</strong>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Eliminando...' : 'Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
