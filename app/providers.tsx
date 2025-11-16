'use client'

import { Toaster } from 'sonner'
import { Sidebar } from '@/components/layout/Sidebar'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Sidebar - Desktop (fixed left) + Mobile (bottom nav) */}
      <Sidebar />

      {/* Main content with padding for sidebar */}
      <main className="lg:pl-16 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: '#0a0a0a',
            border: '1px solid #2a2a2a',
            color: '#fff',
          },
          className: 'sonner-toast',
        }}
      />
    </>
  )
}
