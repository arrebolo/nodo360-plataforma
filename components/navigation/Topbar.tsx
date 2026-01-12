'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Compass, LayoutDashboard, Users } from 'lucide-react'

export const topbarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/rutas', label: 'Rutas', icon: Compass },
  { href: '/dashboard/cursos', label: 'Mis cursos', icon: BookOpen },
  { href: '/comunidad', label: 'Comunidad', icon: Users },
]

export function Topbar() {
  const pathname = usePathname()

  return (
    <div className="w-full border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-3 flex items-center gap-2">
        <nav className="flex items-center gap-2">
          {topbarLinks.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                  active
                    ? 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}


