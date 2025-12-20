'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  FileText,
  Menu,
  X,
  LogOut,
  Home,
  Award,
  MessageSquare,
  CreditCard
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const adminNavSections = [
  {
    title: 'General',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'Contenido',
    items: [
      { href: '/admin/cursos', label: 'Cursos', icon: BookOpen },
      { href: '/admin/lecciones', label: 'Lecciones', icon: FileText },
      { href: '/admin/certificados', label: 'Certificados', icon: Award },
    ]
  },
  {
    title: 'Usuarios',
    items: [
      { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
      { href: '/admin/mensajes', label: 'Mensajes', icon: MessageSquare },
      { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    ]
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user } = useUser()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase/client')
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = isActive(href)

    return (
      <Link
        href={href}
        onClick={() => setIsMobileOpen(false)}
        className={[
          'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200',
          active
            ? 'bg-[#ff6b35] text-white shadow-lg shadow-orange-500/20'
            : 'text-white/60 hover:text-white hover:bg-white/10',
        ].join(' ')}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
      </Link>
    )
  }

  const NavContent = () => (
    <nav className="flex flex-col gap-6 p-4">
      {adminNavSections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-4 mb-2">
            {section.title}
          </p>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  const UserSection = () => (
    <div className="p-4 border-t border-white/10">
      {/* Info del admin */}
      <div className="flex items-center gap-3 px-4 py-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold">
          {user?.email?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {user?.user_metadata?.full_name || 'Admin'}
          </p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Ir al sitio
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#ff6b35] text-white shadow-lg shadow-orange-500/30"
        aria-label="Abrir menú admin"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed top-0 left-0 bottom-0 bg-[#0a0a0a] border-r border-white/10">
        {/* Logo Admin */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">NODO360</span>
              <p className="text-[#ff6b35] text-xs font-medium">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto">
          <NavContent />
        </div>

        {/* User Section */}
        <UserSection />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />

          <aside className="absolute top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/10 flex flex-col animate-slide-in">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <Link href="/admin" className="flex items-center gap-3" onClick={() => setIsMobileOpen(false)}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <div>
                  <span className="text-white font-bold">NODO360</span>
                  <p className="text-[#ff6b35] text-xs font-medium">Admin</p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 overflow-y-auto">
              <NavContent />
            </div>

            <UserSection />
          </aside>
        </div>
      )}
    </>
  )
}
