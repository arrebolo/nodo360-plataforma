'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
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
  Bookmark,
  FileText,
  Award,
  Shield,
} from 'lucide-react'

type NavItem = {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
  isPrivate?: boolean
}

// Items de navegacion principal
const navItems: NavItem[] = [
  { href: '/dashboard/rutas', icon: Route, label: 'Rutas', isPrivate: true },
  { href: '/cursos', icon: GraduationCap, label: 'Cursos' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', isPrivate: true },
  { href: '/dashboard/instructor', icon: Award, label: 'Instructor', isPrivate: true },
  { href: '/dashboard/mentor', icon: Shield, label: 'Mentor', isPrivate: true },
  { href: '/gobernanza', icon: Vote, label: 'Gobernanza' },
  { href: '/comunidad', icon: Users, label: 'Comunidad' },
  { href: '/mentoria', icon: MessageCircle, label: 'Mentoria' },
]

// Items inferiores (todos privados)
const bottomItems: NavItem[] = [
  { href: '/dashboard/guardados', icon: Bookmark, label: 'Guardados', isPrivate: true },
  { href: '/dashboard/notas', icon: FileText, label: 'Notas', isPrivate: true },
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
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  // Construir href con redirect si no esta autenticado
  const getHref = (item: NavItem): string => {
    if (!item.isPrivate) return item.href
    if (isAuthed) return item.href
    return `/login?redirect=${encodeURIComponent(item.href)}`
  }

  // Rutas que deben ser "startsWith"
  const activePrefixes = useMemo(
    () => new Set(['/dashboard/rutas', '/dashboard/instructor', '/dashboard/mentor', '/dashboard', '/cursos', '/gobernanza']),
    []
  )

  const isActive = (href: string) => {
    if (!pathname) return false
    if (activePrefixes.has(href)) return pathname.startsWith(href)
    return pathname === href
  }

  // ===== CLASES DEL DESIGN SYSTEM =====
  const linkBase =
    'relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-dark'

  const linkIdle = 'text-white/60 hover:text-brand hover:bg-white/5'
  const linkActive = 'text-brand bg-brand/10 ring-1 ring-brand/20'

  const tooltipBase =
    'absolute left-full ml-4 px-2 py-1 bg-dark-tertiary text-white text-xs rounded whitespace-nowrap ' +
    'opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60]'

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen w-16 flex-col items-center bg-dark border-r border-dark-border py-6 z-50"
        role="complementary"
        aria-label="Barra lateral de navegación"
      >
        {/* Logo con navegacion inteligente */}
        <div className="mb-8">
          <LogoLink className="block">
            <Logo size="sm" priority imageClassName="w-8 h-8" />
          </LogoLink>
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-dark-border mb-8" />

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col items-center gap-6" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon
            const href = getHref(item)
            const active = isActive(item.href)
            const isLoginRedirect = href.startsWith('/login')

            return (
              <Link
                key={item.href}
                href={href}
                className={[
                  linkBase,
                  active ? linkActive : linkIdle,
                  isLoginRedirect && item.isPrivate ? 'opacity-60' : '',
                ].join(' ')}
                title={item.label + (isLoginRedirect && item.isPrivate ? ' (requiere login)' : '')}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />

                {/* Tooltip */}
                <span className={tooltipBase} aria-hidden="true">
                  {item.label}
                  {isLoginRedirect && item.isPrivate && (
                    <span className="text-brand ml-1">(login)</span>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Separator */}
        <div className="w-8 h-px bg-dark-border mb-6" aria-hidden="true" />

        {/* Bottom Items */}
        <nav className="flex flex-col items-center gap-6" aria-label="Acciones de usuario">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const href = getHref(item)
            const active = isActive(item.href)
            const isLoginRedirect = href.startsWith('/login')

            return (
              <Link
                key={item.href}
                href={href}
                className={[
                  linkBase,
                  active ? linkActive : linkIdle,
                  isLoginRedirect && item.isPrivate ? 'opacity-60' : '',
                ].join(' ')}
                title={item.label + (isLoginRedirect && item.isPrivate ? ' (requiere login)' : '')}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />

                {/* Tooltip */}
                <span className={tooltipBase} aria-hidden="true">
                  {item.label}
                  {isLoginRedirect && item.isPrivate && (
                    <span className="text-brand ml-1">(login)</span>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark border-t border-dark-border z-50"
        aria-label="Navegación móvil"
      >
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
                className={[
                  'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-dark',
                  active ? 'text-brand' : 'text-white/60 hover:text-brand',
                  isLoginRedirect && item.isPrivate ? 'opacity-60' : '',
                ].join(' ')}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}


