'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/common/Logo'
import { Menu, X } from 'lucide-react'

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-black border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo + Title */}
        <Link href="/" className="flex items-center gap-3">
          <Logo size="sm" priority imageClassName="w-8 h-8" />
          <span className="font-bold text-lg bg-gradient-to-r from-[#F7931A] to-[#FDB931] bg-clip-text text-transparent">
            NODO360
          </span>
        </Link>

        {/* Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-white hover:text-[#F7931A] transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-black border-b border-[#2a2a2a] p-4">
          <nav className="flex flex-col gap-2">
            <Link
              href="/configuracion"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2 text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              ⚙️ Configuración
            </Link>
            <Link
              href="/perfil"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2 text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              👤 Perfil
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
