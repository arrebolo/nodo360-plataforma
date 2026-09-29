'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Ban,
  CheckCircle,
  Trash2,
  ShieldAlert,
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
  // El email que hay que escribir para confirmar el borrado. Dos clics eran
  // poco para una accion que se lleva la cuenta y todo lo que cuelga de ella.
  const [emailEscrito, setEmailEscrito] = useState('')

  const normalizar = (v: string) => v.trim().toLowerCase()
  const emailConfirmado = normalizar(emailEscrito) === normalizar(user.email)
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
    // La guarda tambien aqui, no solo en el `disabled` del boton.
    if (!emailConfirmado) return

    setIsLoading(true)
    try {
      // El email viaja al servidor, que comprueba que corresponde a ESE id.
      // No es una barrera de seguridad —quien llama controla el cuerpo— sino un
      // enclavamiento contra el error: un id equivocado ya no borra a nadie.
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: emailEscrito.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        setShowDeleteModal(false)
        setEmailEscrito('')
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

  // Una cuenta de administracion no se suspende, no cambia de rol y no se borra
  // desde aqui. No es que los botones esten escondidos: es que la operacion esta
  // bloqueada en la BASE por el trigger de la 100, y lo estaria igual si alguien
  // llamara a la ruta a mano. Se dice, en vez de dejar un hueco sin explicacion.
  if (user.role === 'admin') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
            <ShieldAlert size={13} aria-hidden="true" />
            Cuenta protegida
          </span>
          <span
            className="text-xs text-gray-500"
            title="El cambio de rol, la suspension y el borrado estan bloqueados en la base de datos para las cuentas de administracion"
          >
            sin acciones disponibles
          </span>
        </div>
        <p className="text-[11px] leading-snug text-gray-500 max-w-xs">
          Suspender, cambiar el rol o borrar una cuenta de administración está
          bloqueado en la base de datos. Solo se puede desde el editor SQL, con el
          procedimiento de emergencia documentado.
        </p>
      </div>
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
          onClick={() => { setEmailEscrito(''); setShowDeleteModal(true) }}
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

            <p className="text-gray-400 mb-2">
              Para confirmar, escribe el email de la cuenta:
            </p>
            <p className="mb-3">
              <code className="text-white text-sm bg-white/5 px-2 py-1 rounded select-all">
                {user.email}
              </code>
            </p>
            <input
              type="email"
              value={emailEscrito}
              onChange={(e) => setEmailEscrito(e.target.value)}
              placeholder="Escribe el email para confirmar"
              autoComplete="off"
              spellCheck={false}
              aria-label="Email de la cuenta que se va a eliminar"
              aria-invalid={emailEscrito.length > 0 && !emailConfirmado}
              className={`w-full px-3 py-2 mb-2 rounded-lg bg-white/5 text-white placeholder-gray-500 border outline-none transition ${
                emailEscrito.length === 0
                  ? 'border-white/10 focus:border-white/30'
                  : emailConfirmado
                    ? 'border-green-500/50 focus:border-green-500'
                    : 'border-red-500/50 focus:border-red-500'
              }`}
            />
            <p className="text-xs mb-4 min-h-[1rem]" aria-live="polite">
              {emailEscrito.length === 0 ? (
                <span className="text-gray-500">El botón se activa cuando el email coincide.</span>
              ) : emailConfirmado ? (
                <span className="text-green-400">Coincide.</span>
              ) : (
                <span className="text-red-400">No coincide con la cuenta.</span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setEmailEscrito('') }}
                className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || !emailConfirmado}
                title={emailConfirmado ? undefined : 'Escribe el email de la cuenta para confirmar'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
