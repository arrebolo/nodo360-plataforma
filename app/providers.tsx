'use client'

import { Toaster } from 'sonner'
import { AppShell } from '@/components/navigation/AppShell'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {/* AppShell - Sidebar + Topbar + Main */}
      <AppShell>
        {children}
      </AppShell>

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
