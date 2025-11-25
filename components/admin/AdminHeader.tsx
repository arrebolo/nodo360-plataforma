'use client'

import { Bell, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminHeaderProps {
  user: {
    full_name: string | null
    email: string
    role: string
  }
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <header className="bg-[#0f1419] border-b border-white/10 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumb - se puede agregar después */}
        <div>
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestiona usuarios, cursos y gamificación
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b35] rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#ff6b35] flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  {user.full_name || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[#0f1419] border border-white/10 rounded-lg shadow-xl z-20">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-sm text-white font-medium">
                      {user.full_name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
