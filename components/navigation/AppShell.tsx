'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/navigation/Topbar'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell - Contenedor global de navegacion
 *
 * Estructura:
 * - Sidebar fija a la izquierda (desktop) / bottom nav (mobile)
 * - Topbar sticky arriba (solo dropdown de usuario)
 * - Contenido principal con padding adecuado
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <>
      {/* Sidebar - Desktop (fixed left) + Mobile (bottom nav) */}
      <Sidebar />

      {/* Main content area with sidebar padding */}
      <div className="lg:pl-16 min-h-screen pb-20 lg:pb-0 flex flex-col">
        {/* Topbar - sticky top */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  )
}
