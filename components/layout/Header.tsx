'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/common/Logo'
import { Menu, X, Settings, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading } = useUser()

  const navLinks = [
    { href: '/cursos', label: 'Cursos' },
    { href: '/gobernanza', label: 'Gobernanza' },
    { href: '/comunidad', label: 'Comunidad' },
    { href: '/proyectos', label: 'Proyectos' },
    { href: '/mentoria', label: 'Mentoría' },
  ]

  const isActive = (href: string) => {
    if (href === '/cursos') {
      return pathname?.startsWith('/cursos')
    }
    return pathname === href
  }

  const getInitial = (name: string | null) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  const getFirstName = (fullName: string | null) => {
    if (!fullName) return 'Usuario'
    return fullName.split(' ')[0]
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'instructor'
  const dashboardUrl = isAdmin ? '/admin/cursos' : '/dashboard'
  const dashboardLabel = isAdmin ? 'Panel Admin' : 'Mi Dashboard'

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label="Nodo360 Home">
            <Logo size="sm" showText priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-[#ff6b35]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Dashboard Button */}
          <div className="hidden md:block">
            {loading ? (
              <div className="w-32 h-10 bg-white/5 rounded-lg animate-pulse" />
            ) : user ? (
              <Link
                href={dashboardUrl}
                className="group flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#ff6b35]/50 hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold text-sm">
                  {getInitial(user.full_name)}
                </div>

                {/* Text */}
                <div className="flex flex-col">
                  <span className="text-xs text-white/50">Hola, {getFirstName(user.full_name)}</span>
                  <span className="text-sm font-semibold text-white group-hover:text-[#ff6b35] transition-colors">
                    {dashboardLabel}
                  </span>
                </div>

                {/* Icon */}
                {isAdmin ? (
                  <Settings className="w-4 h-4 text-white/50 group-hover:text-[#ff6b35] group-hover:rotate-90 transition-all" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-[#ff6b35] group-hover:translate-x-1 transition-all" />
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-[#ff6b35]/50 hover:scale-105 transition-all"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Mobile Dashboard Button */}
          <div className="md:hidden flex items-center gap-2">
            {loading ? (
              <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse" />
            ) : user ? (
              <Link
                href={dashboardUrl}
                className="group flex items-center gap-2 px-2 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#ff6b35]/50 transition-all"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold text-sm">
                  {getInitial(user.full_name)}
                </div>

                {/* Icon */}
                {isAdmin ? (
                  <Settings className="w-4 h-4 text-white/50 group-hover:text-[#ff6b35] transition-colors" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-[#ff6b35] transition-colors" />
                )}
              </Link>
            ) : null}

            {/* Mobile menu button */}
            <button
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-[#ff6b35]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!loading && !user && (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold text-center rounded-lg hover:shadow-xl hover:shadow-[#ff6b35]/50 transition-all"
                >
                  Iniciar Sesión
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
