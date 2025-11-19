'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
  variant?: 'default' | 'sidebar' | 'menu'
}

export function LogoutButton({ className, variant = 'default' }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error al cerrar sesión')
      }

      console.log('✅ Sesión cerrada, redirigiendo...')

      // Redirigir a homepage
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error)
      alert('Error al cerrar sesión. Por favor intenta de nuevo.')
      setIsLoggingOut(false)
    }
  }

  // Variante para sidebar (solo icono)
  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className || "w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition disabled:opacity-50"}
        title="Cerrar Sesión"
      >
        <LogOut className={`w-6 h-6 text-red-400 ${isLoggingOut ? 'animate-pulse' : ''}`} />
      </button>
    )
  }

  // Variante para menú dropdown
  if (variant === 'menu') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className || "w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"}
      >
        <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-pulse' : ''}`} />
        <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
      </button>
    )
  }

  // Variante default (botón normal)
  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className || "flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"}
    >
      <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-pulse' : ''}`} />
      <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
    </button>
  )
}
