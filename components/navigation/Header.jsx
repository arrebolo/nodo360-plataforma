'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Logo } from '@/components/common'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchModal } from '@/components/search/SearchModal'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Enlaces de navegación a rutas reales
  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/cursos', label: 'Cursos' },
    { href: '/comunidad', label: 'Comunidad' },
    { href: '/proyectos', label: 'Proyectos' },
    { href: '/mentoria', label: 'Mentoría' },
  ]

  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Barra superior glass / hairline */}
      <div
        className={[
          'transition-all duration-300',
          // Estado normal: glass suave
          'bg-[rgba(0,0,0,0.35)] backdrop-blur-[length:var(--glass-blur)]',
          'border-b border-[rgba(255,255,255,0.10)]',
          // Estado scrolled: un poco más sólido y con sombra
          isScrolled ? 'bg-[rgba(0,0,0,0.70)] shadow-[0_10px_30px_rgba(0,0,0,0.35)]' : '',
        ].join(' ')}
      >
        <nav className="mx-auto w-full max-w-6xl px-5">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center">
              <Logo size="sm" showText href="/" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    'text-sm font-semibold transition-all duration-200 relative group',
                    'text-white/80 hover:text-white',
                    isActive(link.href) ? 'text-[color:var(--accent-btc)]' : '',
                  ].join(' ')}
                >
                  {link.label}
                  {/* underline Web3 */}
                  <span
                    className={[
                      'absolute -bottom-1 left-0 h-[2px] rounded-full',
                      'bg-[linear-gradient(90deg,var(--accent-btc),var(--accent-btc-strong))]',
                      'transition-all duration-200',
                      isActive(link.href) ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100',
                    ].join(' ')}
                  />
                </Link>
              ))}
            </div>

            {/* SearchBar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            {/* Search Button - Mobile */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="md:hidden text-white/70 hover:text-white transition-colors p-2"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* CTA Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="n360-btn n360-btn-secondary !py-2.5 !px-4 text-sm"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/registro"
                className="n360-btn n360-btn-primary !py-2.5 !px-4 text-sm"
              >
                Empezar gratis
                <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="md:hidden text-white/75 hover:text-white transition-colors p-2"
              aria-label="Abrir menú"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 pt-3">
              <div className="n360-glass p-3">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={[
                        'rounded-xl px-3 py-3 text-sm font-semibold transition-colors',
                        isActive(link.href)
                          ? 'text-[color:var(--accent-btc)] bg-[rgba(247,147,26,0.10)]'
                          : 'text-white/85 hover:text-white hover:bg-white/5',
                      ].join(' ')}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="mt-2 pt-3 border-t border-[rgba(255,255,255,0.10)] flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="n360-btn n360-btn-secondary w-full"
                    >
                      Iniciar sesión
                    </Link>

                    <Link
                      href="/registro"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="n360-btn n360-btn-primary w-full"
                    >
                      Empezar gratis
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Search Modal for Mobile */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </header>
  )
}
