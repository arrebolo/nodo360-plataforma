'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  User,
  Settings,
  LogOut,
  BookOpen,
  Award,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react'

interface UserMenuProps {
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/')
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const avatarUrl = user?.user_metadata?.avatar_url
  const initials = displayName.charAt(0).toUpperCase()

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/perfil', label: 'Mi Perfil', icon: User },
    { href: '/cursos', label: 'Mis Cursos', icon: BookOpen },
    { href: '/dashboard/certificados', label: 'Certificados', icon: Award },
    { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón del menú */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all w-full"
      >
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-orange-500/20">
            {initials}
          </div>
        )}

        {/* Nombre */}
        <div className="flex-1 text-left min-w-0">
          <span className="block text-sm text-white font-medium truncate">
            {displayName}
          </span>
          <span className="block text-xs text-white/50 truncate">
            {user?.email}
          </span>
        </div>

        {/* Flecha */}
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-[#0f1419] border border-white/10 shadow-xl shadow-black/50 py-2 z-50 animate-fade-in">
          {/* Enlaces */}
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <item.icon className="w-4 h-4 text-white/50" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Cerrar sesión */}
          <div className="border-t border-white/10 pt-1 mt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
