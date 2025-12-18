'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Settings, ChevronDown, User } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'

interface DashboardButtonProps {
  isAuthenticated: boolean
  userRole?: string | null
  userName?: string | null
  userAvatar?: string | null
}

export function DashboardButton({ isAuthenticated, userRole, userName, userAvatar }: DashboardButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="px-8 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-[#ff6b35]/50 transition-all"
      >
        Iniciar Sesión
      </Link>
    )
  }

  const isAdmin = userRole === 'admin' || userRole === 'instructor'
  const dashboardUrl = isAdmin ? '/admin/cursos' : '/dashboard'
  const dashboardLabel = isAdmin ? 'Panel Admin' : 'Mi Dashboard'
  const Icon = isAdmin ? Settings : LayoutDashboard
  const firstName = userName?.split(' ')[0] || 'Usuario'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#ff6b35]/50 transition-all"
      >
        {userAvatar ? (
          <Image
            src={userAvatar}
            alt={firstName}
            width={40}
            height={40}
            className="rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-xs text-white/60 leading-tight">
            Hola, {firstName}
          </span>
          <span className="text-sm font-semibold text-white leading-tight">
            {dashboardLabel}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Info del usuario */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={firstName}
                  width={48}
                  height={48}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-semibold">{userName}</p>
                <p className="text-xs text-white/60 capitalize">{userRole || 'Usuario'}</p>
              </div>
            </div>
          </div>

          {/* Links del menú */}
          <div className="py-2">
            {/* Mi Perfil - PRIMERO - SIEMPRE VISIBLE */}
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-white transition ${
                pathname === '/perfil'
                  ? 'bg-[#00C98D]/10 border-l-2 border-[#00C98D]'
                  : 'hover:bg-white/5'
              }`}
            >
              <User className="w-5 h-5 text-[#00C98D]" />
              <span>Mi Perfil</span>
            </Link>

            {/* Dashboard - SEGUNDO - SIEMPRE VISIBLE */}
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-white transition ${
                pathname === '/dashboard'
                  ? 'bg-[#24D4FF]/10 border-l-2 border-[#24D4FF]'
                  : 'hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 text-[#24D4FF]" />
              <span>Dashboard</span>
            </Link>

            {/* Panel Admin - TERCERO - SOLO PARA ADMINS */}
            {isAdmin && (
              <Link
                href="/admin/cursos"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-white transition ${
                  pathname === '/admin/cursos' || pathname.startsWith('/admin')
                    ? 'bg-[#9146ff]/10 border-l-2 border-[#9146ff]'
                    : 'hover:bg-white/5'
                }`}
              >
                <Settings className="w-5 h-5 text-[#9146ff]" />
                <span>Panel Admin</span>
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-white/10">
            <LogoutButton variant="menu" />
          </div>
        </div>
      )}
    </div>
  )
}
