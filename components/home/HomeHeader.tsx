'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { brandConfig } from '@/lib/brand-config'

const navLinks = [
  { href: '/dashboard/rutas', label: 'Rutas' },
  { href: '/cursos', label: 'Cursos' },
  { href: '/comunidad', label: 'Comunidad' },
  { href: '/mentoria', label: 'Mentoría' },
]

export function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-dark/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
              <Image
                src={brandConfig.logo.url}
                alt={brandConfig.logo.alt}
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-white font-bold text-xl group-hover:text-brand-light transition-colors">
              {brandConfig.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login?mode=register"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-90 transition-opacity"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <Link
                href="/login"
                className="block px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/login?mode=register"
                className="block mx-4 text-center rounded-lg font-medium py-3 text-sm text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-90 transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
