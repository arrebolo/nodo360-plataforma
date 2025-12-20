'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cursos', label: 'Mis Cursos', icon: BookOpen },
  { href: '/mentoria', label: 'Mentoría', icon: GraduationCap },
  { href: '/dashboard/certificados', label: 'Certificados', icon: Award },
]

const bottomNavItems = [
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, loading } = useUser()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase/client')
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const initials = displayName.charAt(0).toUpperCase()

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        onClick={() => setIsMobileOpen(false)}
        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? 'bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-accent)] rounded-full" />
        )}
        <Icon className={`w-5 h-5 ${active ? 'text-[var(--color-accent)]' : ''}`} />
        <span>{label}</span>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-[var(--color-border-default)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-[var(--shadow-accent)]">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div>
            <span className="text-[var(--color-text-primary)] font-bold text-lg block">NODO360</span>
            <span className="text-[var(--color-text-muted)] text-xs">Plataforma de Aprendizaje</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-[var(--color-border-default)] space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-[var(--color-border-default)]">
        {loading ? (
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-[var(--color-bg-elevated)] rounded animate-pulse" />
              <div className="h-3 w-32 bg-[var(--color-bg-elevated)] rounded animate-pulse" />
            </div>
          </div>
        ) : user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{displayName}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-[var(--shadow-lg)]">
                <Link
                  href="/dashboard/perfil"
                  onClick={() => { setIsUserMenuOpen(false); setIsMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-overlay)] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mi Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="btn btn-primary w-full"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] shadow-[var(--shadow-md)] transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed top-0 left-0 bottom-0 bg-[var(--color-bg-surface)] border-r border-[var(--color-border-default)]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-72 bg-[var(--color-bg-surface)] border-r border-[var(--color-border-default)] animate-slide-in">
            {/* Close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
