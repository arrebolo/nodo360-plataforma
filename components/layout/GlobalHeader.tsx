'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, LogOut } from 'lucide-react'
import { NotificationBell } from '@/components/notifications'
import { createClient } from '@/lib/supabase/client'
import { brandConfig } from '@/lib/brand-config'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  role: 'student' | 'instructor' | 'admin' | 'mentor'
  full_name?: string
  avatar_url?: string
  additionalRoles?: string[] // Roles de user_roles table
}

const navLinks = [
  { href: '/rutas', label: 'Rutas' },
  { href: '/cursos', label: 'Cursos' },
  { href: '/comunidad', label: 'Comunidad' },
  { href: '/mentoria', label: 'Mentoría' },
]

export function GlobalHeader() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (cancelled) return
        setUser(user)

        if (user) {
          // Obtener perfil básico
          const { data: profileData } = await supabase
            .from('users')
            .select('role, full_name, avatar_url')
            .eq('id', user.id)
            .single()

          // Obtener roles adicionales de user_roles (mentor, admin, council)
          // Nota: 'instructor' NO está en user_roles, solo en users.role
          const { data: userRoles } = await (supabase as any)
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true)

          if (!cancelled && profileData) {
            const additionalRoles = userRoles?.map((r: { role: string }) => r.role) || []
            setProfile({
              ...profileData,
              additionalRoles,
            } as UserProfile)
          }
        }
      } catch (error) {
        console.error('[GlobalHeader] Error fetching user:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null)
        if (!session?.user) {
          setProfile(null)
        }
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  // Opciones del dropdown según rol
  const getDropdownOptions = () => {
    const options = [
      { href: '/dashboard', label: 'Mi Dashboard', icon: '📊' },
      { href: '/dashboard/rutas', label: 'Mis Rutas', icon: '🗺️' },
      { href: '/dashboard/cursos', label: 'Mis Cursos', icon: '📚' },
      { href: '/dashboard/perfil', label: 'Mi Perfil', icon: '👤' },
    ]

    // Instructor: mostrar Gestionar Cursos + Promocionar
    if (profile?.role === 'instructor') {
      options.push(
        { href: '/dashboard/instructor/cursos', label: 'Gestionar Cursos', icon: '✏️' },
        { href: '/dashboard/instructor/referidos', label: 'Promocionar', icon: '🔗' }
      )
    }

    // Mentor: mostrar gestión de cursos + panel mentor
    if (profile?.role === 'mentor' || profile?.additionalRoles?.includes('mentor')) {
      options.push(
        { href: '/dashboard/instructor/cursos', label: 'Gestionar Cursos', icon: '✏️' },
        { href: '/dashboard/instructor/referidos', label: 'Promocionar', icon: '🔗' },
        { href: '/dashboard/mentor', label: 'Panel Mentor', icon: '👥' }
      )
    }

    // Admin/Council: mostrar todo
    if (profile?.role === 'admin' || profile?.additionalRoles?.includes('admin') || profile?.additionalRoles?.includes('council')) {
      options.push(
        { href: '/dashboard/instructor/cursos', label: 'Gestionar Cursos', icon: '✏️' },
        { href: '/dashboard/instructor/referidos', label: 'Promocionar', icon: '🔗' },
        { href: '/dashboard/mentor', label: 'Panel Mentor', icon: '👥' },
        { href: '/admin', label: 'Admin Panel', icon: '⚙️' }
      )
    }

    return options
  }

  const initials = profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'
  const displayName = profile?.full_name?.split(' ')[0] || 'Mi cuenta'

  return (
    <header className="sticky top-0 z-50 bg-dark/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
              <Image
                src={brandConfig.logo.url}
                alt={brandConfig.logo.alt}
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-semibold text-white group-hover:text-brand-light transition-colors">
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

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-28 bg-white/10 rounded-lg animate-pulse" />
            ) : user ? (
              /* Usuario logueado - Notificaciones + Dropdown */
              <>
                <NotificationBell />
                <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10
                             hover:bg-white/10 transition text-white"
                >
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-brand-light/20 flex items-center justify-center">
                      <span className="text-brand-light text-sm font-medium">{initials}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />

                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-surface border border-white/10
                                    shadow-xl shadow-black/20 z-50 overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">
                          {profile?.full_name || 'Usuario'}
                        </p>
                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 text-xs rounded-full bg-brand-light/20 text-brand-light capitalize">
                          {profile?.additionalRoles?.includes('council') ? 'council' :
                           profile?.additionalRoles?.includes('admin') ? 'admin' :
                           profile?.additionalRoles?.includes('mentor') ? 'mentor' :
                           profile?.role || 'student'}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="py-2">
                        {getDropdownOptions().map((option) => (
                          <Link
                            key={option.href}
                            href={option.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70
                                       hover:text-white hover:bg-white/5 transition"
                          >
                            <span>{option.icon}</span>
                            {option.label}
                          </Link>
                        ))}
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-white/10 py-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error
                                     hover:bg-error/10 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              </>
            ) : (
              /* Usuario NO logueado */
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
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-1">
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

            <div className="pt-4 border-t border-white/10 mt-4">
              {loading ? (
                <div className="h-10 bg-white/10 rounded-lg animate-pulse mx-4" />
              ) : user ? (
                <>
                  {/* User info mobile */}
                  <div className="px-4 py-3 mb-2">
                    <div className="flex items-center gap-3">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-brand-light/20 flex items-center justify-center">
                          <span className="text-brand-light text-lg font-medium">{initials}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{profile?.full_name || 'Usuario'}</p>
                        <p className="text-xs text-white/50">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Options mobile */}
                  {getDropdownOptions().map((option) => (
                    <Link
                      key={option.href}
                      href={option.href}
                      className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </Link>
                  ))}

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-error hover:bg-error/10 rounded-lg transition mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-4">
                  <Link
                    href="/login"
                    className="block text-center py-3 text-white/70 hover:text-white border border-white/20 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/login?mode=register"
                    className="block text-center py-3 text-white bg-gradient-to-r from-brand-light to-brand rounded-lg hover:opacity-90 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Comenzar gratis
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
