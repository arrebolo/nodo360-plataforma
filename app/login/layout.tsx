// app/login/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Nodo360',
  description: 'Inicia sesión en tu cuenta de Nodo360',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
