'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Users, FileText } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'

interface SidebarProps {
  userEmail: string
  userRole: string
}

export default function Sidebar({ userEmail, userRole }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Cursos', href: '/admin/cursos', icon: BookOpen },
    { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { name: 'Reportes', href: '/admin/reportes', icon: FileText },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a1f2e] to-[#0f1419] border-r border-white/10">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">NODO360</h1>
            <p className="text-xs text-white/50">Panel Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white shadow-lg'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
            <span className="text-white font-bold">
              {userEmail[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userEmail}</p>
            <p className="text-xs text-white/50 capitalize">{userRole}</p>
          </div>
        </div>

        <LogoutButton
          variant="default"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg transition-all text-sm"
        />
      </div>
    </div>
  )
}
