'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { GlobalHeader } from '@/components/layout/GlobalHeader'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell - Contenedor global de navegacion
 *
 * Estructura:
 * - GlobalHeader sticky arriba (logo, nav, auth)
 * - Sidebar fija a la izquierda (desktop) / bottom nav (mobile)
 * - Contenido principal con dark theme
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-dark">
      {/* GlobalHeader - sticky top */}
      <GlobalHeader />

      {/* Sidebar - Desktop (fixed left) + Mobile (bottom nav) */}
      <Sidebar />

      {/* Main content area with sidebar padding */}
      <div className="lg:pl-16 min-h-screen pb-20 lg:pb-0 flex flex-col">
        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}


