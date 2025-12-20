'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Menu, X } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

type NavItem = {
  label: string
  href: string
  match?: 'exact' | 'startsWith'
}

const NAV_LINKS: NavItem[] = [
  { label: 'Cursos', href: '/cursos', match: 'startsWith' },
  { label: 'Rutas', href: '/rutas', match: 'startsWith' },
  { label: 'Comunidad', href: '/comunidad', match: 'startsWith' },
  { label: 'Nosotros', href: '/sobre-nosotros', match: 'startsWith' },
]

function isActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false
  const mode = item.match || 'exact'
  if (mode === 'exact') return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

export function PublicHeader() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, loading } = useUser()

  const activeHref = useMemo(() => {
    const found = NAV_LINKS.find((item) => isActive(pathname, item))
    return found?.href || null
  }, [pathname])

  // Hide on auth pages
  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/registro') ||
    pathname?.startsWith('/recuperar') ||
    pathname?.startsWith('/restablecer')
  ) {
    return null
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070a10]/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white font-semibold tracking-wide hidden sm:block">
              NODO360
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const active = item.href === activeHref
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a]" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 rounded-xl bg-white/5 animate-pulse" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-sm font-medium text-neutral-400 hover:text-white transition-colors px-3 py-2"
                >
                  Acceder
                </Link>
                <Link
                  href="/registro"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
                >
                  Empezar gratis
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              aria-label={isMobileOpen ? 'Cerrar menu' : 'Abrir menu'}
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#070a10]/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-2">
            {NAV_LINKS.map((item) => {
              const active = isActive(pathname, item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            {/* Mobile CTAs */}
            {!loading && !user && (
              <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-center text-neutral-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Acceder
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:opacity-90 transition-opacity"
                >
                  Empezar
                </Link>
              </div>
            )}

            {/* Mobile Dashboard link for logged in users */}
            {!loading && user && (
              <div className="pt-4 mt-4 border-t border-white/10">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:opacity-90 transition-opacity"
                >
                  Ir al Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
