'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Bell, User, Settings, LogOut, BookOpen, Award, LayoutDashboard } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { UserMenu } from './UserMenu'
import { AuthButtons } from './AuthButtons'

export function TopHeader() {
  const pathname = usePathname()
  const { user, loading } = useUser()

  // Ocultar en páginas de auth
  if (pathname?.startsWith('/login') || pathname?.startsWith('/registro') || pathname?.startsWith('/recuperar') || pathname?.startsWith('/restablecer')) {
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#070a10]/90 backdrop-blur-xl border-b border-white/10">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Spacer para el sidebar en desktop */}
        <div className="hidden lg:block w-64" />

        {/* Logo en móvil (centrado) */}
        <Link href="/" className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white font-bold">N</span>
          </div>
          <span className="text-white font-semibold text-lg">NODO360</span>
        </Link>

        {/* Barra de búsqueda central (desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar cursos, lecciones..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-1 focus:ring-[#ff6b35]/20 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-white/30 bg-white/5 rounded border border-white/10">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Acciones - Derecha */}
        <div className="flex items-center gap-3">
          {/* Botón búsqueda móvil */}
          <button className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Notificaciones (solo si hay usuario) */}
          {user && (
            <button className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {/* Indicador de notificación */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff6b35] rounded-full" />
            </button>
          )}

          {/* Menú de usuario o botones de auth */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <UserMenuCompact user={user} />
          ) : (
            <AuthButtons variant="compact" />
          )}
        </div>
      </div>
    </header>
  )
}

// Versión compacta del UserMenu para el header
function UserMenuCompact({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
    const { supabase } = await import('@/lib/supabase/client')
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/')
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const avatarUrl = user?.user_metadata?.avatar_url
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f1419] border border-white/10 shadow-xl shadow-black/50 py-2 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>

          {/* Enlaces */}
          <div className="py-1">
            <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsOpen(false)} />
            <MenuLink href="/dashboard/perfil" icon={User} label="Mi Perfil" onClick={() => setIsOpen(false)} />
            <MenuLink href="/cursos" icon={BookOpen} label="Mis Cursos" onClick={() => setIsOpen(false)} />
            <MenuLink href="/dashboard/certificados" icon={Award} label="Certificados" onClick={() => setIsOpen(false)} />
            <MenuLink href="/dashboard/configuracion" icon={Settings} label="Configuración" onClick={() => setIsOpen(false)} />
          </div>

          {/* Logout */}
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

function MenuLink({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
    >
      <Icon className="w-4 h-4 text-white/50" />
      {label}
    </Link>
  )
}
