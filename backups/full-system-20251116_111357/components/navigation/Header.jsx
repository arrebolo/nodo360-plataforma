'use client'

import { useState, useEffect } from 'react'
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Inicio', isHome: true },
    { href: '#cursos', label: 'Cursos', section: 'cursos' },
    { href: '#comunidad', label: 'Comunidad', section: 'comunidad' },
    { href: '#proyectos', label: 'Proyectos', section: 'proyectos' },
  ]

  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href) && !href.startsWith('#')
  }

  const handleNavClick = (e, link) => {
    if (link.section && pathname === '/') {
      e.preventDefault()
      const element = document.getElementById(link.section)
      if (element) {
        const offset = 80 // Height of fixed header
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
      setIsMobileMenuOpen(false)
    } else if (link.section) {
      // If not on homepage, navigate to homepage with hash
      window.location.href = `/${link.href}`
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/95 backdrop-blur-sm shadow-lg shadow-black/20' : 'bg-black'
    }`}>
      <div className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center mr-12">
              <Logo size="sm" showText href="/" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`text-base font-semibold transition-all duration-300 relative group cursor-pointer ${
                    isActive(link.href)
                      ? 'text-[#ff6b35]'
                      : 'text-white/90 hover:text-[#ff6b35] hover:scale-105'
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] transition-all duration-300 ${
                    isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </a>
              ))}
            </div>

            {/* SearchBar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-6">
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
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-base font-semibold text-white/90 hover:text-white transition-colors px-4 py-2"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="text-base font-semibold bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:from-[#f7931a] hover:to-[#ff6b35] text-white px-6 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-[#ff6b35]/30 hover:-translate-y-0.5"
              >
                Empezar Gratis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white transition-colors p-2"
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
            <div className="md:hidden py-4 border-t border-gray-800">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link)}
                    className={`text-base font-semibold transition-all duration-300 py-3 px-2 rounded-lg cursor-pointer block ${
                      isActive(link.href)
                        ? 'text-[#ff6b35] bg-[#ff6b35]/10'
                        : 'text-white/90 hover:text-[#ff6b35] hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-semibold text-center text-white/90 hover:text-white transition-colors py-3"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/registro"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-semibold text-center bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:from-[#f7931a] hover:to-[#ff6b35] text-white px-5 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-[#ff6b35]/30"
                  >
                    Empezar Gratis
                  </Link>
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
