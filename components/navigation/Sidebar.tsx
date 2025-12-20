'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Users,
  Rocket,
  GraduationCap,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

// Navegación agrupada por secciones
const navSections = [
  {
    title: 'Principal',
    items: [
      { href: '/', label: 'Inicio', icon: Home },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Aprender',
    items: [
      { href: '/cursos', label: 'Cursos', icon: BookOpen },
      { href: '/mentoria', label: 'Mentoría', icon: GraduationCap },
    ]
  },
  {
    title: 'Construir',
    items: [
      { href: '/proyectos', label: 'Proyectos', icon: Rocket },
      { href: '/comunidad', label: 'Comunidad', icon: Users },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = isActive(href)

    return (
      <Link
        href={href}
        onClick={() => setIsMobileOpen(false)}
        className={[
          'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          'hover:bg-white/10',
          active
            ? 'bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-6 before:bg-gradient-to-b before:from-[#ff6b35] before:to-[#f7931a] before:rounded-full before:shadow-[0_0_8px_rgba(255,107,53,0.5)]'
            : 'text-white/60 hover:text-white',
        ].join(' ')}
      >
        <Icon className={[
          'w-5 h-5 transition-colors',
          active ? 'text-[#ff6b35]' : 'text-white/50'
        ].join(' ')} />
        <span className="font-medium text-sm">{label}</span>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff6b35] shadow-[0_0_6px_rgba(255,107,53,0.6)]" />
        )}
      </Link>
    )
  }

  const NavContent = () => (
    <nav className="flex flex-col gap-6 p-3">
      {navSections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider px-4 mb-2">
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

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-black/90 border border-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:border-[#ff6b35]/50 transition-all shadow-lg"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0a0a0a]/80 border-r border-white/10 backdrop-blur-md">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">NODO360</span>
              <p className="text-white/40 text-xs">Educación Web3</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/10 animate-slide-in flex flex-col">
            {/* Header with close button */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileOpen(false)}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <span className="text-white font-bold text-lg">NODO360</span>
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 overflow-y-auto">
              <NavContent />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
