'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Route,
  Users,
  GraduationCap,
  LayoutDashboard,
  Settings,
  LogOut,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match?: 'exact' | 'startsWith'
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', icon: Home, match: 'exact' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: 'startsWith' },
  { href: '/cursos', label: 'Cursos', icon: BookOpen, match: 'startsWith' },
  { href: '/rutas', label: 'Rutas', icon: Route, match: 'startsWith' },
  { href: '/comunidad', label: 'Comunidad', icon: Users, match: 'startsWith' },
]

function isActive(pathname: string, item: NavItem): boolean {
  const mode = item.match || 'exact'
  if (mode === 'exact') return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

export function SlimSidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <>
      {/* Desktop Slim Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-16 flex-col bg-[#070a10] border-r border-white/10 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <Link href="/" className="group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">N</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-[#ff6b35]' : ''}`} />

                {/* Active indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-gradient-to-b from-[#ff6b35] to-[#f7931a]" />
                )}

                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-neutral-900 border border-white/10 text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="py-4 px-2 border-t border-white/10 flex flex-col gap-1">
          {user && (
            <>
              <Link
                href="/dashboard/configuracion"
                className="group relative w-12 h-12 rounded-xl flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
                title="Configuracion"
              >
                <Settings className="w-5 h-5" />
                <span className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-neutral-900 border border-white/10 text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                  Configuracion
                </span>
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
