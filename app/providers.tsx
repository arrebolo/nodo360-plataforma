'use client'

import { Toaster } from 'sonner'
import { BadgeProvider } from '@/components/gamification/BadgeProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BadgeProvider>
      {/* Main content - SiteHeader is in root layout */}
      <main className="min-h-screen">
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
    </BadgeProvider>
  )
}


