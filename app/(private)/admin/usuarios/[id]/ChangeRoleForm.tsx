'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChangeRoleFormProps {
  userId: string
  currentRole: string
}

const ROLES = [
  {
    value: 'student',
    label: 'Estudiante',
    description: 'Usuario estándar de la plataforma',
    color: 'bg-gray-500',
    level: 1
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'Puede crear y gestionar cursos',
    color: 'bg-blue-500',
    level: 2
  },
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'Guía estudiantes, privilegios especiales',
    color: 'bg-purple-500',
    level: 3
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Control total del sistema',
    color: 'bg-red-500',
    level: 4
  },
]

export default function ChangeRoleForm({ userId, currentRole }: ChangeRoleFormProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedRole === currentRole) {
      setMessage({ type: 'error', text: 'Selecciona un rol diferente' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Error al cambiar rol')
      }

      setMessage({ type: 'success', text: 'Rol actualizado correctamente' })
      router.refresh()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al cambiar rol'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentRoleInfo = ROLES.find(r => r.value === currentRole)
  const selectedRoleInfo = ROLES.find(r => r.value === selectedRole)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rol actual */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <span>Rol actual:</span>
        <span className={`px-2 py-0.5 rounded text-white text-xs ${currentRoleInfo?.color || 'bg-gray-500'}`}>
          {currentRoleInfo?.label || currentRole}
        </span>
      </div>

      {/* Selector de roles con cards */}
      <div className="grid grid-cols-1 gap-2">
        {ROLES.map((role) => (
          <label
            key={role.value}
            className={`
              flex items-center gap-3 p-3 rounded-lg cursor-pointer
              border-2 transition-all duration-200
              ${selectedRole === role.value
                ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
              }
            `}
          >
            <input
              type="radio"
              name="role"
              value={role.value}
              checked={selectedRole === role.value}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="sr-only"
            />

            {/* Indicador de color */}
            <div className={`w-3 h-3 rounded-full ${role.color}`} />

            {/* Info del rol */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{role.label}</span>
                <span className="text-xs text-gray-500">Nivel {role.level}</span>
              </div>
              <p className="text-xs text-gray-400">{role.description}</p>
            </div>

            {/* Checkmark si está seleccionado */}
            {selectedRole === role.value && (
              <svg className="w-5 h-5 text-[#ff6b35]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </label>
        ))}
      </div>

      {/* Mensaje */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Botón */}
      <button
        type="submit"
        disabled={isLoading || selectedRole === currentRole}
        className={`
          w-full py-2.5 px-4 rounded-lg font-medium transition-all
          ${selectedRole === currentRole
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-[#ff6b35] hover:bg-[#ff6b35]/80 text-white'
          }
          disabled:opacity-50
        `}
      >
        {isLoading ? 'Guardando...' : 'Cambiar Rol'}
      </button>
    </form>
  )
}
