'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/common/Logo'
import {
  GraduationCap,
  Users,
  Rocket,
  MessageCircle,
  BookOpen,
  Settings,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/cursos', icon: GraduationCap, label: 'Cursos' },
  { href: '/comunidad', icon: Users, label: 'Comunidad' },
  { href: '/proyectos', icon: Rocket, label: 'Proyectos' },
  { href: '/mentoria', icon: MessageCircle, label: 'Mentoría' },
  { href: '/recursos', icon: BookOpen, label: 'Recursos' },
]

const bottomItems = [
  { href: '/configuracion', icon: Settings, label: 'Configuración' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/cursos') {
      return pathname?.startsWith('/cursos')
    }
    return pathname === href
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-16 flex-col items-center bg-black border-r border-[#2a2a2a] py-6 z-50">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="block" aria-label="Nodo360 Home">
            <Logo size="sm" priority imageClassName="w-8 h-8" />
          </Link>
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-[#2a2a2a] mb-8" />

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-[#F7931A]/10 text-[#F7931A]'
                    : 'text-gray-400 hover:text-[#F7931A] hover:scale-110'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                {active && (
                  <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(247,147,26,0.3)]" />
                )}

                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {item.label}
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
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-[#F7931A]/10 text-[#F7931A]'
                    : 'text-gray-400 hover:text-[#F7931A] hover:scale-110'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />

                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {item.label}
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
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
                  active ? 'text-[#F7931A]' : 'text-gray-400'
                }`}
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
