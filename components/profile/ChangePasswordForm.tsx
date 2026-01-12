'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface ChangePasswordFormProps {
  userEmail: string
}

export function ChangePasswordForm({ userEmail }: ChangePasswordFormProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const isValid =
    currentPassword.length >= 6 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Primero verificar la contraseña actual haciendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta')
      }

      // Actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw new Error(updateError.message || 'Error al actualizar la contraseña')
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Redirigir al perfil después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/perfil')
      }, 2000)

    } catch (err) {
      console.error('Error changing password:', err)
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensajes de feedback */}
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm">
          Contraseña actualizada correctamente. Redirigiendo...
        </div>
      )}

      <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 space-y-5">
        {/* Contraseña actual */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Contraseña actual
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                         placeholder:text-white/40 focus:outline-none focus:border-brand-light/50
                         focus:ring-1 focus:ring-brand-light/50 transition pr-12"
            />
          </div>
        </div>

        {/* Nueva contraseña */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Nueva contraseña
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white
                       placeholder:text-white/40 focus:outline-none transition
                       ${newPassword && newPassword === currentPassword
                         ? 'border-error focus:border-error'
                         : 'border-white/10 focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/50'
                       }`}
          />
          {newPassword && newPassword === currentPassword && (
            <p className="mt-1 text-sm text-error">
              La nueva contraseña debe ser diferente a la actual
            </p>
          )}
          {newPassword && newPassword.length < 6 && (
            <p className="mt-1 text-sm text-warning">
              Mínimo 6 caracteres
            </p>
          )}
        </div>

        {/* Confirmar nueva contraseña */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Confirmar nueva contraseña
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
            required
            minLength={6}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white
                       placeholder:text-white/40 focus:outline-none transition
                       ${confirmPassword && confirmPassword !== newPassword
                         ? 'border-error focus:border-error'
                         : 'border-white/10 focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/50'
                       }`}
          />
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="mt-1 text-sm text-error">
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        {/* Toggle mostrar contraseñas */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="w-4 h-4 rounded bg-white/5 border-white/20 text-brand-light
                       focus:ring-brand-light/50 focus:ring-offset-0"
          />
          <span className="text-sm text-white/60">Mostrar contraseñas</span>
        </label>
      </div>

      {/* Requisitos de contraseña */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h4 className="text-sm font-medium text-white/80 mb-2">Requisitos:</h4>
        <ul className="text-sm text-white/50 space-y-1">
          <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-success' : ''}`}>
            <span>{newPassword.length >= 6 ? '✓' : '○'}</span>
            Mínimo 6 caracteres
          </li>
          <li className={`flex items-center gap-2 ${newPassword !== currentPassword && newPassword ? 'text-success' : ''}`}>
            <span>{newPassword !== currentPassword && newPassword ? '✓' : '○'}</span>
            Diferente a la contraseña actual
          </li>
          <li className={`flex items-center gap-2 ${confirmPassword === newPassword && confirmPassword ? 'text-success' : ''}`}>
            <span>{confirmPassword === newPassword && confirmPassword ? '✓' : '○'}</span>
            Confirmación coincide
          </li>
        </ul>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || saving}
          loading={saving}
          className="flex-1"
        >
          {saving ? 'Guardando...' : 'Cambiar Contraseña'}
        </Button>
      </div>
    </form>
  )
}
