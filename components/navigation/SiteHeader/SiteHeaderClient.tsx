'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ChevronDown, LogOut } from 'lucide-react'
import { NotificationBell } from '@/components/notifications'
import { brandConfig } from '@/lib/brand-config'

type Role = 'student' | 'instructor' | 'mentor' | 'admin'

interface Props {
  isAuthed: boolean
  userName?: string
  userEmail?: string
  role?: Role
  avatarUrl?: string | null
}

const navLinks = [
  { href: '/rutas', label: 'Rutas' },
  { href: '/cursos', label: 'Cursos' },
  { href: '/comunidad', label: 'Comunidad' },
  { href: '/mentoria', label: 'Mentoría' },
]

export default function SiteHeaderClient({
  isAuthed,
  userName,
  userEmail,
  role,
  avatarUrl,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menu = buildMenu(role)
  const initials = userName?.[0]?.toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-dark/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
            <Image
              src={brandConfig.logo.url}
              alt={brandConfig.logo.alt}
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-brand-light transition-colors">
            {brandConfig.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
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

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthed ? (
            <>
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
            </>
          ) : (
            <>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10
                           hover:bg-white/10 transition text-white"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label="Menú de usuario"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-brand-light/20 flex items-center justify-center">
                    <span className="text-brand-light text-sm font-medium" aria-hidden="true">{initials}</span>
                  </div>
                )}
                <span className="max-w-[100px] truncate text-sm font-medium">{userName}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-dark-surface shadow-xl shadow-black/20 z-50 overflow-hidden"
                    role="menu"
                    aria-label="Opciones de usuario"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">{userName}</p>
                      <p className="text-xs text-white/50 truncate">{userEmail}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-brand-light/20 text-brand-light capitalize">
                        {role}
                      </span>
                    </div>

                    {/* Menu Items */}
                    <ul className="py-2">
                      {menu.map((item) => (
                        <li key={item.href} role="none">
                          <Link
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition"
                            role="menuitem"
                          >
                            <span className="w-5 text-center" aria-hidden="true">{item.icon}</span>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* Logout */}
                    <div className="border-t border-white/10 py-2">
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          window.location.href = '/api/auth/logout'
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-dark">
          <nav className="flex flex-col px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-white/70 hover:text-white border-b border-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {isAuthed ? (
              <div className="pt-4 space-y-1">
                <div className="pb-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  <p className="text-xs text-white/50">{userEmail}</p>
                </div>
                {menu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2.5 text-white/70 hover:text-white transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    window.location.href = '/api/auth/logout'
                  }}
                  className="w-full flex items-center gap-3 py-3 text-error border-t border-white/10 mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="pt-4 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-3 text-white/70 hover:text-white border border-white/20 rounded-lg transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/login?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-3 text-white bg-gradient-to-r from-brand-light to-brand rounded-lg hover:opacity-90 transition-opacity"
                >
                  Comenzar gratis
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function buildMenu(_role?: Role) {
  // Menú simplificado - enlaces extra están accesibles desde Dashboard
  return [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Mis cursos', href: '/dashboard/cursos', icon: '📚' },
    { label: 'Mis rutas', href: '/dashboard/rutas', icon: '🗺️' },
    { label: 'Mi perfil', href: '/dashboard/perfil', icon: '👤' },
  ]
}
