'use client'

import { useUser } from '@/hooks/useUser'
import { User, Mail, Calendar } from 'lucide-react'

export default function PerfilPage() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#ff6b35] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Debes iniciar sesión para ver tu perfil.</p>
      </div>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
  const avatarUrl = user.user_metadata?.avatar_url
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Mi Perfil</h1>

      {/* Avatar y nombre */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/20">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">{displayName}</h2>
            <p className="text-white/50 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Información */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Información de la cuenta</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white/70">
            <User className="w-5 h-5 text-white/40" />
            <span className="text-sm">Nombre:</span>
            <span className="text-white">{displayName}</span>
          </div>

          <div className="flex items-center gap-3 text-white/70">
            <Mail className="w-5 h-5 text-white/40" />
            <span className="text-sm">Email:</span>
            <span className="text-white">{user.email}</span>
          </div>

          <div className="flex items-center gap-3 text-white/70">
            <Calendar className="w-5 h-5 text-white/40" />
            <span className="text-sm">Miembro desde:</span>
            <span className="text-white">
              {new Date(user.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
