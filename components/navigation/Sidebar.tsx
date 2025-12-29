'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Users,
  Rocket,
  MessageCircle,
  LayoutDashboard,
  GraduationCap,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/comunidad', label: 'Comunidad', icon: Users },
  { href: '/proyectos', label: 'Proyectos', icon: Rocket },
  { href: '/mentoria', label: 'Mentoría', icon: GraduationCap },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              'hover:bg-white/10',
              active
                ? 'bg-gradient-to-r from-[#ff6b35]/20 to-[#f7931a]/20 border border-[#ff6b35]/30 text-[#ff6b35]'
                : 'text-white/70 hover:text-white',
            ].join(' ')}
          >
            <Icon className={[
              'w-5 h-5 transition-colors',
              active ? 'text-[#ff6b35]' : 'text-white/50'
            ].join(' ')} />
            <span className="font-medium text-sm">{item.label}</span>
            {active && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-black/80 border border-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:border-[#ff6b35]/50 transition-all"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-black/50 border-r border-white/10 backdrop-blur-sm">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">NODO360</span>
              <p className="text-white/40 text-xs">Educación Web3</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          <NavContent />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#ff6b35]/10 to-[#f7931a]/10 border border-[#ff6b35]/20">
            <p className="text-white/80 text-sm font-medium mb-2">¿Listo para aprender?</p>
            <p className="text-white/50 text-xs mb-3">Accede a todos los cursos premium</p>
            <Link
              href="/cursos?filter=premium"
              className="block w-full py-2 px-4 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white text-sm font-semibold text-center hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all"
            >
              Ver Premium
            </Link>
          </div>
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
          <aside className="absolute top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/10 animate-slide-in">
            {/* Header with close button */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileOpen(false)}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
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
            <div className="py-4">
              <NavContent />
            </div>

            {/* CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0a0a0a]">
              <Link
                href="/cursos?filter=premium"
                onClick={() => setIsMobileOpen(false)}
                className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold text-center hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all"
              >
                Ver Cursos Premium
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
