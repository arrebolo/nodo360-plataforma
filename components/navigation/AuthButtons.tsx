'use client'

import Link from 'next/link'
import { LogIn, UserPlus } from 'lucide-react'

interface AuthButtonsProps {
  variant?: 'default' | 'sidebar' | 'compact'
}

export function AuthButtons({ variant = 'default' }: AuthButtonsProps) {
  if (variant === 'sidebar') {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <LogIn className="w-4 h-4" />
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Crear cuenta
        </Link>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/registro"
          className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-lg hover:opacity-90 transition-opacity"
        >
          Registrarse
        </Link>
      </div>
    )
  }

  // Default variant
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/registro"
        className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
      >
        Crear cuenta gratis
      </Link>
    </div>
  )
}
