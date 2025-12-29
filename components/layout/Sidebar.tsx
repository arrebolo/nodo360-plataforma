'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/common/Logo'
import { LogoLink } from '@/components/navigation/LogoLink'
import {
  GraduationCap,
  Users,
  MessageCircle,
  Settings,
  User,
  Vote,
  Route,
  LayoutDashboard,
  Trophy,
  Award,
} from 'lucide-react'

type NavItem = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  isPrivate?: boolean
}

// Items de navegacion principal
const navItems: NavItem[] = [
  { href: '/dashboard/rutas', icon: Route, label: 'Rutas', isPrivate: true },
  { href: '/cursos', icon: GraduationCap, label: 'Cursos' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', isPrivate: true },
  { href: '/gobernanza', icon: Vote, label: 'Gobernanza' },
  { href: '/comunidad', icon: Users, label: 'Comunidad' },
  { href: '/mentoria', icon: MessageCircle, label: 'Mentoria' },
]

// Items inferiores (todos privados)
const bottomItems: NavItem[] = [
  { href: '/dashboard/configuracion', icon: Settings, label: 'Configuracion', isPrivate: true },
  { href: '/dashboard/perfil', icon: User, label: 'Perfil', isPrivate: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Estado inicial
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
    })

    // Escuchar cambios de auth en tiempo real
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthed(!!session)
      }
    )

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  // Construir href con redirect si no esta autenticado
  const getHref = (item: NavItem): string => {
    // Rutas publicas: sin cambios
    if (!item.isPrivate) return item.href

    // Rutas privadas con sesion: sin cambios
    if (isAuthed) return item.href

    // Rutas privadas sin sesion: redirigir a login con redirect param
    return `/login?redirect=${encodeURIComponent(item.href)}`
  }

  const isActive = (href: string) => {
    if (href === '/cursos' || href === '/dashboard/rutas' || href === '/gobernanza' || href === '/dashboard') {
      return pathname?.startsWith(href)
    }
    return pathname === href
  }

  // Mientras carga el estado de auth, mostrar items normales
  const isLoading = isAuthed === null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-16 flex-col items-center bg-black border-r border-[#2a2a2a] py-6 z-50">
        {/* Logo con navegacion inteligente */}
        <div className="mb-8">
          <LogoLink className="block">
            <Logo size="sm" priority imageClassName="w-8 h-8" />
          </LogoLink>
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-[#2a2a2a] mb-8" />

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const href = getHref(item)
            const active = isActive(item.href)
            const isLoginRedirect = href.startsWith('/login')

            return (
              <Link
                key={item.href}
                href={href}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-[#F7931A]/10 text-[#F7931A]'
                    : 'text-gray-400 hover:text-[#F7931A] hover:scale-110'
                } ${isLoginRedirect && item.isPrivate ? 'opacity-60' : ''}`}
                title={item.label + (isLoginRedirect && item.isPrivate ? ' (requiere login)' : '')}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                {active && (
                  <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(247,147,26,0.3)]" />
                )}

                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60]">
                  {item.label}
                  {isLoginRedirect && item.isPrivate && (
                    <span className="text-yellow-400 ml-1">(login)</span>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Separator */}
        <div className="w-8 h-px bg-[#2a2a2a] mb-6" />

        {/* Bottom Items */}
        <div className="flex flex-col items-center gap-6">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const href = getHref(item)
            const active = isActive(item.href)
            const isLoginRedirect = href.startsWith('/login')

            return (
              <Link
                key={item.href}
                href={href}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-[#F7931A]/10 text-[#F7931A]'
                    : 'text-gray-400 hover:text-[#F7931A] hover:scale-110'
                } ${isLoginRedirect && item.isPrivate ? 'opacity-60' : ''}`}
                title={item.label + (isLoginRedirect && item.isPrivate ? ' (requiere login)' : '')}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />

                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60]">
                  {item.label}
                  {isLoginRedirect && item.isPrivate && (
                    <span className="text-yellow-400 ml-1">(login)</span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-[#2a2a2a] z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const href = getHref(item)
            const active = isActive(item.href)
            const isLoginRedirect = href.startsWith('/login')

            return (
              <Link
                key={item.href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
                  active ? 'text-[#F7931A]' : 'text-gray-400'
                } ${isLoginRedirect && item.isPrivate ? 'opacity-60' : ''}`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
